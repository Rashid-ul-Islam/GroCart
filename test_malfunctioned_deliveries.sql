-- Create test data for malfunctioned deliveries

-- Insert a late delivery (estimated_arrival in the past, status still in_transit)
INSERT INTO "Delivery" (order_id, address_id, delivery_boy_id, estimated_arrival, current_status, created_at, updated_at)
SELECT 
    o.order_id,
    u.address_id,
    db.user_id,
    NOW() - INTERVAL '2 hours' as estimated_arrival,
    'in_transit' as current_status,
    NOW() - INTERVAL '3 hours' as created_at,
    NOW() - INTERVAL '1 hour' as updated_at
FROM "Order" o
INNER JOIN "User" u ON o.user_id = u.user_id
INNER JOIN "Address" a ON u.user_id = a.user_id AND a."isPrimary" = true
CROSS JOIN (
    SELECT user_id FROM "DeliveryBoy" WHERE availability_status = 'available' LIMIT 1
) db
WHERE o.order_id NOT IN (SELECT order_id FROM "Delivery")
LIMIT 1;

-- Insert a failed delivery
INSERT INTO "Delivery" (order_id, address_id, delivery_boy_id, estimated_arrival, current_status, created_at, updated_at)
SELECT 
    o.order_id,
    u.address_id,
    db.user_id,
    NOW() + INTERVAL '1 hour' as estimated_arrival,
    'failed' as current_status,
    NOW() - INTERVAL '2 hours' as created_at,
    NOW() - INTERVAL '30 minutes' as updated_at
FROM "Order" o
INNER JOIN "User" u ON o.user_id = u.user_id
INNER JOIN "Address" a ON u.user_id = a.user_id AND a."isPrimary" = true
CROSS JOIN (
    SELECT user_id FROM "DeliveryBoy" WHERE availability_status = 'available' LIMIT 1
) db
WHERE o.order_id NOT IN (SELECT order_id FROM "Delivery")
LIMIT 1;
