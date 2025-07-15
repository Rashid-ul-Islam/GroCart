CREATE OR REPLACE FUNCTION calculate_shipping_and_delivery(p_user_id INT)
RETURNS TABLE (
    shipping_cost DECIMAL(10,2),
    estimated_delivery_date TIMESTAMP,
    delivery_region_id INT
) AS $$
DECLARE
    delivery_info RECORD;
BEGIN
    SELECT * INTO delivery_info
    FROM find_delivery_region_for_user(p_user_id);
    
    IF delivery_info.delivery_region_id IS NOT NULL THEN
        shipping_cost := delivery_info.shipping_cost;
        estimated_delivery_date := CURRENT_TIMESTAMP + INTERVAL '1 day' * delivery_info.delivery_days;
        delivery_region_id := delivery_info.delivery_region_id;
        RETURN NEXT;
    END IF;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;