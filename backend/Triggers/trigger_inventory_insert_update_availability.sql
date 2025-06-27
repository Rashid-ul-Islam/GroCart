-- Create trigger for INSERT operations on Inventory
CREATE OR REPLACE TRIGGER trigger_inventory_insert_update_availability
    AFTER INSERT ON "Inventory"
    FOR EACH ROW
    EXECUTE FUNCTION update_product_availability();