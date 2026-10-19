# Auto Notifications — Supabase Edge Function

App band ho ya open — server se push notifications automatically bhejta hai.

## Kya karta hai?

| Notification | Condition |
|---|---|
| 🛒 Cart Reminder | Cart mein items hain, last 1+ ghanta ho gaya, order nahi kiya |
| ❤️ Wishlist Reminder | Wishlist mein items hain, last 24+ ghante mein koi reminder nahi mila |

Duplicate notifications nahi aate — har user ko din mein sirf 1 baar milta hai.

---

## Deploy karne ke steps (ek baar karna hai)

### Step 1 — Supabase CLI install karo
```bash
npm install -g supabase
```

### Step 2 — Login karo
```bash
supabase login
```
Browser mein page khulega, login karo.

### Step 3 — Project link karo
```bash
cd "f:\adil project\ZSSM\zaman-mall"
supabase link --project-ref snbjqpuahjmigpftdwyo
```

### Step 4 — Function deploy karo
```bash
supabase functions deploy auto-notifications --no-verify-jwt
```

### Step 5 — Service Role Key lao
1. [Supabase Dashboard](https://supabase.com/dashboard) kholo
2. Project → **Settings** → **API**
3. **service_role** key copy karo (secret — kisi ko mat dena)

### Step 6 — Cron job set karo
Supabase Dashboard → **SQL Editor** → New query → paste karo:

```sql
-- Extensions enable karo
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Har ghante mein auto-notification function chalega
SELECT cron.schedule(
  'zaman-mall-auto-notifications',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://snbjqpuahjmigpftdwyo.supabase.co/functions/v1/auto-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YAHAN_SERVICE_ROLE_KEY_PASTE_KARO"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

> ⚠️ `YAHAN_SERVICE_ROLE_KEY_PASTE_KARO` ki jagah Step 5 wali key paste karo.

**Run** button dabao — ho gaya!

### Step 7 — Verify karo
```sql
SELECT * FROM cron.job;
```
`zaman-mall-auto-notifications` naam ka job dikhna chahiye.

---

## Test karna

Supabase Dashboard → **Edge Functions** → `auto-notifications` → **Invoke** button.

Ya terminal se:
```bash
supabase functions invoke auto-notifications
```

Response mein aayega:
```json
{
  "success": true,
  "cartReminders": 3,
  "wishlistReminders": 5,
  "timestamp": "2026-06-15T..."
}
```

---

## Cron job remove karna ho

```sql
SELECT cron.unschedule('zaman-mall-auto-notifications');
```
