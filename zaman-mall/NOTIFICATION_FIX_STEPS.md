# Background Notification Fix — Step by Step

## Kyun kaam nahi kar raha?

Expo push notifications Android par background mein kaam karne ke liye
**FCM (Firebase Cloud Messaging)** ki zaroorat hai.
Aapki `google-services.json` mein FCM section missing hai.

---

## Step 1 — Firebase Console se sahi google-services.json download karo

1. Jao: https://console.firebase.google.com
2. Project select karo: **studio-9993415521-102da**
3. Left menu → ⚙️ **Project Settings**
4. **General** tab → neeche scroll karo "Your apps" section
5. Android app `com.zamansons.mall` dhundo
6. **Download google-services.json** button click karo
7. Jo file download ho woh `f:\adil project\ZSSM\zaman-mall\google-services.json` se replace karo

---

## Step 2 — Firebase mein Cloud Messaging enable karo

1. Firebase Console → Project Settings → **Cloud Messaging** tab
2. Agar "Firebase Cloud Messaging API (V1)" disabled hai → **Enable** karo
3. **Server key** copy karo (baad mein kaam aayega)

---

## Step 3 — New APK build karo

**Ye zaroori hai** — purani APK mein ye changes nahi hain.

```bash
cd "f:\adil project\ZSSM\zaman-mall"
eas build --platform android --profile production
```

Ya agar local build karna ho:
```bash
eas build --platform android --profile production --local
```

Build complete hone ke baad nayi APK install karo phone par.

---

## Step 4 — Test karo

1. Nayi APK install karo
2. App open karo, login karo (push token save hoga)
3. App **band** karo (swipe away karo)
4. Admin panel se koi notification bhejo ya order status update karo
5. 2-3 seconds mein notification aana chahiye phone par ✅

---

## Summary — Kya fix kiya

| # | Fix | Status |
|---|-----|--------|
| 1 | `expo-notifications` plugin `app.config.ts` mein add kiya | ✅ Done |
| 2 | Android permissions add kiye (POST_NOTIFICATIONS, VIBRATE, BOOT_COMPLETED) | ✅ Done |
| 3 | `google-services.json` replace karna | ⏳ Aapko karna hai |
| 4 | New APK build karna | ⏳ Aapko karna hai |
