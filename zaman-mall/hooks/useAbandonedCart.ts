import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { useAuth } from "@/context/AuthContext";
import useCart from "@/hooks/useCart";

const CART_NOTIF_ID_KEY = "cart_abandon_notif_id";
const ABANDON_DELAY_SEC = 3600; // 1 hour

/**
 * useAbandonedCart
 * ─────────────────
 * • When a user has items in cart and hasn't checked out:
 *   → schedule a repeating local notification every 1 hour.
 * • If the cart becomes empty (user ordered / cleared it) or logs out:
 *   → cancel the scheduled notification immediately.
 */
export const useAbandonedCart = () => {
  const { user } = useAuth();
  const { cart } = useCart();
  const scheduledIdRef = useRef<string | null>(null);

  // Restore scheduled id from Notifications identifier list on mount
  useEffect(() => {
    if (!user) return;

    Notifications.getAllScheduledNotificationsAsync().then((all) => {
      const existing = all.find(
        (n) => n.content.data?.type === "abandoned_cart"
      );
      if (existing) {
        scheduledIdRef.current = existing.identifier;
      }
    });
  }, [user]);

  useEffect(() => {
    if (!user) {
      if (scheduledIdRef.current) {
        Notifications.cancelScheduledNotificationAsync(scheduledIdRef.current).then(() => {
          scheduledIdRef.current = null;
        });
      }
      return;
    }

    const hasItems = cart?.items && cart.items.length > 0;

    if (hasItems && !scheduledIdRef.current) {
      // Cart has items → schedule repeating abandoned cart reminder after 1h
      Notifications.scheduleNotificationAsync({
        content: {
          title: "🛒 Oops! Aapne cart mein items chhor diye!",
          body: "Zaman Mall: Abhi order complete karein aur apne products ghar mangwayein! 🛍️",
          sound: "default",
          data: {
            type: "abandoned_cart",
            url: "/(tabs)/cart",
          },
        },
        trigger: {
          seconds: ABANDON_DELAY_SEC,
          repeats: true,
        } as any,
      }).then((id) => {
        scheduledIdRef.current = id;
      });
    } else if (!hasItems && scheduledIdRef.current) {
      // Cart emptied (order placed / cleared) → cancel reminder
      Notifications.cancelScheduledNotificationAsync(scheduledIdRef.current)
        .then(() => {
          scheduledIdRef.current = null;
        });
    }
  }, [cart?.items?.length, user]);
};
