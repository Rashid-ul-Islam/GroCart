CREATE OR REPLACE FUNCTION find_delivery_region_for_user(p_user_id INT)
RETURNS TABLE (
    delivery_region_id INT,
    shipping_cost DECIMAL(10,2),
    delivery_days INT,
    available_delivery_boys INT
) AS $$
DECLARE
    user_region_id INT;
    user_city_id INT;
    user_district_id INT;
    user_division_id INT;
    result_record RECORD;
BEGIN
    -- Get user's primary address region details
    SELECT a.region_id, r.city_id, c.district_id, d.division_id
    INTO user_region_id, user_city_id, user_district_id, user_division_id
    FROM "Address" a
    JOIN "Region" r ON a.region_id = r.region_id
    JOIN "City" c ON r.city_id = c.city_id
    JOIN "District" d ON c.district_id = d.district_id
    WHERE a.user_id = p_user_id AND a."isPrimary" = true
    LIMIT 1;
    
    -- If no primary address found, get any address
    IF user_region_id IS NULL THEN
        SELECT a.region_id, r.city_id, c.district_id, d.division_id
        INTO user_region_id, user_city_id, user_district_id, user_division_id
        FROM "Address" a
        JOIN "Region" r ON a.region_id = r.region_id
        JOIN "City" c ON r.city_id = c.city_id
        JOIN "District" d ON c.district_id = d.district_id
        WHERE a.user_id = p_user_id
        LIMIT 1;
    END IF;
    
    -- Case 1: Check if user's region is directly assigned to a delivery region
    SELECT dr.delivery_region_id, 
           50.00 as shipping_cost,
           1 as delivery_days,
           COUNT(db.user_id) as available_delivery_boys
    INTO result_record
    FROM "Region" r
    JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
    JOIN "DeliveryBoy" db ON db.delivery_region_id = dr.delivery_region_id
    WHERE r.region_id = user_region_id
      AND db.availability_status = 'available'
      AND db.current_load < 20
    GROUP BY dr.delivery_region_id;
    
    IF result_record.delivery_region_id IS NOT NULL THEN
        delivery_region_id := result_record.delivery_region_id;
        shipping_cost := result_record.shipping_cost;
        delivery_days := result_record.delivery_days;
        available_delivery_boys := result_record.available_delivery_boys;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Case 1 alternative: Check if user's region has delivery region but all delivery boys are overloaded
    SELECT dr.delivery_region_id, 
           50.00 as shipping_cost,
           2 as delivery_days,  -- +1 day due to overload
           COUNT(db.user_id) as available_delivery_boys
    INTO result_record
    FROM "Region" r
    JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
    JOIN "DeliveryBoy" db ON db.delivery_region_id = dr.delivery_region_id
    WHERE r.region_id = user_region_id
      AND db.availability_status = 'available'
    GROUP BY dr.delivery_region_id;
    
    IF result_record.delivery_region_id IS NOT NULL THEN
        delivery_region_id := result_record.delivery_region_id;
        shipping_cost := result_record.shipping_cost;
        delivery_days := result_record.delivery_days;
        available_delivery_boys := result_record.available_delivery_boys;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Case 2: Look for delivery region within the same city
    SELECT dr.delivery_region_id, 
           100.00 as shipping_cost,
           CASE WHEN COUNT(CASE WHEN db.current_load < 20 THEN 1 END) > 0 THEN 2 ELSE 3 END as delivery_days,
           COUNT(db.user_id) as available_delivery_boys
    INTO result_record
    FROM "Region" r
    JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
    JOIN "DeliveryBoy" db ON db.delivery_region_id = dr.delivery_region_id
    WHERE r.city_id = user_city_id
      AND db.availability_status = 'available'
    GROUP BY dr.delivery_region_id
    ORDER BY COUNT(db.user_id) DESC, COUNT(CASE WHEN db.current_load < 20 THEN 1 END) DESC
    LIMIT 1;
    
    IF result_record.delivery_region_id IS NOT NULL THEN
        delivery_region_id := result_record.delivery_region_id;
        shipping_cost := result_record.shipping_cost;
        delivery_days := result_record.delivery_days;
        available_delivery_boys := result_record.available_delivery_boys;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Case 3: Look for delivery region within the same district
    SELECT dr.delivery_region_id, 
           150.00 as shipping_cost,
           CASE WHEN COUNT(CASE WHEN db.current_load < 20 THEN 1 END) > 0 THEN 3 ELSE 4 END as delivery_days,
           COUNT(db.user_id) as available_delivery_boys
    INTO result_record
    FROM "Region" r
    JOIN "City" c ON r.city_id = c.city_id
    JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
    JOIN "DeliveryBoy" db ON db.delivery_region_id = dr.delivery_region_id
    WHERE c.district_id = user_district_id
      AND db.availability_status = 'available'
    GROUP BY dr.delivery_region_id
    ORDER BY COUNT(db.user_id) DESC, COUNT(CASE WHEN db.current_load < 20 THEN 1 END) DESC
    LIMIT 1;
    
    IF result_record.delivery_region_id IS NOT NULL THEN
        delivery_region_id := result_record.delivery_region_id;
        shipping_cost := result_record.shipping_cost;
        delivery_days := result_record.delivery_days;
        available_delivery_boys := result_record.available_delivery_boys;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- Case 4: Look for delivery region within the same division
    SELECT dr.delivery_region_id, 
           150.00 as shipping_cost,
           CASE WHEN COUNT(CASE WHEN db.current_load < 20 THEN 1 END) > 0 THEN 3 ELSE 4 END as delivery_days,
           COUNT(db.user_id) as available_delivery_boys
    INTO result_record
    FROM "Region" r
    JOIN "City" c ON r.city_id = c.city_id
    JOIN "District" d ON c.district_id = d.district_id
    JOIN "DeliveryRegion" dr ON r.delivery_region_id = dr.delivery_region_id
    JOIN "DeliveryBoy" db ON db.delivery_region_id = dr.delivery_region_id
    WHERE d.division_id = user_division_id
      AND db.availability_status = 'available'
    GROUP BY dr.delivery_region_id
    ORDER BY COUNT(db.user_id) DESC, COUNT(CASE WHEN db.current_load < 20 THEN 1 END) DESC
    LIMIT 1;
    
    IF result_record.delivery_region_id IS NOT NULL THEN
        delivery_region_id := result_record.delivery_region_id;
        shipping_cost := result_record.shipping_cost;
        delivery_days := result_record.delivery_days;
        available_delivery_boys := result_record.available_delivery_boys;
        RETURN NEXT;
        RETURN;
    END IF;
    
    -- If no delivery region found, return NULL values
    RETURN;
END;
$$ LANGUAGE plpgsql;