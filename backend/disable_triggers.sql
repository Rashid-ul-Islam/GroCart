-- Disable the inventory transfer trigger if it's causing conflicts
-- Run this in your database if needed:

-- DROP TRIGGER IF EXISTS inventory_transfer_trigger ON "OrderItem";
-- DROP TRIGGER IF EXISTS inventory_transfer_update_trigger ON "OrderItem";

-- You can re-enable them later if needed:
-- CREATE TRIGGER inventory_transfer_trigger
--     AFTER INSERT ON "OrderItem"
--     FOR EACH ROW
--     EXECUTE FUNCTION handle_inventory_transfer();
