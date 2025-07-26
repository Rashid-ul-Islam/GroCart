-- Function to add points when delivery is completed
CREATE OR REPLACE FUNCTION add_points_on_delivery_completion()
RETURNS TRIGGER AS $
DECLARE
    target_user_id INTEGER;
    order_total_amount DECIMAL(10,2);
    points_to_add INTEGER;
BEGIN
    -- Only proceed if status changed to 'delivery_completed'
    IF NEW.current_status = 'delivery_completed' AND 
       (OLD.current_status IS NULL OR OLD.current_status != 'delivery_completed') THEN
        
        -- Get the user_id and total_amount from the order
        SELECT o.user_id, o.total_amount 
        INTO target_user_id, order_total_amount
        FROM "Order" o
        WHERE o.order_id = NEW.order_id;
        
        -- Calculate points (total_amount / 100, keep as decimal since total_points is int)
        points_to_add := FLOOR(order_total_amount / 100);
        
        -- Add points to user's existing total_points
        UPDATE "User"
        SET total_points = COALESCE(total_points, 0) + points_to_add,
            total_points_last_update = NOW()
        WHERE user_id = target_user_id;
        
    END IF;
    
    RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_add_points_on_delivery_completion
    AFTER UPDATE ON "Delivery"
    FOR EACH ROW
    EXECUTE FUNCTION add_points_on_delivery_completion();

-- Function to calculate and set correct points for all existing users
CREATE OR REPLACE FUNCTION update_all_existing_user_points()
RETURNS INTEGER AS $
DECLARE
    user_record RECORD;
    total_points_earned INTEGER;
    updated_count INTEGER := 0;
BEGIN
    -- Process each user who has completed deliveries
    FOR user_record IN 
        SELECT DISTINCT u.user_id
        FROM "User" u
        INNER JOIN "Order" o ON u.user_id = o.user_id
        INNER JOIN "Delivery" d ON o.order_id = d.order_id
        WHERE d.current_status = 'delivery_completed'
    LOOP
        -- Calculate total points this user should have from all completed deliveries
        SELECT COALESCE(SUM(FLOOR(o.total_amount / 100)), 0) INTO total_points_earned
        FROM "Order" o
        INNER JOIN "Delivery" d ON o.order_id = d.order_id
        WHERE o.user_id = user_record.user_id 
        AND d.current_status = 'delivery_completed';
        
        -- Update user's total points
        UPDATE "User"
        SET total_points = total_points_earned,
            total_points_last_update = NOW()
        WHERE user_id = user_record.user_id;
        
        updated_count := updated_count + 1;
        
    END LOOP;
    
    RETURN updated_count;
END;
$ LANGUAGE plpgsql;

-- To execute the function for existing users, run:
-- SELECT update_all_existing_user_points();