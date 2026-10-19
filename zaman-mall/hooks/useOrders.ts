import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Order, ReturnRequest } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { useEffect } from "react";
import * as Notifications from "expo-notifications";

export const useOrders = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();

  const ordersQuery = useQuery<Order[]>({
    queryKey: ["orders", user?.id],
    staleTime: 0,                  // always consider stale — refetch on every focus
    refetchOnWindowFocus: true,    // refetch when app comes to foreground
    refetchOnMount: true,          // refetch every time component mounts
    queryFn: async ({ signal }) => {
      if (!user) return [];

      // Fetch orders and reviews in parallel
      const [ordersRes, reviewsRes] = await Promise.all([
        supabase
          .from("orders")
          .select("*")
          .eq("userId", user.id)
          .order("date", { ascending: false })
          .abortSignal(signal),
        supabase
          .from("reviews")
          .select("orderId")
          .eq("user_id", user.id)
      ]);

      if (ordersRes.error) {
        console.error("Orders query error:", ordersRes.error);
        throw ordersRes.error;
      }

      const reviewedOrderIds = new Set(
        (reviewsRes.data || [])
          .filter(r => r.orderId)
          .map(r => String(r.orderId))
      );

      return (ordersRes.data || []).map((order: any) => {
        let items = order.items;

        if (typeof items === 'string') {
          try {
            items = JSON.parse(items);
          } catch (e) {
            console.error("Failed to parse order items:", e);
            items = [];
          }
        }
        
        let returnRequest = order.returnRequest;
        if (typeof returnRequest === 'string') {
          try {
            returnRequest = JSON.parse(returnRequest);
          } catch (e) {
            returnRequest = undefined;
          }
        }

         const total = order.total || 0;
 
         return {
          id: String(order.id),
          userId: order.userId,
          items: items || [],
          total: total || 0,
          status: order.status || 'pending',
          date: order.date || new Date().toISOString(),
          deliveredAt: order.deliveredAt,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          customerEmail: order.customerEmail,
          shippingAddress: order.shippingAddress,
          paymentMethod: order.paymentMethod || 'cod',
          paymentStatus: order.paymentStatus || order.payment_status || undefined,
          paymentReceiptUrl: order.paymentReceiptUrl || order.payment_receipt_url || undefined,
          returnRequest: returnRequest,
          hasReviewed: reviewedOrderIds.has(String(order.id))
        };
      });
    },
    enabled: !!user,
  });

  // ── Realtime subscription — payment_status AND order status changes ─────
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`orders-payment-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `userId=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new as any;
          const prev = payload.old as any;

          const newPaymentStatus = updated.paymentStatus || updated.payment_status;
          const prevPaymentStatus = prev?.paymentStatus || prev?.payment_status;
          const newStatus = updated.status;
          const prevStatus = prev?.status;
          const orderId = String(updated.id).slice(-6).toUpperCase();

          // ── Update cache ──────────────────────────────────────────────────
          queryClient.setQueryData(
            ['orders', user.id],
            (old: Order[] | undefined) => {
              if (!old) return old;
              return old.map((o) => {
                if (String(o.id) !== String(updated.id)) return o;
                return {
                  ...o,
                  status: updated.status || o.status,
                  paymentStatus: newPaymentStatus || o.paymentStatus,
                };
              });
            }
          );

          // ── Payment status alerts ─────────────────────────────────────────
          if (newPaymentStatus && newPaymentStatus !== prevPaymentStatus) {
            let notifTitle = "";
            let notifBody = "";

            if (newPaymentStatus === 'approved') {
              notifTitle = '🎉 Payment Approved! — Zaman Mall';
              notifBody = `Order #${orderId} ki payment verify ho gayi. Order ab active queue mein hai.`;
              showAlert({
                title: '🎉 Payment Approved!',
                message: `Order #${orderId} ki payment verify ho gayi. Order ab active queue mein hai.`,
                icon: 'checkmark-circle-outline',
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
            } else if (newPaymentStatus === 'rejected') {
              notifTitle = '❌ Payment Rejected — Zaman Mall';
              notifBody = `Order #${orderId} ki payment reject ho gayi. Dobara order karein ya support se rabta karein.`;
              showAlert({
                title: '❌ Payment Rejected',
                message: `Order #${orderId} ki payment reject ho gayi. Dobara order karein ya support se rabta karein.`,
                icon: 'close-circle-outline',
                buttons: [{ text: 'OK', onPress: () => {} }],
              });
            }

            if (notifTitle) {
              Notifications.scheduleNotificationAsync({
                content: {
                  title: notifTitle,
                  body: notifBody,
                  sound: "default",
                  data: { url: '/(profile)/orders', type: 'payment_status' }
                },
                trigger: null,
              }).catch(() => {});
            }
          }

          // ── Order status alerts ───────────────────────────────────────────
          if (newStatus && newStatus !== prevStatus) {
            const statusMessages: Record<string, { title: string; message: string; icon: string }> = {
              shipped: {
                title: '📦 Order Shipped!',
                message: `Order #${orderId} dispatch ho gaya hai aur raaste mein hai. Jald hi pahunch jaye ga.`,
                icon: 'car-outline',
              },
              delivered: {
                title: '✅ Order Delivered!',
                message: `Order #${orderId} deliver ho gaya! Zaman Mall choose karne ka shukriya.`,
                icon: 'home-outline',
              },
              cancelled: {
                title: 'Order Cancelled',
                message: `Order #${orderId} cancel ho gaya hai.`,
                icon: 'close-circle-outline',
              },
            };

            const msg = statusMessages[newStatus];
            if (msg) {
              showAlert({
                title: msg.title,
                message: msg.message,
                icon: msg.icon as any,
                buttons: [{ text: 'OK', onPress: () => {} }],
              });

              Notifications.scheduleNotificationAsync({
                content: {
                  title: `Zaman Mall: ${msg.title}`,
                  body: msg.message,
                  sound: "default",
                  data: { url: '/(profile)/orders', type: 'order_status' }
                },
                trigger: null,
              }).catch(() => {});
            }
          }

          // Full refetch for consistency
          queryClient.invalidateQueries({ queryKey: ['orders', user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: "cancelled" })
        .eq("id", orderId)
        .eq("userId", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      showAlert({
        title: "Success",
        message: "Order cancelled successfully",
        icon: "checkmark-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
    },
    onError: (error) => {
      showAlert({
        title: "Error",
        message: "Failed to cancel order",
        icon: "alert-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
    },
  });

  const returnOrderMutation = useMutation({
    mutationFn: async ({ orderId, reason }: { orderId: string; reason: string }) => {
      const returnRequest: ReturnRequest = {
        reason,
        status: "pending",
        requestedAt: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("orders")
        .update({
          status: "return_pending",
          returnRequest: JSON.stringify(returnRequest),
        })
        .eq("id", orderId)
        .eq("userId", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      showAlert({
        title: "✅ Return Request Bhej Di Gai",
        message: "Aapki return request submit ho gayi. Admin 24-48 ghante mein review karega aur aapko update milega.",
        icon: "arrow-undo-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
    },
    onError: (error) => {
      showAlert({
        title: "Error",
        message: "Return request submit karne mein masla aaya. Dobara try karein.",
        icon: "alert-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
    },
  });

  const markOrderAsReviewedMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ hasReviewed: true })
        .eq("id", orderId)
        .eq("userId", user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
    },
  });

  return {
    ...ordersQuery,
    cancelOrder: cancelOrderMutation.mutate,
    isCancelling: cancelOrderMutation.isPending,
    returnOrder: returnOrderMutation.mutate,
    isReturning: returnOrderMutation.isPending,
    markOrderAsReviewed: markOrderAsReviewedMutation.mutate,
  };
};
