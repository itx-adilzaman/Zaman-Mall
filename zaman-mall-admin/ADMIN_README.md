# Zaman Mall Admin - Mobile App

React Native + Expo se bana hua admin panel for Zaman Sons Super Mall.

## Run Karne Ka Tarika

```bash
cd "f:\adil project\ZSSM\zaman-mall-admin"
npm start
```

Phir:
- **Android phone pe test karne ke liye:** Expo Go app install karo aur QR code scan karo
- **Android emulator:** `npm run android`

## Login Credentials

Sirf admin emails se login ho sakta hai:
- `malikmuhammadadilzaman@gmail.com`
- `malikzaman0987@gmail.com`
- `admin@zamansons.com`

## Features

| Screen | Features |
|--------|----------|
| Dashboard | Revenue, Orders, Users, Products stats, Recent orders |
| Products | Add/Edit/Delete, Image upload (Cloudinary), Variants, Gallery, Country filter |
| Orders | View all orders, Update status, Order details |
| Returns | Approve/Reject return requests |
| Messages | Read/Reply/Delete customer messages |
| Users | View all customers and their profiles |
| Ads/Banners | Add/Edit/Delete banners, Toggle active |
| Categories | Add/Edit/Delete categories with Urdu names |
| Versions | Manage app update versions |
| Profile | Admin info + Logout |

## Tech Stack

- **React Native + Expo** (SDK 56)
- **Supabase** - Same database as website
- **Cloudinary** - Image uploads
- **React Navigation** - Bottom tab navigation
- **Expo Linear Gradient** - UI gradients
- **@expo/vector-icons** - Ionicons
