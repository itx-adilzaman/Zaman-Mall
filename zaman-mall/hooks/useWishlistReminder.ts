import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/context/AuthContext";
import useWishlist from "@/hooks/useWishlist";

const REMINDER_DELAY_SEC = 3600; // 1 hour

export const useWishlistReminder = () => {
  const { user } = useAuth();
  const { wishlist } = useWishlist();
  const scheduledIdRef = useRef<string | null>(null);

  // Restore scheduled ID from active notification list on mount
  useEffect(() => {
    if (!user) return;

    Notifications.getAllScheduledNotificationsAsync().then((all) => {
      const existing = all.find(
        (n) => n.content.data?.type === "wishlist_reminder"
      );
      if (existing) {
        scheduledIdRef.current = existing.identifier;
      }
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      // If user logs out, clear reminder if scheduled
      if (scheduledIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(scheduledIdRef.current).then(() => {
          scheduledIdRef.current = null;
        });
      }
      return;
    }

    const hasItems = wishlist && wishlist.length > 0;

    if (hasItems && !scheduledIdRef.current) {
      // Wishlist has items -> schedule repeating reminder every 1 hour
      Notifications.scheduleNotificationAsync({
        content: {
          title: "❤️ Wishlist Reminder!",
          body: "Zaman Mall: Aap ke wishlist mein items pending hain! Dekhein kya pata un par discounts chal rahe hon.",
          sound: "default",
          data: {
            type: "wishlist_reminder",
            url: "/(tabs)/wishlist",
          },
        },
        trigger: {
          seconds: REMINDER_DELAY_SEC,
          repeats: true,
        } as any, // Cast to any to satisfy SchedulableTriggerInputTypes warning if standard Expo versions mismatch
      }).then((id) => {
        scheduledIdRef.current = id;
      });
    } else if (!hasItems && scheduledIdRef.current) {
      // Wishlist is empty -> cancel reminder
      Notifications.cancelScheduledNotificationAsync(scheduledIdRef.current)
        .then(() => {
          scheduledIdRef.current = null;
        });
    }
  }, [wishlist?.length, user]);
};
export default useWishlistReminder;
