import { useState, useEffect, useRef } from "react";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const usePushNotifications = () => {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [notification, setNotification] = useState<Notifications.Notification | undefined>();
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const notifiedReplyIdsRef = useRef<Set<string>>(new Set());
  const { user } = useAuth();

  async function registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') {
      return;
    }
    let token;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("zaman-mall-alerts", {
        name: "Zaman Mall Alerts",
        description: "Receive updates, offers, and order notifications from Zaman Mall.",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#1DB954",
        sound: "default",
        enableVibrate: true,
        showBadge: true,
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== "granted") {
        return;
      }
      
      try {
          const projectId =
            Constants?.expoConfig?.extra?.eas?.projectId ??
            Constants?.easConfig?.projectId ??
            "04fc263b-202d-4a5f-8da0-84f6367f72a9";

          if (projectId) {
            token = (
              await Notifications.getExpoPushTokenAsync({
                projectId,
              })
            ).data;
          } else {
            token = (await Notifications.getExpoPushTokenAsync()).data;
          }
      } catch (e: any) {
          // Silent fail
      }
    }

    return token;
  }

  // 1. Register for notifications on mount
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
      }
    });

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      // Handle notification tap — dynamic deep link
      const data = response.notification.request.content.data;
      if (data?.url) {
        router.push(data.url as any);
      } else if (data?.type === 'support_reply') {
        router.push('/notifications');
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // 2. Synchronize token to Supabase whenever user OR token becomes available / changes
  useEffect(() => {
    if (user && expoPushToken) {
      savePushToken(user.id, expoPushToken);
    }
  }, [user, expoPushToken]);

  useEffect(() => {
    if (!user) return;

    let isActive = true;

    const checkForNewReplies = async () => {
      if (!isActive) return;
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("id, reply, replied_at, reply_read_by_user, subject")
          .eq("user_id", user.id)
          .not("reply", "is", null)
          .order("replied_at", { ascending: false })
          .limit(20);

        if (error || !data) {
          return;
        }

        for (const msg of data as any[]) {
          const id = String(msg.id);
          if (!msg.reply || msg.reply_read_by_user) continue;
          if (notifiedReplyIdsRef.current.has(id)) continue;

          notifiedReplyIdsRef.current.add(id);

          const replyText: string = msg.reply || "";
          const preview =
            replyText.length > 130 ? replyText.slice(0, 127) + "..." : replyText;
          const subject: string | undefined = msg.subject;

          const bodyText = preview
            ? subject
              ? `Aap ke message "${subject}" ka jawab Adil Zaman ne bhej diya hai: ${preview}`
              : `Aap ke message ka jawab Adil Zaman ne bhej diya hai: ${preview}`
            : "Aap ke message ka tafseeli jawab Adil Zaman ne bhej diya hai. Tafseelat dekhne ke liye app me Notifications section open karein.";

          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Zaman Mall • Support Response ✉️",
              body: bodyText,
              data: {
                type: "support_reply",
                messageId: msg.id,
              },
            },
            trigger: null,
          });
        }
      } catch (error) {
        // Silent fail
      }
    };

    // Initial check and interval-based polling
    checkForNewReplies();
    const intervalId = setInterval(checkForNewReplies, 30000);

    return () => {
      isActive = false;
      clearInterval(intervalId);
    };
  }, [user]);

  const savePushToken = async (userId: string, token: string) => {
    try {
      const userEmail = user?.email || "";

      // First try upserting with explicit conflict on 'id'
      const { error: upsertError } = await supabase
        .from('profiles')
        .upsert(
          { id: userId, push_token: token, email: userEmail },
          { onConflict: 'id' }
        );

      if (upsertError) {
        // Fallback: try direct update if the row already exists
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ push_token: token })
          .eq('id', userId);

        if (updateError) {
          // Silent fail — token will retry on next session
        }
      }
    } catch (error: any) {
      // Silent fail — no user-facing alert needed
    }
  };

  return {
    expoPushToken,
    notification,
  };
};

// ─── Welcome Notification on Sign-Up ─────────────────────────────────────────
/**
 * useWelcomeNotification
 * ─────────────────────────────────────────────────────────────────────────────
 * Fires a ONE-TIME local push notification when a brand-new user signs up.
 * Uses AsyncStorage key "welcome_notif_sent_<userId>" so it never repeats.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export const useWelcomeNotification = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const storageKey = `welcome_notif_sent_${user.id}`;

    AsyncStorage.getItem(storageKey).then(async (sent) => {
      if (sent) return; // Already welcomed this user

      // Account creation time — if older than 5 mins it's not a new signup
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const isNewUser = Date.now() - createdAt < 5 * 60 * 1000; // 5 minutes window
      if (!isNewUser) {
        // Mark as sent anyway so we don't check again
        await AsyncStorage.setItem(storageKey, "true");
        return;
      }

      // Schedule 2 seconds after sign-up
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🎉 Zaman Mall mein khush amdeed!",
          body: "Aapke pehle order par special offer! Abhi shop karein. 🛍️",
          sound: "default",
          data: {
            type: "welcome",
            url: "/(tabs)/",
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
          repeats: false,
        },
      });

      await AsyncStorage.setItem(storageKey, "true");
    });
  }, [user?.id]);
};
