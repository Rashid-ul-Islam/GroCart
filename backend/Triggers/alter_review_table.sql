-- Add order_id to the Review table to link a review to a specific purchase
ALTER TABLE "Review" ADD COLUMN "order_id" INT;

-- Add a foreign key constraint to the Order table
ALTER TABLE "Review" ADD CONSTRAINT fk_review_order
FOREIGN KEY ("order_id") REFERENCES "Order" ("order_id");

-- Add an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_review_order_user_product 
ON "Review" ("order_id", "user_id", "product_id");
