CREATE OR REPLACE FUNCTION get_order_shipping_cost(p_order_id INT)
RETURNS DECIMAL(10,2) AS $$
DECLARE
    result DECIMAL(10,2);
BEGIN
    SELECT shipping_cost INTO result
    FROM calculate_shipping_and_delivery(p_order_id);
    
    RETURN COALESCE(result, 0);
END;
$$ LANGUAGE plpgsql;