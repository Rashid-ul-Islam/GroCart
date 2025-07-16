-- Function to calculate distance between two points using Haversine formula
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL(9,6), 
    lon1 DECIMAL(9,6), 
    lat2 DECIMAL(9,6), 
    lon2 DECIMAL(9,6)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
    dlat DECIMAL;
    dlon DECIMAL;
    a DECIMAL;
    c DECIMAL;
BEGIN
    -- Convert degrees to radians
    dlat := RADIANS(lat2 - lat1);
    dlon := RADIANS(lon2 - lon1);
    
    -- Haversine formula
    a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;

-- Main function to handle inventory transfers
CREATE OR REPLACE FUNCTION handle_inventory_transfer()
RETURNS TRIGGER AS $$
DECLARE
    target_warehouse_id INTEGER;
    current_stock INTEGER;
    required_quantity INTEGER;
    shortage INTEGER;
    warehouse_rec RECORD;
    transfer_quantity INTEGER;
    remaining_needed INTEGER;
BEGIN
    -- Get the target warehouse for this order (assuming it's determined by delivery address)
    -- This is a simplified approach - you might need to adjust based on your business logic
    SELECT dr.warehouse_id INTO target_warehouse_id
    FROM "Order" o
    JOIN "Delivery" d ON o.order_id = d.order_id
    JOIN "Address" a ON d.address_id = a.address_id
    JOIN "Region" r ON a.region_id = r.region_id
    JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
    WHERE o.order_id = NEW.order_id;
    
    -- If no target warehouse found, use the first available warehouse
    IF target_warehouse_id IS NULL THEN
        SELECT warehouse_id INTO target_warehouse_id
        FROM "Warehouse"
        ORDER BY warehouse_id
        LIMIT 1;
    END IF;
    
    -- Get current stock in target warehouse
    SELECT COALESCE(quantity_in_stock, 0) INTO current_stock
    FROM "Inventory"
    WHERE product_id = NEW.product_id AND warehouse_id = target_warehouse_id;
    
    required_quantity := NEW.quantity;
    
    -- Check if we have enough stock
    IF current_stock >= required_quantity THEN
        -- Update inventory in target warehouse
        UPDATE "Inventory"
        SET quantity_in_stock = quantity_in_stock - required_quantity
        WHERE product_id = NEW.product_id AND warehouse_id = target_warehouse_id;
        
        RETURN NEW;
    END IF;
    
    -- Calculate shortage
    shortage := required_quantity - current_stock;
    remaining_needed := shortage;
    
    -- Find nearest warehouses with available stock, ordered by distance
    FOR warehouse_rec IN
        SELECT 
            i.warehouse_id,
            i.quantity_in_stock,
            w.latitude,
            w.longitude,
            calculate_distance(
                w.latitude, w.longitude,
                tw.latitude, tw.longitude
            ) as distance
        FROM "Inventory" i
        JOIN "Warehouse" w ON i.warehouse_id = w.warehouse_id
        JOIN "Warehouse" tw ON tw.warehouse_id = target_warehouse_id
        WHERE 
            i.product_id = NEW.product_id 
            AND i.warehouse_id != target_warehouse_id
            AND i.quantity_in_stock > 0
        ORDER BY distance ASC
    LOOP
        -- Exit if we've fulfilled the requirement
        IF remaining_needed <= 0 THEN
            EXIT;
        END IF;
        
        -- Calculate how much to transfer from this warehouse
        transfer_quantity := LEAST(warehouse_rec.quantity_in_stock, remaining_needed);
        
        -- Update source warehouse inventory
        UPDATE "Inventory"
        SET quantity_in_stock = quantity_in_stock - transfer_quantity
        WHERE product_id = NEW.product_id AND warehouse_id = warehouse_rec.warehouse_id;
        
        -- Update target warehouse inventory (or insert if doesn't exist)
        INSERT INTO "Inventory" (product_id, warehouse_id, quantity_in_stock)
        VALUES (NEW.product_id, target_warehouse_id, transfer_quantity)
        ON CONFLICT (product_id, warehouse_id)
        DO UPDATE SET quantity_in_stock = "Inventory".quantity_in_stock + transfer_quantity;
        
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
            warehouse_rec.warehouse_id,
            target_warehouse_id,
            transfer_quantity,
            warehouse_rec.quantity_in_stock,
            warehouse_rec.quantity_in_stock - transfer_quantity,
            current_stock,
            current_stock + transfer_quantity,
            'ORDER_FULFILLMENT',
            warehouse_rec.distance
        );
        
        -- Update remaining needed and current stock
        remaining_needed := remaining_needed - transfer_quantity;
        current_stock := current_stock + transfer_quantity;
    END LOOP;
    
    -- Final update to target warehouse inventory after all transfers
    UPDATE "Inventory"
    SET quantity_in_stock = quantity_in_stock - required_quantity
    WHERE product_id = NEW.product_id AND warehouse_id = target_warehouse_id;
    
    -- Check if we still have shortage (this shouldn't happen based on your guarantee)
    IF remaining_needed > 0 THEN
        RAISE EXCEPTION 'Insufficient inventory: Product ID % requires % more units than available across all warehouses', 
            NEW.product_id, remaining_needed;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER inventory_transfer_trigger
    AFTER INSERT ON "OrderItem"
    FOR EACH ROW
    EXECUTE FUNCTION handle_inventory_transfer();

-- Optional: Create a trigger to handle updates to OrderItem quantity
CREATE OR REPLACE FUNCTION handle_inventory_transfer_update()
RETURNS TRIGGER AS $$
DECLARE
    quantity_difference INTEGER;
BEGIN
    -- Calculate the difference in quantity
    quantity_difference := NEW.quantity - OLD.quantity;
    
    -- If quantity increased, treat it as a new order for the difference
    IF quantity_difference > 0 THEN
        -- Create a temporary record to process the additional quantity
        INSERT INTO "OrderItem" (order_id, product_id, quantity, price)
        VALUES (NEW.order_id, NEW.product_id, quantity_difference, NEW.price);
        
        -- Remove the temporary record (the trigger will have already processed it)
        DELETE FROM "OrderItem" 
        WHERE order_id = NEW.order_id 
        AND product_id = NEW.product_id 
        AND quantity = quantity_difference 
        AND price = NEW.price
        AND order_item_id = (
            SELECT MAX(order_item_id) FROM "OrderItem" 
            WHERE order_id = NEW.order_id 
            AND product_id = NEW.product_id 
            AND quantity = quantity_difference
        );
    END IF;
    
    -- Note: Handling quantity decrease would require returning inventory, 
    -- which might be complex based on business rules
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inventory_transfer_update_trigger
    AFTER UPDATE ON "OrderItem"
    FOR EACH ROW
    WHEN (OLD.quantity != NEW.quantity)
    EXECUTE FUNCTION handle_inventory_transfer_update();