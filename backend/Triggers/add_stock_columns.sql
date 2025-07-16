-- Add new columns to Product table for real-time stock management
ALTER TABLE "Product" 
ADD COLUMN "total_available_stock" INT DEFAULT 0,
ADD COLUMN "buying_in_progress" INT DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX idx_product_stock ON "Product" ("total_available_stock", "buying_in_progress");

-- Update trigger to maintain total_available_stock
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_available_stock when inventory changes
    UPDATE "Product" 
    SET total_available_stock = (
        SELECT COALESCE(SUM(quantity_in_stock), 0)
        FROM "Inventory" 
        WHERE product_id = COALESCE(NEW.product_id, OLD.product_id)
    )
    WHERE product_id = COALESCE(NEW.product_id, OLD.product_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for inventory changes
DROP TRIGGER IF EXISTS inventory_stock_update_trigger ON "Inventory";
CREATE TRIGGER inventory_stock_update_trigger
    AFTER INSERT OR UPDATE OR DELETE ON "Inventory"
    FOR EACH ROW
    EXECUTE FUNCTION update_product_stock();

-- Initialize total_available_stock for existing products
UPDATE "Product" 
SET total_available_stock = (
    SELECT COALESCE(SUM(i.quantity_in_stock), 0)
    FROM "Inventory" i
    WHERE i.product_id = "Product".product_id
);
