-- Trigger function to update order with shipping cost
CREATE OR REPLACE FUNCTION update_order_shipping()
RETURNS TRIGGER AS $$
DECLARE
    shipping_info RECORD;
BEGIN
    -- Calculate shipping cost and delivery info
    SELECT * INTO shipping_info
    FROM calculate_shipping_and_delivery(NEW.order_id);
    
    -- Update order with shipping cost
    UPDATE "Order" 
    SET shipping_total = shipping_info.shipping_cost,
        total_amount = product_total + tax_total + shipping_info.shipping_cost - discount_total
    WHERE order_id = NEW.order_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;