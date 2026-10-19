# Zaman Mall - In-App Update System

A professional, cinematic in-app update system for Zaman Mall mobile app that allows version control from an Admin Panel and seamless in-app updates without opening a browser.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Setup Instructions](#setup-instructions)
- [Admin Panel Setup](#admin-panel-setup)
- [Mobile App Integration](#mobile-app-integration)
- [Usage](#usage)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This system provides a complete solution for managing app versions and delivering updates directly within the mobile app. It includes:

1. **Supabase Database** - Stores version information with Row Level Security (RLS)
2. **Admin Panel** - Web-based dashboard for managing app versions
3. **Mobile App Components** - Custom hooks and UI components for in-app updates
4. **Automatic Installation** - Seamless APK download and installation on Android

## ✨ Features

### Admin Panel
- 📝 Add new app versions with version code, download URL, and release notes
- ⚠️ Mark updates as critical (force update)
- 📅 View version history with timestamps
- 🗑️ Delete old versions
- 🎨 Modern, professional UI with Zaman Mall branding

### Mobile App
- 🔔 Automatic version checking on app launch
- 🎬 Cinematic, professional update modal with animations
- 📊 Real-time download progress bar (0% to 100%)
- 📥 In-app APK download using expo-file-system
- 🚀 Automatic installation using expo-intent-launcher
- 🔒 Force update support for critical updates
- 🎨 Beautiful gradient UI with smooth animations

## 🏗️ Architecture

```
┌─────────────────┐
│   Admin Panel   │
│   (React.js)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Supabase DB   │
│  app_versions   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Mobile App     │
│  (React Native) │
│                 │
│  useAppUpdate   │
│  AppUpdateModal │
└─────────────────┘
```

## 🚀 Setup Instructions

### 1. Database Setup (Supabase)

Run the SQL schema in your Supabase SQL Editor:

```bash
# Navigate to the database directory
cd database

# Run the schema in Supabase SQL Editor
# Copy contents of app_versions_schema.sql
```

The schema includes:
- `app_versions` table with all required fields
- Row Level Security (RLS) policies
- Automatic timestamp triggers
- Initial version record

### 2. Admin Panel Setup

Navigate to the admin panel directory:

```bash
cd zaman-mall-admin
```

Install dependencies:

```bash
npm install
```

Create environment file:

```bash
cp .env.example .env
```

Update `.env` with your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Start the admin panel:

```bash
npm run dev
```

The admin panel will be available at `http://localhost:3001`

### 3. Mobile App Setup

Navigate to the mobile app directory:

```bash
cd zaman-mall
```

Install the new dependency:

```bash
npm install expo-intent-launcher
```

The following dependencies are already installed:
- `expo-file-system` - For downloading APK files
- `@supabase/supabase-js` - For fetching version data

## 📱 Mobile App Integration

### Step 1: Import the Modal Component

In your app's root component (e.g., `app/_layout.tsx` or `App.tsx`):

```tsx
import AppUpdateModal from "@/components/AppUpdateModal";
import { useState, useEffect } from "react";
import useAppUpdate from "@/hooks/useAppUpdate";
```

### Step 2: Use the Hook and Show Modal

```tsx
export default function RootLayout() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const { updateAvailable, isCritical } = useAppUpdate();

  useEffect(() => {
    // Show modal if update is available
    if (updateAvailable) {
      setShowUpdateModal(true);
    }
  }, [updateAvailable]);

  return (
    <SafeAreaProvider>
      {/* Your existing app content */}
      <Slot />
      
      {/* Update Modal */}
      <AppUpdateModal
        visible={showUpdateModal}
        onClose={() => {
          // Only allow closing for non-critical updates
          if (!isCritical) {
            setShowUpdateModal(false);
          }
        }}
      />
    </SafeAreaProvider>
  );
}
```

### Step 3: Update Current Version

When you release a new version of the app, update the `CURRENT_APP_VERSION` constant in `hooks/useAppUpdate.ts`:

```typescript
const CURRENT_APP_VERSION = "1.1.0"; // Update this
```

Also update the version in `app.json`:

```json
{
  "expo": {
    "version": "1.1.0",
    "android": {
      "versionCode": 8
    }
  }
}
```

## 📖 Usage

### Managing Versions via Admin Panel

1. **Add New Version**
   - Click "Add New Version" button
   - Enter version code (e.g., "1.1.0")
   - Enter download URL (e.g., `https://zamanmall.netlify.app/Zaman%20Mall.apk`)
   - Toggle "Force Update" if this is a critical update
   - Add release notes describing the changes
   - Click "Save Version"

2. **View Version History**
   - All versions are displayed in descending order
   - Critical updates are marked with a red badge
   - Download links are available for each version

3. **Delete Version**
   - Click the trash icon next to a version
   - Confirm deletion

### Mobile App User Experience

1. **On App Launch**
   - The app automatically checks for updates
   - If a newer version is available, the modal appears

2. **Non-Critical Updates**
   - User can choose "Update Now" or "Later"
   - Modal can be dismissed
   - Will appear again on next launch if not updated

3. **Critical Updates**
   - User must update to continue
   - "Later" option is not available
   - Modal cannot be dismissed

4. **Download Process**
   - Real-time progress bar shows download status
   - File size is displayed
   - Download can be cancelled

5. **Installation**
   - Once download completes, installation starts automatically
   - Android package installer opens
   - User confirms installation

## 🔧 Troubleshooting

### Admin Panel Issues

**Issue: Cannot connect to Supabase**
- Verify `.env` file has correct credentials
- Check Supabase URL and anon key
- Ensure RLS policies are correctly configured

**Issue: Versions not appearing**
- Check browser console for errors
- Verify Supabase connection
- Ensure table has data

### Mobile App Issues

**Issue: Update modal not showing**
- Check `CURRENT_APP_VERSION` is correctly set
- Verify Supabase connection in `lib/supabase.ts`
- Check console for errors
- Ensure internet connection is available

**Issue: Download fails**
- Verify download URL is accessible
- Check internet connection
- Ensure sufficient storage space
- Check Android permissions are granted

**Issue: Installation fails**
- Verify `REQUEST_INSTALL_PACKAGES` permission in `app.json`
- Ensure APK is properly signed
- Check Android security settings
- Try enabling "Install from unknown sources" in Android settings

**Issue: expo-intent-launcher errors**
- Ensure dependency is installed: `npm install expo-intent-launcher`
- Rebuild the app: `expo run:android`
- Check Android manifest for permissions

### Android Permissions

If installation is blocked, ensure these permissions are in `app.json`:

```json
{
  "android": {
    "permissions": [
      "REQUEST_INSTALL_PACKAGES",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "INTERNET",
      "ACCESS_NETWORK_STATE"
    ]
  }
}
```

### Version Comparison

The system uses semantic version comparison:
- "1.1.0" > "1.0.9"
- "2.0.0" > "1.9.9"
- "1.0.1" > "1.0.0"

Ensure version codes follow semantic versioning (MAJOR.MINOR.PATCH).

## 🎨 Customization

### Branding

To customize the modal colors, edit `components/AppUpdateModal.tsx`:

```typescript
// Update gradient colors
<LinearGradient
  colors={["#2563eb", "#1d4ed8", "#1e40af"]} // Your brand colors
```

### Version Check Frequency

To change how often updates are checked, modify the hook:

```typescript
// In hooks/useAppUpdate.ts
staleTime: 5 * 60 * 1000, // Change this value (currently 5 minutes)
```

## 📝 Best Practices

1. **Version Management**
   - Always increment version codes properly
   - Use semantic versioning (MAJOR.MINOR.PATCH)
   - Keep release notes concise and informative

2. **Critical Updates**
   - Only mark updates as critical when necessary
   - Provide clear explanation in release notes
   - Test thoroughly before marking as critical

3. **APK Hosting**
   - Ensure download URL is reliable and fast
   - Use CDN for better performance
   - Keep old versions available for rollback

4. **Testing**
   - Test update flow thoroughly before releasing
   - Test on various Android versions
   - Test with slow internet connections
   - Test installation cancellation

## 📄 License

This system is part of the Zaman Mall project.

## 🤝 Support

For issues or questions, please contact the development team.
