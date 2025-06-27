-- Create trigger for DELETE operations on Inventory
CREATE OR REPLACE TRIGGER trigger_inventory_delete_update_availability
    AFTER DELETE ON "Inventory"
    FOR EACH ROW
    EXECUTE FUNCTION update_product_availability();