-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase Cron Job: auto-notifications
-- Ye SQL Supabase Dashboard > SQL Editor mein run karo
-- ─────────────────────────────────────────────────────────────────────────────

-- Step 1: pg_cron extension enable karo (agar nahi hai)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Cron job banao — har 1 ghante mein chalega
-- Ye edge function ko call karta hai jab bhi cron fire ho
SELECT cron.schedule(
  'zaman-mall-auto-notifications',   -- job name (unique)
  '0 * * * *',                       -- har ghante ki 0th minute par
  $$
  SELECT net.http_post(
    url := 'https://snbjqpuahjmigpftdwyo.supabase.co/functions/v1/auto-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY_HERE"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);

-- ── Verify: cron jobs check karo ──────────────────────────────────────────────
-- SELECT * FROM cron.job;

-- ── Cron job delete karna ho toh: ─────────────────────────────────────────────
-- SELECT cron.unschedule('zaman-mall-auto-notifications');
