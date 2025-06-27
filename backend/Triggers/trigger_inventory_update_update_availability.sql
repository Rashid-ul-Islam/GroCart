-- Create trigger for UPDATE operations on Inventory
CREATE OR REPLACE TRIGGER trigger_inventory_update_update_availability
    AFTER UPDATE ON "Inventory"
    FOR EACH ROW
    WHEN (OLD.quantity_in_stock IS DISTINCT FROM NEW.quantity_in_stock OR OLD.product_id IS DISTINCT FROM NEW.product_id)
    EXECUTE FUNCTION update_product_availability();