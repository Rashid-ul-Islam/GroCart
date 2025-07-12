CREATE OR REPLACE FUNCTION handle_inventory_transfer()
RETURNS TRIGGER AS $$
DECLARE
    target_warehouse_id INT;
    current_stock INT;
    needed_quantity INT;
    shortage_quantity INT;
    source_warehouse_id INT;
    available_quantity INT;
    transfer_quantity INT;
    source_warehouse_record RECORD;
    source_stock_before INT;
    source_stock_after INT;
    target_stock_before INT;
    target_stock_after INT;
    calculated_distance DECIMAL(10,2);
BEGIN
    -- Get the target warehouse for this order
    SELECT w.warehouse_id
    INTO target_warehouse_id
    FROM "Order" o
    JOIN "Delivery" d ON o.order_id = d.order_id
    JOIN "Address" a ON d.address_id = a.address_id
    JOIN "Region" r ON a.region_id = r.region_id
    JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
    JOIN "Warehouse" w ON dr.warehouse_id = w.warehouse_id
    WHERE o.order_id = NEW.order_id;
    
    -- If no target warehouse found, skip the transfer
    IF target_warehouse_id IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get current stock in target warehouse
    SELECT COALESCE(quantity_in_stock, 0)
    INTO current_stock
    FROM "Inventory"
    WHERE product_id = NEW.product_id AND warehouse_id = target_warehouse_id;
    
    -- If no inventory record exists, create one with 0 quantity
    IF current_stock IS NULL THEN
        INSERT INTO "Inventory" (product_id, warehouse_id, quantity_in_stock, reorder_level)
        VALUES (NEW.product_id, target_warehouse_id, 0, 0);
        current_stock := 0;
    END IF;
    
    needed_quantity := NEW.quantity;
    
    -- Check if we need to transfer products
    IF current_stock < needed_quantity THEN
        shortage_quantity := needed_quantity - current_stock;
        
        -- Store initial target stock for logging
        target_stock_before := current_stock;
        
        -- Find nearest warehouses with the required product, ordered by distance
        FOR source_warehouse_record IN
            SELECT 
                i.warehouse_id,
                i.quantity_in_stock,
                w.latitude,
                w.longitude,
                target_w.latitude as target_lat,
                target_w.longitude as target_lng,
                SQRT(
                    POWER(w.latitude - target_w.latitude, 2) + 
                    POWER(w.longitude - target_w.longitude, 2)
                ) as distance
            FROM "Inventory" i
            JOIN "Warehouse" w ON i.warehouse_id = w.warehouse_id
            JOIN "Warehouse" target_w ON target_w.warehouse_id = target_warehouse_id
            WHERE i.product_id = NEW.product_id 
                AND i.warehouse_id != target_warehouse_id
                AND i.quantity_in_stock > 0
            ORDER BY distance ASC
        LOOP
            -- Store source stock before transfer for logging
            source_stock_before := source_warehouse_record.quantity_in_stock;
            
            -- Calculate how much we can transfer from this warehouse
            available_quantity := source_warehouse_record.quantity_in_stock;
            transfer_quantity := LEAST(available_quantity, shortage_quantity);
            calculated_distance := source_warehouse_record.distance * 111.32; -- Convert to approximate km
            
            -- Update source warehouse inventory (decrease)
            UPDATE "Inventory"
            SET quantity_in_stock = quantity_in_stock - transfer_quantity
            WHERE product_id = NEW.product_id 
                AND warehouse_id = source_warehouse_record.warehouse_id;
            
            -- Calculate source stock after transfer
            source_stock_after := source_stock_before - transfer_quantity;
            
            -- Update target warehouse inventory (increase)
            UPDATE "Inventory"
            SET quantity_in_stock = quantity_in_stock + transfer_quantity
            WHERE product_id = NEW.product_id 
                AND warehouse_id = target_warehouse_id;
            
            -- Calculate target stock after transfer
            target_stock_after := target_stock_before + transfer_quantity;
            
            -- Log the transfer
            INSERT INTO "InventoryTransferLog" (
                order_id,
                order_item_id,
                product_id,
                source_warehouse_id,
                target_warehouse_id,
                quantity_transferred,
                source_stock_before,
                source_stock_after,
                target_stock_before,
                target_stock_after,
                transfer_reason,
                distance_km
            ) VALUES (
                NEW.order_id,
                NEW.order_item_id,
                NEW.product_id,
                source_warehouse_record.warehouse_id,
                target_warehouse_id,
                transfer_quantity,
                source_stock_before,
                source_stock_after,
                target_stock_before,
                target_stock_after,
                'ORDER_FULFILLMENT',
                calculated_distance
            );
            
            -- Update target stock before for next iteration
            target_stock_before := target_stock_after;
            
            -- Reduce shortage quantity
            shortage_quantity := shortage_quantity - transfer_quantity;
            
            -- If we've fulfilled the shortage, break out of the loop
            IF shortage_quantity <= 0 THEN
                EXIT;
            END IF;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
