CREATE OR REPLACE FUNCTION assign_delivery_boy(p_delivery_region_id INT, p_order_id INT)
RETURNS INT AS $$
DECLARE
    selected_delivery_boy_id INT;
    order_user_id INT;
    user_address_id INT;
    delivery_id INT;
    estimated_delivery TIMESTAMP;
BEGIN
    -- Get order details
    SELECT user_id INTO order_user_id FROM "Order" WHERE order_id = p_order_id;
    
    -- Get user's primary address
    SELECT address_id INTO user_address_id 
    FROM "Address" 
    WHERE user_id = order_user_id AND "isPrimary" = true
    LIMIT 1;
    
    -- If no primary address, get any address
    IF user_address_id IS NULL THEN
        SELECT address_id INTO user_address_id 
        FROM "Address" 
        WHERE user_id = order_user_id
        LIMIT 1;
    END IF;
    
    -- Find delivery boy with minimum load in the delivery region
    SELECT user_id INTO selected_delivery_boy_id
    FROM "DeliveryBoy"
    WHERE delivery_region_id = p_delivery_region_id
      AND availability_status = 'available'
    ORDER BY current_load ASC, user_id ASC
    LIMIT 1;
    
    -- Calculate estimated delivery time
    SELECT estimated_delivery_date INTO estimated_delivery
    FROM calculate_shipping_and_delivery(p_order_id);
    
    -- Create delivery record
    INSERT INTO "Delivery" (order_id, address_id, delivery_boy_id, estimated_arrival, created_at, updated_at)
    VALUES (p_order_id, user_address_id, selected_delivery_boy_id, estimated_delivery, NOW(), NOW())
    RETURNING delivery_id INTO delivery_id;
    
    -- Update delivery boy's current load
    UPDATE "DeliveryBoy" 
    SET current_load = current_load + 1
    WHERE user_id = selected_delivery_boy_id;
    
    -- Add status history
    INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_at, notes)
    VALUES ('delivery', delivery_id, 'assigned', NOW(), 'Delivery boy assigned');
    
    RETURN selected_delivery_boy_id;
END;
$$ LANGUAGE plpgsql;