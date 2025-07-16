-- This file is no longer needed - StockReservation table removed
-- Stock management is now handled directly through buying_in_progress column
-- with automatic cleanup when users leave checkout or complete orders

-- If StockReservation table exists, drop it
DROP TABLE IF EXISTS "StockReservation";
