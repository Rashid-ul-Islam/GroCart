-- Trigger function to update product availability based on total inventory
CREATE OR REPLACE FUNCTION update_product_availability()
RETURNS TRIGGER AS $$
DECLARE
    affected_product_id INT;
    total_stock INT;
BEGIN
    -- Get the product_id that was affected
    IF TG_OP = 'DELETE' THEN
        affected_product_id := OLD.product_id;
    ELSE
        affected_product_id := NEW.product_id;
    END IF;
    
    -- Calculate total stock across all warehouses for this product
    SELECT COALESCE(SUM(quantity_in_stock), 0)
    INTO total_stock
    FROM "Inventory"
    WHERE product_id = affected_product_id;
    
    -- Update the product availability based on total stock
    UPDATE "Product"
    SET 
        is_available = (total_stock > 0),
        total_available_stock = total_stock,
        updated_at = NOW()
    WHERE product_id = affected_product_id;
    
    -- Return appropriate record based on operation
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;