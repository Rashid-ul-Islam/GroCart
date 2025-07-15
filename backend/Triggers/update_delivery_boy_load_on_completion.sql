REATE OR REPLACE FUNCTION update_delivery_boy_load_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if delivery status is being updated to completed
    IF NEW.actual_arrival IS NOT NULL AND OLD.actual_arrival IS NULL THEN
        -- Decrease delivery boy's current load
        UPDATE "DeliveryBoy" 
        SET current_load = GREATEST(current_load - 1, 0)
        WHERE user_id = NEW.delivery_boy_id;
        
        -- Add status history
        INSERT INTO "StatusHistory" (entity_type, entity_id, status, updated_at, notes)
        VALUES ('delivery', NEW.delivery_id, 'completed', NOW(), 'Delivery completed');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;