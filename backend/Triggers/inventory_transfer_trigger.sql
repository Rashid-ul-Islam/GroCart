CREATE OR REPLACE TRIGGER inventory_transfer_trigger
    AFTER INSERT ON "OrderItem"
    FOR EACH ROW
    EXECUTE FUNCTION handle_inventory_transfer();