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
    -- Handle NULL values
    IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Convert degrees to radians
    dlat := RADIANS(lat2 - lat1);
    dlon := RADIANS(lon2 - lon1);
    
    -- Haversine formula
    a := SIN(dlat/2) * SIN(dlat/2) + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * SIN(dlon/2) * SIN(dlon/2);
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;

-- Function to get the target warehouse for an order via delivery region
CREATE OR REPLACE FUNCTION get_target_warehouse_for_order(order_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    target_warehouse_id INTEGER;
BEGIN
    -- Get the warehouse through the delivery -> delivery_boy -> delivery_region chain
    SELECT dr.warehouse_id INTO target_warehouse_id
    FROM "Order" o
    JOIN "Delivery" d ON o.order_id = d.order_id
    JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
    JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
    WHERE o.order_id = order_id_param;
    
    -- If still not found, try alternative approach via address region
    IF target_warehouse_id IS NULL THEN
        SELECT dr.warehouse_id INTO target_warehouse_id
        FROM "Order" o
        JOIN "Delivery" d ON o.order_id = d.order_id
        JOIN "Address" a ON d.address_id = a.address_id
        JOIN "Region" r ON a.region_id = r.region_id
        JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
        WHERE o.order_id = order_id_param;
    END IF;
    
    RETURN target_warehouse_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get the target warehouse for a delivery (used when delivery is created)
CREATE OR REPLACE FUNCTION get_target_warehouse_for_delivery(delivery_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    target_warehouse_id INTEGER;
BEGIN
    -- Get the warehouse through the delivery_boy -> delivery_region chain
    SELECT dr.warehouse_id INTO target_warehouse_id
    FROM "Delivery" d
    JOIN "DeliveryBoy" db ON d.delivery_boy_id = db.user_id
    JOIN "DeliveryRegion" dr ON db.delivery_region_id = dr.delivery_region_id
    WHERE d.delivery_id = delivery_id_param;
    
    -- If still not found, try alternative approach via address region
    IF target_warehouse_id IS NULL THEN
        SELECT dr.warehouse_id INTO target_warehouse_id
        FROM "Delivery" d
        JOIN "Address" a ON d.address_id = a.address_id
        JOIN "Region" r ON a.region_id = r.region_id
        JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
        WHERE d.delivery_id = delivery_id_param;
    END IF;
    
    RETURN target_warehouse_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check and ensure inventory availability
CREATE OR REPLACE FUNCTION ensure_inventory_availability(
    product_id_param INTEGER,
    required_quantity_param INTEGER,
    target_warehouse_id_param INTEGER,
    order_id_param INTEGER,
    order_item_id_param INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_stock INTEGER;
    shortage INTEGER;
    warehouse_rec RECORD;
    transfer_quantity INTEGER;
    remaining_needed INTEGER;
    total_available INTEGER;
    target_warehouse_lat DECIMAL(9,6);
    target_warehouse_lon DECIMAL(9,6);
    source_stock_before INTEGER;
    target_stock_current INTEGER; -- Track current target stock throughout the function
    update_count INTEGER;
BEGIN
    -- Get target warehouse coordinates for distance calculation
    SELECT latitude, longitude INTO target_warehouse_lat, target_warehouse_lon
    FROM "Warehouse"
    WHERE warehouse_id = target_warehouse_id_param;
    
    IF target_warehouse_lat IS NULL THEN
        RAISE EXCEPTION 'Target warehouse % not found', target_warehouse_id_param;
    END IF;
    
    -- Ensure target warehouse has an inventory record (UPSERT)
    INSERT INTO "Inventory" (product_id, warehouse_id, quantity_in_stock, reorder_level, last_restock_date)
    VALUES (product_id_param, target_warehouse_id_param, 0, 20, CURRENT_TIMESTAMP)
    ON CONFLICT (product_id, warehouse_id) DO NOTHING;
    
    -- Get current stock in target warehouse with lock
    SELECT COALESCE(quantity_in_stock, 0) INTO current_stock
    FROM "Inventory"
    WHERE product_id = product_id_param AND warehouse_id = target_warehouse_id_param
    FOR UPDATE;
    
    -- Initialize target stock tracker
    target_stock_current := current_stock;
    
    RAISE NOTICE 'Starting inventory check: Target warehouse % has % units of product %', 
        target_warehouse_id_param, current_stock, product_id_param;
    
    -- Check if we have enough stock
    IF current_stock >= required_quantity_param THEN
        RAISE NOTICE 'Sufficient stock available: % >= %', current_stock, required_quantity_param;
        RETURN TRUE;
    END IF;
    
    -- Check total available inventory across all warehouses
    SELECT COALESCE(SUM(quantity_in_stock), 0) INTO total_available
    FROM "Inventory"
    WHERE product_id = product_id_param AND quantity_in_stock > 0;
    
    -- If total available is less than required, return false
    IF total_available < required_quantity_param THEN
        RAISE EXCEPTION 'Insufficient inventory: Product ID % requires % units but only % available across all warehouses', 
            product_id_param, required_quantity_param, total_available;
    END IF;
    
    -- Calculate shortage and perform transfers
    shortage := required_quantity_param - current_stock;
    remaining_needed := shortage;
    
    RAISE NOTICE 'Need to transfer % units for product % to warehouse %', shortage, product_id_param, target_warehouse_id_param;
    
    -- Find nearest warehouses with available stock, ordered by distance
    FOR warehouse_rec IN
        SELECT 
            i.warehouse_id,
            i.quantity_in_stock,
            w.latitude,
            w.longitude,
            w.name as warehouse_name,
            COALESCE(calculate_distance(
                w.latitude, w.longitude,
                target_warehouse_lat, target_warehouse_lon
            ), 999999) as distance
        FROM "Inventory" i
        JOIN "Warehouse" w ON i.warehouse_id = w.warehouse_id
        WHERE 
            i.product_id = product_id_param 
            AND i.warehouse_id != target_warehouse_id_param
            AND i.quantity_in_stock > 0
        ORDER BY distance ASC
        FOR UPDATE OF i
    LOOP
        -- Exit if we've fulfilled the requirement
        IF remaining_needed <= 0 THEN
            EXIT;
        END IF;
        
        -- Calculate how much to transfer from this warehouse
        transfer_quantity := LEAST(warehouse_rec.quantity_in_stock, remaining_needed);
        source_stock_before := warehouse_rec.quantity_in_stock;
        
        RAISE NOTICE 'Transferring % units from warehouse % to warehouse % (target currently has %)', 
            transfer_quantity, warehouse_rec.warehouse_id, target_warehouse_id_param, target_stock_current;
        
        -- Update source warehouse inventory
        UPDATE "Inventory"
        SET quantity_in_stock = quantity_in_stock - transfer_quantity,
            last_restock_date = CURRENT_TIMESTAMP
        WHERE product_id = product_id_param AND warehouse_id = warehouse_rec.warehouse_id;
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
        IF update_count = 0 THEN
            RAISE EXCEPTION 'Failed to update source warehouse % inventory for product %', 
                warehouse_rec.warehouse_id, product_id_param;
        END IF;
        
        -- Update target warehouse inventory
        UPDATE "Inventory"
        SET quantity_in_stock = quantity_in_stock + transfer_quantity,
            last_restock_date = CURRENT_TIMESTAMP
        WHERE product_id = product_id_param AND warehouse_id = target_warehouse_id_param;
        
        GET DIAGNOSTICS update_count = ROW_COUNT;
        IF update_count = 0 THEN
            RAISE EXCEPTION 'Failed to update target warehouse % inventory for product %', 
                target_warehouse_id_param, product_id_param;
        END IF;
        
        -- Update our local tracking variable
        target_stock_current := target_stock_current + transfer_quantity;
        
        RAISE NOTICE 'Updated target warehouse inventory: % + % = %', 
            target_stock_current - transfer_quantity, transfer_quantity, target_stock_current;
        
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
            order_id_param,
            order_item_id_param,
            product_id_param,
            warehouse_rec.warehouse_id,
            target_warehouse_id_param,
            transfer_quantity,
            source_stock_before,
            source_stock_before - transfer_quantity,
            target_stock_current - transfer_quantity, -- Use the tracked value
            target_stock_current, -- Use the tracked value
            'ORDER_FULFILLMENT',
            warehouse_rec.distance
        );
        
        -- Update remaining needed
        remaining_needed := remaining_needed - transfer_quantity;
        
        RAISE NOTICE 'Transfer completed. Remaining needed: %, Target stock now: %', 
            remaining_needed, target_stock_current;
    END LOOP;
    
    -- Check if we still have shortage
    IF remaining_needed > 0 THEN
        RAISE EXCEPTION 'Unable to fulfill inventory requirement: Product ID % still needs % more units after transfers', 
            product_id_param, remaining_needed;
    END IF;
    
    -- Final verification: Check actual stock in target warehouse
    SELECT quantity_in_stock INTO current_stock
    FROM "Inventory"
    WHERE product_id = product_id_param AND warehouse_id = target_warehouse_id_param;
    
    RAISE NOTICE 'Final verification: Target warehouse % should have % units, actually has % units of product %', 
        target_warehouse_id_param, target_stock_current, current_stock, product_id_param;
    
    -- Alert if there's a mismatch
    IF current_stock != target_stock_current THEN
        RAISE WARNING 'INVENTORY MISMATCH: Expected % but found % in target warehouse %', 
            target_stock_current, current_stock, target_warehouse_id_param;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to handle inventory transfers when delivery is created
CREATE OR REPLACE FUNCTION handle_delivery_inventory_transfer()
RETURNS TRIGGER AS $$
DECLARE
    target_warehouse_id INTEGER;
    item_record RECORD;
BEGIN
    -- Get the target warehouse for this delivery
    target_warehouse_id := get_target_warehouse_for_delivery(NEW.delivery_id);
    
    -- If we can't determine the target warehouse, raise an exception
    IF target_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'Cannot determine target warehouse for delivery %', NEW.delivery_id;
    END IF;
    
    -- Process all order items for this order
    FOR item_record IN
        SELECT order_item_id, product_id, quantity
        FROM "OrderItem"
        WHERE order_id = NEW.order_id
    LOOP
        -- Ensure inventory availability and perform transfers if needed
        PERFORM ensure_inventory_availability(
            item_record.product_id,
            item_record.quantity,
            target_warehouse_id,
            NEW.order_id,
            item_record.order_item_id
        );
        
        -- Deduct inventory from target warehouse
        UPDATE "Inventory"
        SET quantity_in_stock = quantity_in_stock - item_record.quantity
        WHERE product_id = item_record.product_id AND warehouse_id = target_warehouse_id;
        
        -- Verify the update was successful
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Failed to deduct inventory for product % from warehouse %', 
                item_record.product_id, target_warehouse_id;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle inventory when new order items are added (after delivery exists)
CREATE OR REPLACE FUNCTION handle_orderitem_inventory()
RETURNS TRIGGER AS $$
DECLARE
    target_warehouse_id INTEGER;
    delivery_exists BOOLEAN;
BEGIN
    -- Check if delivery record exists for this order
    SELECT EXISTS(
        SELECT 1 FROM "Delivery" WHERE order_id = NEW.order_id
    ) INTO delivery_exists;
    
    -- If no delivery exists, we can't handle inventory yet
    IF NOT delivery_exists THEN
        RETURN NEW;
    END IF;
    
    -- Get the target warehouse for this order
    target_warehouse_id := get_target_warehouse_for_order(NEW.order_id);
    
    -- If we can't determine the target warehouse, raise an exception
    IF target_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'Cannot determine target warehouse for order %', NEW.order_id;
    END IF;
    
    -- Ensure inventory availability and perform transfers if needed
    PERFORM ensure_inventory_availability(
        NEW.product_id,
        NEW.quantity,
        target_warehouse_id,
        NEW.order_id,
        NEW.order_item_id
    );
    
    -- Deduct inventory from target warehouse
    UPDATE "Inventory"
    SET quantity_in_stock = quantity_in_stock - NEW.quantity
    WHERE product_id = NEW.product_id AND warehouse_id = target_warehouse_id;
    
    -- Verify the update was successful
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Failed to deduct inventory for product % from warehouse %', 
            NEW.product_id, target_warehouse_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle inventory updates when OrderItem quantity changes
CREATE OR REPLACE FUNCTION handle_orderitem_inventory_update()
RETURNS TRIGGER AS $$
DECLARE
    quantity_difference INTEGER;
    target_warehouse_id INTEGER;
    delivery_exists BOOLEAN;
BEGIN
    -- Calculate the difference in quantity
    quantity_difference := NEW.quantity - OLD.quantity;
    
    -- If no change, return
    IF quantity_difference = 0 THEN
        RETURN NEW;
    END IF;
    
    -- Check if delivery record exists for this order
    SELECT EXISTS(
        SELECT 1 FROM "Delivery" WHERE order_id = NEW.order_id
    ) INTO delivery_exists;
    
    -- If no delivery exists, skip inventory handling
    IF NOT delivery_exists THEN
        RETURN NEW;
    END IF;
    
    -- Get the target warehouse for this order
    target_warehouse_id := get_target_warehouse_for_order(NEW.order_id);
    
    -- If we can't determine the target warehouse, raise an exception
    IF target_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'Cannot determine target warehouse for order %', NEW.order_id;
    END IF;
    
    -- If quantity increased, ensure availability and deduct additional inventory
    IF quantity_difference > 0 THEN
        -- Ensure inventory availability for the additional quantity
        PERFORM ensure_inventory_availability(
            NEW.product_id,
            quantity_difference,
            target_warehouse_id,
            NEW.order_id,
            NEW.order_item_id
        );
        
        -- Deduct additional inventory from target warehouse
        UPDATE "Inventory"
        SET quantity_in_stock = quantity_in_stock - quantity_difference
        WHERE product_id = NEW.product_id AND warehouse_id = target_warehouse_id;
        
    -- If quantity decreased, return inventory to the target warehouse
    ELSIF quantity_difference < 0 THEN
        -- Return inventory to target warehouse
        UPDATE "Inventory"
        SET quantity_in_stock = quantity_in_stock + ABS(quantity_difference)
        WHERE product_id = NEW.product_id AND warehouse_id = target_warehouse_id;
        
        -- If inventory record doesn't exist, create it
        IF NOT FOUND THEN
            INSERT INTO "Inventory" (product_id, warehouse_id, quantity_in_stock, reorder_level)
            VALUES (NEW.product_id, target_warehouse_id, ABS(quantity_difference), 10);
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle order cancellations (return inventory)
CREATE OR REPLACE FUNCTION handle_order_cancellation()
RETURNS TRIGGER AS $$
DECLARE
    target_warehouse_id INTEGER;
    item_record RECORD;
BEGIN
    -- This function should be called when order status changes to 'cancelled'
    -- Check if the status change is to cancelled
    IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
        -- Get the target warehouse for this order
        target_warehouse_id := get_target_warehouse_for_order(NEW.entity_id);
        
        -- If we can determine the target warehouse, return inventory
        IF target_warehouse_id IS NOT NULL THEN
            -- Return inventory for all items in the cancelled order
            FOR item_record IN
                SELECT product_id, quantity
                FROM "OrderItem"
                WHERE order_id = NEW.entity_id
            LOOP
                -- Return inventory to target warehouse
                UPDATE "Inventory"
                SET quantity_in_stock = quantity_in_stock + item_record.quantity
                WHERE product_id = item_record.product_id AND warehouse_id = target_warehouse_id;
                
                -- If inventory record doesn't exist, create it
                IF NOT FOUND THEN
                    INSERT INTO "Inventory" (product_id, warehouse_id, quantity_in_stock, reorder_level)
                    VALUES (item_record.product_id, target_warehouse_id, item_record.quantity, 10);
                END IF;
            END LOOP;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle return requests (return inventory)
CREATE OR REPLACE FUNCTION handle_return_inventory()
RETURNS TRIGGER AS $$
DECLARE
    target_warehouse_id INTEGER;
    order_id_val INTEGER;
    product_id_val INTEGER;
    quantity_val INTEGER;
BEGIN
    -- Only process when return is approved and received
    IF NEW.status = 'received' AND (OLD.status IS NULL OR OLD.status != 'received') THEN
        -- Get order and product details
        SELECT oi.order_id, oi.product_id, oi.quantity
        INTO order_id_val, product_id_val, quantity_val
        FROM "OrderItem" oi
        WHERE oi.order_item_id = NEW.order_item_id;
        
        -- Get the target warehouse for this order
        target_warehouse_id := get_target_warehouse_for_order(order_id_val);
        
        -- If we can determine the target warehouse, return inventory
        IF target_warehouse_id IS NOT NULL THEN
            -- Return inventory to target warehouse
            UPDATE "Inventory"
            SET quantity_in_stock = quantity_in_stock + quantity_val
            WHERE product_id = product_id_val AND warehouse_id = target_warehouse_id;
            
            -- If inventory record doesn't exist, create it
            IF NOT FOUND THEN
                INSERT INTO "Inventory" (product_id, warehouse_id, quantity_in_stock, reorder_level)
                VALUES (product_id_val, target_warehouse_id, quantity_val, 10);
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS inventory_transfer_trigger ON "OrderItem";
DROP TRIGGER IF EXISTS inventory_deduction_trigger ON "OrderItem";
DROP TRIGGER IF EXISTS inventory_update_trigger ON "OrderItem";
DROP TRIGGER IF EXISTS delivery_inventory_trigger ON "Delivery";
DROP TRIGGER IF EXISTS order_cancellation_trigger ON "StatusHistory";
DROP TRIGGER IF EXISTS return_inventory_trigger ON "ReturnRequest";

-- Create the main trigger for when delivery is created (this handles all inventory transfers)
CREATE TRIGGER delivery_inventory_trigger
    AFTER INSERT ON "Delivery"
    FOR EACH ROW
    EXECUTE FUNCTION handle_delivery_inventory_transfer();

-- Create trigger for when new order items are added after delivery exists
CREATE TRIGGER orderitem_inventory_trigger
    AFTER INSERT ON "OrderItem"
    FOR EACH ROW
    EXECUTE FUNCTION handle_orderitem_inventory();

-- Create trigger for when order item quantities are updated
CREATE TRIGGER orderitem_inventory_update_trigger
    AFTER UPDATE ON "OrderItem"
    FOR EACH ROW
    WHEN (OLD.quantity != NEW.quantity)
    EXECUTE FUNCTION handle_orderitem_inventory_update();

-- Create trigger for order cancellations
CREATE TRIGGER order_cancellation_trigger
    AFTER UPDATE ON "StatusHistory"
    FOR EACH ROW
    WHEN (NEW.entity_type = 'order')
    EXECUTE FUNCTION handle_order_cancellation();

-- Create trigger for return requests
CREATE TRIGGER return_inventory_trigger
    AFTER UPDATE ON "ReturnRequest"
    FOR EACH ROW
    EXECUTE FUNCTION handle_return_inventory();


-- Fixed version - removes the unnecessary deduction
CREATE OR REPLACE FUNCTION process_existing_order_inventory(order_id_param INTEGER)
RETURNS VOID AS $$
DECLARE
    target_warehouse_id INTEGER;
    item_record RECORD;
    delivery_exists BOOLEAN;
    current_stock INTEGER;
    final_stock INTEGER;
BEGIN
    -- Check if delivery record exists for this order
    SELECT EXISTS(
        SELECT 1 FROM "Delivery" WHERE order_id = order_id_param
    ) INTO delivery_exists;
    
    -- If no delivery exists, we can't process inventory
    IF NOT delivery_exists THEN
        RAISE EXCEPTION 'No delivery record found for order %', order_id_param;
    END IF;
    
    -- Get the target warehouse for this order
    target_warehouse_id := get_target_warehouse_for_order(order_id_param);
    
    -- If we can't determine the target warehouse, raise an exception
    IF target_warehouse_id IS NULL THEN
        RAISE EXCEPTION 'Cannot determine target warehouse for order %', order_id_param;
    END IF;
    
    RAISE NOTICE 'Processing inventory for order % with target warehouse %', order_id_param, target_warehouse_id;
    
    -- Process all order items for this order
    FOR item_record IN
        SELECT order_item_id, product_id, quantity
        FROM "OrderItem"
        WHERE order_id = order_id_param
    LOOP
        RAISE NOTICE 'Processing item %: product %, quantity %', 
            item_record.order_item_id, item_record.product_id, item_record.quantity;
        
        -- Check current stock before processing
        SELECT COALESCE(quantity_in_stock, 0) INTO current_stock
        FROM "Inventory"
        WHERE product_id = item_record.product_id AND warehouse_id = target_warehouse_id;
        
        RAISE NOTICE 'Current stock for product % in warehouse %: %', 
            item_record.product_id, target_warehouse_id, current_stock;
        
        -- Ensure inventory availability and perform transfers if needed
        -- This function handles moving inventory TO the target warehouse
        PERFORM ensure_inventory_availability(
            item_record.product_id,
            item_record.quantity,
            target_warehouse_id,
            order_id_param,
            item_record.order_item_id
        );
        
        -- Check stock after transfers
        SELECT COALESCE(quantity_in_stock, 0) INTO final_stock
        FROM "Inventory"
        WHERE product_id = item_record.product_id AND warehouse_id = target_warehouse_id;
        
        RAISE NOTICE 'Final stock after transfers for product % in warehouse %: %', 
            item_record.product_id, target_warehouse_id, final_stock;
        
        -- REMOVED: The inventory deduction that was causing the problem
        -- The ensure_inventory_availability_fixed function already handles 
        -- getting the inventory to the target warehouse for fulfillment
        
    END LOOP;
    
    RAISE NOTICE 'Inventory processed successfully for order %', order_id_param;
END;
$$ LANGUAGE plpgsql;