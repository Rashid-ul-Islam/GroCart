-- Test script for inventory transfer trigger
-- This script tests the handle_inventory_transfer function

-- Enable logging for debugging
SET client_min_messages TO NOTICE;

-- Test 1: Insert a test order item to trigger the function
BEGIN;

-- Show existing warehouses and inventory (for debugging)
SELECT 'Existing Warehouses:' as info;
SELECT warehouse_id, name, latitude, longitude FROM "Warehouse" LIMIT 5;

SELECT 'Existing Inventory:' as info;
SELECT i.inventory_id, i.product_id, i.warehouse_id, i.quantity_in_stock 
FROM "Inventory" i 
JOIN "Product" p ON i.product_id = p.product_id
LIMIT 10;

-- Test with a simple order item insertion (this should trigger the function)
-- Note: Replace these values with actual IDs from your database
INSERT INTO "OrderItem" (order_id, product_id, quantity, price) 
VALUES (1, 1, 5, 10.00);

-- Check if any transfers were logged
SELECT 'Transfer Log Results:' as info;
SELECT * FROM "InventoryTransferLog" ORDER BY transfer_id DESC LIMIT 5;

ROLLBACK; -- Rollback to not affect actual data

-- Test 2: Test the function directly (if needed)
-- You can manually call the function for testing specific scenarios
