import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/context/AuthContext";

export const useLoginNotification = () => {
  const { user } = useAuth();
  const prevUserRef = useRef<any>(null);

  useEffect(() => {
    // Check if user has changed from null to defined
    if (user && !prevUserRef.current) {
      // Avoid triggering login notification if the user just registered (created_at is within 5 minutes)
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0;
      const isNewSignUp = Date.now() - createdAt < 5 * 60 * 1000;

      if (!isNewSignUp) {
        // Retrieve displayName
        const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || "Customer";
        
        Notifications.scheduleNotificationAsync({
          content: {
            title: `👋 Welcome back, ${displayName}!`,
            body: "Zaman Mall mein khush amdeed! Hamare naye stock aur discounts abhi check karein. 🛍️",
            sound: "default",
            data: { url: "/(tabs)/" },
          },
          trigger: null,
        }).catch(() => {});
      }
    }
    prevUserRef.current = user;
  }, [user]);
};

export default useLoginNotification;
