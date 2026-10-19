import { ExpoConfig, ConfigContext } from 'expo/config';

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) return 'com.zamansons.mall.dev';
  if (IS_PREVIEW) return 'com.zamansons.mall.preview';
  return 'com.zamansons.mall';
};

const getAppName = () => {
  if (IS_DEV) return 'Zaman Mall (Dev)';
  if (IS_PREVIEW) return 'Zaman Mall (Preview)';
  return 'Zaman Mall';
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "zaman-mall",
  version: "1.1.2",
  orientation: "portrait",
  runtimeVersion: {
    policy: "appVersion",
  },
  updates: {
    enabled: true,
    url: "https://u.expo.dev/04fc263b-202d-4a5f-8da0-84f6367f72a9",
    fallbackToCacheTimeout: 0,
    checkAutomatically: "ON_LOAD",
    requestHeaders: {
      "expo-channel-name": "production",
    },
  },
  icon: "./assets/images/zaman-logo2.png",
  scheme: "zaman-mall",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    icon: "./assets/images/zaman-logo2.png",
  },
  notification: {
    icon: "./assets/images/notification-icon.png",
    color: "#1DB954",
    androidMode: "default",
    androidCollapsedTitle: "Zaman Mall",
  },
  android: {
    permissions: [
      "RECEIVE_BOOT_COMPLETED",
      "VIBRATE",
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "READ_EXTERNAL_STORAGE",
      "WRITE_EXTERNAL_STORAGE",
      "ACCESS_MEDIA_LOCATION",
      "READ_MEDIA_IMAGES",
      "READ_MEDIA_VIDEO",
      "READ_MEDIA_AUDIO",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.SCHEDULE_EXACT_ALARM",
      "android.permission.USE_EXACT_ALARM",
    ],
    adaptiveIcon: {
      backgroundColor: "#ffffff",
      foregroundImage: "./assets/images/zaman-logo2.png",
    },
    googleServicesFile: "./google-services.json",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: getUniqueIdentifier(),
  },
  web: {
    output: "static",
    favicon: "./assets/images/zaman-logo.png",
  },
  plugins: [
    "expo-router",
    "expo-video",
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification-icon.png",
        color: "#1DB954",
        defaultChannel: "zaman-mall-alerts",
        sounds: [],
        enableBackgroundRemoteNotifications: true,
      }
    ],
    [
      "expo-media-library",
      {
        "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
        "savePhotosPermission": "Allow $(PRODUCT_NAME) to save photos.",
        "isAccessMediaLocationEnabled": true
      }
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/zaman-logo1.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          image: "./assets/images/zaman-logo.png",
          backgroundColor: "#000000"
        }
      }
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    API_KEY: process.env.EXPO_PUBLIC_GEMINI_API_KEY,
    eas: {
      projectId: "04fc263b-202d-4a5f-8da0-84f6367f72a9", // You should replace this with your actual EAS project ID if you have one
    },
  },
});
