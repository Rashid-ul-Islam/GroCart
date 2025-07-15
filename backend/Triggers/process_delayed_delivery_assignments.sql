CREATE OR REPLACE FUNCTION process_delayed_delivery_assignments()
RETURNS VOID AS $$
DECLARE
    order_record RECORD;
    delivery_info RECORD;
    assigned_delivery_boy_id INT;
BEGIN
    -- Find orders placed 1 day ago that don't have delivery assigned yet
    FOR order_record IN
        SELECT o.order_id, o.user_id, o.order_date
        FROM "Order" o
        LEFT JOIN "Delivery" d ON o.order_id = d.order_id
        WHERE d.delivery_id IS NULL
          AND o.order_date::DATE = (CURRENT_DATE - INTERVAL '1 day')::DATE
          AND o.payment_status = 'paid'  -- Assuming only paid orders should be processed
    LOOP
        -- Get delivery region info for this order
        SELECT * INTO delivery_info
        FROM find_delivery_region_for_user(order_record.user_id);
        
        -- If delivery region found, assign delivery boy
        IF delivery_info.delivery_region_id IS NOT NULL THEN
            assigned_delivery_boy_id := assign_delivery_boy(delivery_info.delivery_region_id, order_record.order_id);
            
            -- Log the assignment
            RAISE NOTICE 'Assigned delivery boy % to order %', assigned_delivery_boy_id, order_record.order_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;