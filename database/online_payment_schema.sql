-- ============================================================
-- Online Payment System — Supabase Migration
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- Step 1: Add the two new columns (safe to run multiple times)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT NULL;

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT DEFAULT NULL;

-- Step 2: Mark existing COD orders as paid
-- NOTE: Your orders table uses camelCase "paymentMethod" column
UPDATE orders
SET payment_status = 'paid'
WHERE "paymentMethod" = 'cod'
  AND payment_status IS NULL;

-- Step 3: Indexes for fast filtering
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- ============================================================
-- DONE. Now the payment flow will:
-- 1. Save receipt URL in payment_receipt_url
-- 2. Track status in payment_status
--    (awaiting_approval → approved / rejected)
-- ============================================================
