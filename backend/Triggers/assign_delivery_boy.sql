CREATE OR REPLACE FUNCTION assign_delivery_boy(p_delivery_region_id INT, p_user_id INT)
RETURNS INT AS $$
DECLARE
  selected_delivery_boy_id INT;
  user_address_id INT;
BEGIN
  -- Get user's primary address
  SELECT address_id INTO user_address_id
  FROM "Address"
  WHERE user_id = p_user_id AND "isPrimary" = true
  LIMIT 1;

  -- If no primary address, get any address
  IF user_address_id IS NULL THEN
    SELECT address_id INTO user_address_id
    FROM "Address"
    WHERE user_id = p_user_id
    LIMIT 1;
  END IF;

  -- Find delivery boy with minimum load in the delivery region
  SELECT user_id INTO selected_delivery_boy_id
  FROM "DeliveryBoy"
  WHERE delivery_region_id = p_delivery_region_id
    AND availability_status = 'available'
  ORDER BY current_load ASC, user_id ASC
  LIMIT 1;

  RETURN selected_delivery_boy_id;
END;
$$ LANGUAGE plpgsql;
