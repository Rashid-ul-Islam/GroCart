-- Trigger function to automatically update user tier when total_points changes
CREATE OR REPLACE FUNCTION update_user_tier_on_points_change()
RETURNS TRIGGER AS $$
DECLARE
    new_tier_id INTEGER;
BEGIN
    -- Only proceed if total_points has actually changed
    IF OLD.total_points IS DISTINCT FROM NEW.total_points THEN
        -- Get the appropriate tier for the new points
        SELECT tier_id INTO new_tier_id
        FROM "UserTier"
        WHERE COALESCE(NEW.total_points, 0) >= min_points 
        AND (max_points IS NULL OR COALESCE(NEW.total_points, 0) <= max_points)
        ORDER BY min_points DESC
        LIMIT 1;
        
        -- Update tier_id if it's different from current
        IF new_tier_id IS DISTINCT FROM NEW.tier_id THEN
            NEW.tier_id := new_tier_id;
            NEW.total_points_last_update := NOW();
            
            -- Insert notification for tier change
            INSERT INTO "Notification" (
                user_id, notification_type, title, message, 
                reference_type, reference_id, priority
            ) VALUES (
                NEW.user_id, 'tier_update', 'Congratulations! Tier Updated',
                'Your tier has been updated to ' || (SELECT name FROM "UserTier" WHERE tier_id = new_tier_id) || 
                ' based on your total points of ' || COALESCE(NEW.total_points, 0),
                'user', NEW.user_id, 'medium'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_update_user_tier ON "User";
CREATE TRIGGER trigger_update_user_tier
    BEFORE UPDATE ON "User"
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tier_on_points_change();

-- Function to update all existing users' tiers based on their current total_points
CREATE OR REPLACE FUNCTION update_all_existing_user_tiers()
RETURNS TABLE(
    user_id INTEGER,
    username VARCHAR,
    old_tier_name VARCHAR,
    new_tier_name VARCHAR,
    total_points INTEGER,
    updated BOOLEAN
) AS $$
DECLARE
    user_record RECORD;
    new_tier_id INTEGER;
    old_tier_name VARCHAR;
    new_tier_name VARCHAR;
    updated_count INTEGER := 0;
BEGIN
    -- Loop through all users
    FOR user_record IN 
        SELECT u.user_id, u.username, u.total_points, u.tier_id,
               COALESCE(ut.name, 'No Tier') as current_tier_name
        FROM "User" u
        LEFT JOIN "UserTier" ut ON u.tier_id = ut.tier_id
    LOOP
        -- Get the correct tier for this user's points
        SELECT tier_id INTO new_tier_id
        FROM "UserTier"
        WHERE COALESCE(user_record.total_points, 0) >= min_points 
        AND (max_points IS NULL OR COALESCE(user_record.total_points, 0) <= max_points)
        ORDER BY min_points DESC
        LIMIT 1;
        
        -- Get tier names for comparison
        old_tier_name := user_record.current_tier_name;
        SELECT name INTO new_tier_name FROM "UserTier" WHERE tier_id = new_tier_id;
        
        -- Check if tier needs to be updated
        IF new_tier_id IS DISTINCT FROM user_record.tier_id THEN
            -- Update the user's tier
            UPDATE "User" 
            SET tier_id = new_tier_id, total_points_last_update = NOW()
            WHERE "User".user_id = user_record.user_id;
            
            -- Insert notification for existing users
            INSERT INTO "Notification" (
                user_id, notification_type, title, message, 
                reference_type, reference_id, priority
            ) VALUES (
                user_record.user_id, 'tier_update', 'Your Tier Has Been Updated!',
                'Based on your total points of ' || COALESCE(user_record.total_points, 0) || 
                ', your tier has been updated from ' || old_tier_name || ' to ' || new_tier_name,
                'user', user_record.user_id, 'medium'
            );
            
            updated_count := updated_count + 1;
            
            -- Return the update information
            RETURN QUERY SELECT 
                user_record.user_id, user_record.username,
                old_tier_name, new_tier_name,
                user_record.total_points, TRUE;
        ELSE
            -- Return information showing no update was needed
            RETURN QUERY SELECT 
                user_record.user_id, user_record.username,
                old_tier_name, new_tier_name,
                user_record.total_points, FALSE;
        END IF;
    END LOOP;
    
    -- Log the total number of updates
    RAISE NOTICE 'Updated % users tier information', updated_count;
END;
$$ LANGUAGE plpgsql;

-- Usage examples:
-- 1. Update all existing users: SELECT * FROM update_all_existing_user_tiers();
-- 2. Test trigger: UPDATE "User" SET total_points = 1600 WHERE user_id = 1;