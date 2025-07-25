-- Your Delivery table already has 'current_status' column, so we'll use that
-- Add constraint for valid delivery statuses if not exists
-- DO $ 
-- BEGIN
--     IF NOT EXISTS (
--         SELECT 1 FROM information_schema.constraint_column_usage 
--         WHERE constraint_name = 'check_valid_delivery_status'
--     ) THEN
--         ALTER TABLE "Delivery" ADD CONSTRAINT check_valid_delivery_status CHECK (
--           current_status IN ('assigned', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled')
--         );
--     END IF;
-- END $;

-- Create index for delivery status if not exists
-- CREATE INDEX IF NOT EXISTS idx_delivery_current_status ON "Delivery" ("current_status");

-- =============================================
-- TRIGGER 1: Notification when delivery is created (for customer)
-- =============================================

CREATE OR REPLACE FUNCTION notify_customer_delivery_assigned()
RETURNS TRIGGER AS $$
DECLARE
    delivery_boy_name varchar;
    delivery_boy_phone varchar;
    notification_title varchar;
    notification_message text;
BEGIN
    -- Get delivery boy's name and phone number
    SELECT 
        COALESCE(u.first_name || ' ' || u.last_name) as full_name,
        u.phone_number
    INTO delivery_boy_name, delivery_boy_phone
    FROM "User" u
    INNER JOIN "DeliveryBoy" db ON u.user_id = db.user_id
    WHERE db.user_id = NEW.delivery_boy_id
    LIMIT 1;
    
    -- Prepare notification content
    notification_title := 'Delivery Boy Assigned';
    notification_message := 'Great news! Your order has been assigned to delivery boy ' || 
                           COALESCE(delivery_boy_name, 'our delivery partner') || '.';
    
    -- Add phone number if available
    IF delivery_boy_phone IS NOT NULL THEN
        notification_message := notification_message || ' Contact: ' || delivery_boy_phone;
    END IF;
    
    notification_message := notification_message || E' Your order will be delivered soon.\nTrack your delivery for real-time updates in "My Orders".';

    
    -- Insert notification for customer
    INSERT INTO "Notification" (
        user_id, 
        notification_type, 
        title, 
        message, 
        reference_type, 
        reference_id, 
        priority
    )
    SELECT 
        o.user_id,
        'order_status',
        notification_title,
        notification_message,
        'delivery_assigned',
        NEW.delivery_id,
        'medium'
    FROM "Order" o
    WHERE o.order_id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customer notification on delivery creation
CREATE TRIGGER trigger_notify_customer_delivery_assigned
    AFTER INSERT ON "Delivery"
    FOR EACH ROW
    EXECUTE FUNCTION notify_customer_delivery_assigned();

-- =============================================
-- TRIGGER 2: Notification when delivery is created (for delivery boy)
-- =============================================

CREATE OR REPLACE FUNCTION notify_delivery_boy_new_assignment()
RETURNS TRIGGER AS $$
DECLARE
    customer_name varchar;
    customer_address varchar;
    order_total decimal(10,2);
    notification_title varchar;
    notification_message text;
BEGIN
    -- Get customer details and order information
    SELECT 
        COALESCE(u.first_name || ' ' || u.last_name, u.username) as full_name,
        a.address,
        o.total_amount
    INTO customer_name, customer_address, order_total
    FROM "Order" o
    INNER JOIN "User" u ON o.user_id = u.user_id
    INNER JOIN "Address" a ON a.address_id = NEW.address_id
    WHERE o.order_id = NEW.order_id;

    -- Prepare notification content
    notification_title := 'New Delivery Assignment';
    notification_message := 'You have been assigned a new delivery for ' || 
                            COALESCE(customer_name, 'customer') || '.';

    -- Add address
    IF customer_address IS NOT NULL THEN
        notification_message := notification_message || ' Delivery Address: ' || customer_address || '.';
    END IF;

    -- Add order total
    IF order_total IS NOT NULL THEN
        notification_message := notification_message || ' Order Value: ৳' || order_total || '.';
    END IF;

    notification_message := notification_message || ' If needed contact the customer and proceed with the delivery.';

    -- Insert notification for delivery boy
    INSERT INTO "Notification" (
        user_id, 
        notification_type, 
        title, 
        message, 
        reference_type, 
        reference_id, 
        priority
    ) VALUES (
        NEW.delivery_boy_id,
        'delivery_update',
        notification_title,
        notification_message,
        'delivery_assigned',
        NEW.delivery_id,
        'high'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- =============================================
-- TRIGGER 3: Notification when delivery is completed (for customer)
-- =============================================

CREATE OR REPLACE FUNCTION notify_customer_delivery_completed()
RETURNS TRIGGER AS $
DECLARE
    notification_title varchar;
    notification_message text;
BEGIN
    -- Only trigger when current_status changes to 'delivery_completed'
    IF OLD.current_status IS DISTINCT FROM NEW.current_status AND NEW.current_status = 'delivery_completed' THEN
        
        notification_title := 'Order Delivered Successfully!';
        notification_message := 'Great news! Your order has been delivered successfully. ' ||
                               'We hope you love your purchase! ' ||
                               'Please take a moment to rate your delivery experience and help us improve our service. ' ||
                               'Your feedback is valuable to us and helps other customers make informed decisions.';
        
        -- Insert notification for customer
        INSERT INTO "Notification" (
            user_id, 
            notification_type, 
            title, 
            message, 
            reference_type, 
            reference_id, 
            priority
        )
        SELECT 
            o.user_id,
            'order_status',
            notification_title,
            notification_message,
            'delivery_completed',
            NEW.delivery_id,
            'medium'
        FROM "Order" o
        WHERE o.order_id = NEW.order_id;
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for customer notification on delivery completion
CREATE TRIGGER trigger_notify_customer_delivery_completed
    AFTER UPDATE ON "Delivery"
    FOR EACH ROW
    EXECUTE FUNCTION notify_customer_delivery_completed();

-- =============================================
-- ADDITIONAL HELPER TRIGGERS FOR COMPREHENSIVE DELIVERY TRACKING
-- =============================================

-- Optional: Notification for delivery boy when delivery status changes
CREATE OR REPLACE FUNCTION notify_delivery_boy_status_update()
RETURNS TRIGGER AS $
DECLARE
    notification_title varchar;
    notification_message text;
    customer_name varchar;
BEGIN
    -- Only for specific status changes
    IF OLD.current_status IS DISTINCT FROM NEW.current_status AND NEW.current_status IN ('picked_up', 'in_transit', 'out_for_delivery') THEN
        
        -- Get customer name
        SELECT COALESCE(u.first_name || ' ' || u.last_name, u.username)
        INTO customer_name
        FROM "Order" o
        INNER JOIN "User" u ON o.user_id = u.user_id
        WHERE o.order_id = NEW.order_id;
        
        CASE NEW.current_status
            WHEN 'picked_up' THEN
                notification_title := 'Order Picked Up';
                notification_message := 'You have successfully picked up the order for ' || 
                                      COALESCE(customer_name, 'customer') || '. Please proceed to delivery location.';
            WHEN 'in_transit' THEN
                notification_title := 'Delivery In Transit';
                notification_message := 'Order for ' || COALESCE(customer_name, 'customer') || 
                                      ' is now in transit. Please update status when you reach the delivery location.';
            WHEN 'out_for_delivery' THEN
                notification_title := 'Out for Delivery';
                notification_message := 'You are now out for delivery to ' || COALESCE(customer_name, 'customer') || 
                                      '. Please contact customer if needed and complete the delivery.';
        END CASE;
        
        INSERT INTO "Notification" (
            user_id, 
            notification_type, 
            title, 
            message, 
            reference_type, 
            reference_id, 
            priority
        ) VALUES (
            NEW.delivery_boy_id,
            'delivery_update',
            notification_title,
            notification_message,
            'delivery',
            NEW.delivery_id,
            'medium'
        );
        
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

