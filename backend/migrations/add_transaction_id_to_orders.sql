-- Add transaction_id column to Order table for third-party payment integration
-- This column will store the external payment gateway transaction ID

ALTER TABLE "Order" 
ADD COLUMN transaction_id VARCHAR(255) NULL;

-- Add index for faster lookups by transaction_id
CREATE INDEX IF NOT EXISTS idx_order_transaction_id ON "Order" (transaction_id);

-- Add comment to describe the column
COMMENT ON COLUMN "Order".transaction_id IS 'External payment gateway transaction ID for payment tracking';
