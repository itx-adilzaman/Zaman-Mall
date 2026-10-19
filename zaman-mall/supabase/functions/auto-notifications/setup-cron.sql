-- ═══════════════════════════════════════════════════════════════
-- ZAMAN MALL — Auto Notifications Cron Job Setup
-- Ye SQL Supabase Dashboard > SQL Editor mein run karo
-- ═══════════════════════════════════════════════════════════════

-- Step 1: Extensions enable karo
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Step 2: Cron job create karo (har ghante mein chalega)
-- ⚠️ IMPORTANT: Neeche wali line mein apni service_role key paste karo
-- Supabase Dashboard → Settings → API → service_role (secret key)

SELECT cron.schedule(
  'zaman-mall-auto-notifications',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url        := 'https://snbjqpuahjmigpftdwyo.supabase.co/functions/v1/auto-notifications',
    headers    := '{"Content-Type": "application/json", "Authorization": "Bearer YAHAN_SERVICE_ROLE_KEY_PASTE_KARO"}'::jsonb,
    body       := '{}'::jsonb,
    timeout_milliseconds := 30000
  ) AS request_id;
  $$
);

-- Step 3: Verify — job list mein dikhna chahiye
SELECT jobid, jobname, schedule, command FROM cron.job
WHERE jobname = 'zaman-mall-auto-notifications';
