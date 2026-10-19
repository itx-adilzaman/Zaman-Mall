# Email Templates Supabase mein Kaise Apply Karein

## Step 1 — Logo Upload Karein (Email mein show karne ke liye)

1. [Supabase Dashboard → Storage](https://supabase.com/dashboard/project/snbjqpuahjmigpftdwyo/storage/buckets)
2. **"New bucket"** → Name: `assets` → **Public** rakho ✅
3. `assets/images/zaman-logo.png` file upload karo
4. File par click karo → **"Get URL"** copy karo
5. Teeno HTML files mein `src="..."` wali jagah ye URL paste karo

---

## Step 2 — Reset Password Template

1. [Auth → Email Templates](https://supabase.com/dashboard/project/snbjqpuahjmigpftdwyo/auth/templates)
2. **"Reset Password"** select karo
3. Subject mein likho:
   ```
   🔐 Password Reset — Zaman Mall
   ```
4. Body mein **reset-password.html** ka sara content paste karo
5. **Save** karo

---

## Step 3 — Confirm Signup Template

1. Wahi page par **"Confirm signup"** select karo
2. Subject:
   ```
   🎉 Zaman Mall mein Khush Amdeed! Email Verify Karein
   ```
3. Body mein **confirm-signup.html** ka sara content paste karo
4. **Save** karo

---

## Step 4 — Magic Link Template (Optional)

1. **"Magic Link"** select karo
2. Subject:
   ```
   ✨ Zaman Mall Login Link
   ```
3. Body mein **magic-link.html** ka sara content paste karo
4. **Save** karo

---

## Step 5 — Password Changed Confirmation

1. **"Change Email Address"** ya **"Email Change"** section mein se
   **"Password Changed"** / **"Reauthentication"** select karo
   *(Supabase mein ye "Change Email" ke paas hota hai)*
2. Subject:
   ```
   🛡️ Password Changed — Zaman Mall Security Alert
   ```
3. Body mein **password-changed.html** ka sara content paste karo
4. **Save** karo

---

## Step 5 — Redirect URL Allow Karo

1. [Auth → URL Configuration](https://supabase.com/dashboard/project/snbjqpuahjmigpftdwyo/auth/url-configuration)
2. **"Add URL"** mein ye dono add karo:
   ```
   zaman-mall://reset-password
   zaman-mall://**
   ```
3. **Save** karo

---

## Sab ho gaya! ✅

Ab jab bhi koi:
- Password reset kare → Branded email aayegi
- New account banaye → Welcome email aayegi  
- Magic link se login kare → Branded link aayega
