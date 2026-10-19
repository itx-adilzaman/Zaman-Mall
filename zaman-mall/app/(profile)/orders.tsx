import React from "react";
import SafeScreen from "@/components/SafeScreen";
import { useOrders } from "@/hooks/useOrders";
import { formatDate } from "@/lib/utils";
import { Order } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator, ScrollView, Text, TouchableOpacity,
  View, Modal, TextInput, Animated, Easing,
} from "react-native";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import PremiumTextInput from "@/components/PremiumTextInput";
import { useFocusEffect } from "expo-router";

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getStatusTitle = (status: string, paymentStatus?: string) => {
  if (paymentStatus === 'awaiting_approval') return "Payment Verify Ho Rahi Hai";
  if (paymentStatus === 'approved') return "Payment Approved ✓";
  if (paymentStatus === 'rejected') return "Payment Reject Ho Gayi";
  if (status === "pending") return "Order Processing";
  if (status === "shipped") return "On the Way";
  if (status === "delivered") return "Delivered";
  if (status === "cancelled") return "Cancelled";
  if (status === "return_pending") return "Return Request Pending";
  if (status === "returned") return "Returned";
  return status;
};

const getStatusSubtitle = (status: string, paymentStatus?: string) => {
  if (paymentStatus === 'awaiting_approval')
    return "Admin aapki receipt 1-2 ghante mein check karega. Approve hone ke baad order active ho jaye ga.";
  if (paymentStatus === 'approved')
    return "Aapki payment confirm ho gayi. Order ab process ho raha hai.";
  if (paymentStatus === 'rejected')
    return "Aapki payment reject ho gayi. Dobara order karein ya support se rabta karein.";
  if (status === "pending") return "Aap ka order receive ho chuka hai aur process me hai.";
  if (status === "shipped") return "Aap ka order dispatch ho chuka hai aur raaste me hai.";
  if (status === "delivered") return "Order deliver ho chuka hai. Zaman Mall choose karne ka shukriya.";
  if (status === "cancelled") return "Yeh order cancel ho chuka hai.";
  if (status === "return_pending") return "Aapki return request admin ke paas review ke liye hai. 24-48 ghante mein update milega.";
  if (status === "returned") return "Is order ke liye return process ho chuki hai ya chal rahi hai.";
  return "";
};

// ─── Loading / Error ─────────────────────────────────────────────────────────
function LoadingUI() {
  const { colors } = useTheme();
  return (
    <SafeScreen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </SafeScreen>
  );
}

function ErrorUI() {
  const { colors } = useTheme();
  return (
    <SafeScreen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={{ color: colors.text, marginTop: 12, fontWeight: '700' }}>Failed to load orders</Text>
      </View>
    </SafeScreen>
  );
}

// ─── Return Card ─────────────────────────────────────────────────────────────
function ReturnCard({ order, colors }: { order: Order; colors: any }) {
  const rr = order.returnRequest;
  const isApproved  = rr?.status === 'approved';
  const isRejected  = rr?.status === 'rejected';
  const isPending   = !rr || rr.status === 'pending';

  const accentColor = isApproved ? '#10B981' : isRejected ? '#EF4444' : '#F97316';
  const accentBg    = isApproved ? 'rgba(16,185,129,0.1)' : isRejected ? 'rgba(239,68,68,0.08)' : 'rgba(249,115,22,0.08)';
  const accentBorder= isApproved ? 'rgba(16,185,129,0.3)' : isRejected ? 'rgba(239,68,68,0.2)' : 'rgba(249,115,22,0.25)';

  const statusIcon  = isApproved ? 'checkmark-circle' : isRejected ? 'close-circle' : 'time-outline';
  const statusLabel = isApproved ? 'Return Approved' : isRejected ? 'Return Rejected' : 'Return Pending';
  const statusDesc  = isApproved
    ? 'Aapki return request approve ho gayi. Return instructions jald bhej di jayengi.'
    : isRejected
    ? 'Aapki return request reject ho gayi. Zyada details ke liye support se rabta karein.'
    : 'Admin 24-48 ghante mein review karega. Aapko update milega.';

  return (
    <View style={{
      borderRadius: 24, padding: 20, borderWidth: 1,
      backgroundColor: colors.surface,
      borderColor: accentBorder,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
    }}>

      {/* ── Status Banner ── */}
      <View style={{
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        padding: 14, borderRadius: 16, marginBottom: 16,
        backgroundColor: accentBg, borderWidth: 1, borderColor: accentBorder,
      }}>
        <View style={{
          width: 38, height: 38, borderRadius: 12,
          backgroundColor: accentColor + '20',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Ionicons name={statusIcon as any} size={20} color={accentColor} />
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ color: accentColor, fontWeight: '900', fontSize: 13, letterSpacing: 0.3 }}>
            {statusLabel}
          </Text>
          <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }}>
            {statusDesc}
          </Text>
        </View>
      </View>

      {/* ── Order Header ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{
            width: 38, height: 38, borderRadius: 19,
            backgroundColor: accentColor + '15',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons name="arrow-undo" size={18} color={accentColor} />
          </View>
          <View>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              {formatDate(order.date)}
            </Text>
          </View>
        </View>

        {/* Status pill */}
        <View style={{
          paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
          borderWidth: 1, backgroundColor: accentBg, borderColor: accentColor + '50',
        }}>
          <Text style={{ color: accentColor, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {isPending ? 'Review Mein' : isApproved ? 'Approved' : 'Rejected'}
          </Text>
        </View>
      </View>

      {/* ── Product Row ── */}
      <TouchableOpacity
        onPress={() => router.push(`/product/${order.items[0]?.baseProductId || order.items[0]?.id}`)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', padding: 12, borderRadius: 18,
          borderWidth: 1, marginBottom: 14,
          backgroundColor: colors.background + '40', borderColor: colors.border,
        }}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={order.items[0]?.image || 'https://via.placeholder.com/150'}
            style={{ width: 68, height: 68, borderRadius: 14 }}
            contentFit="cover" transition={200}
          />
          {order.items.length > 1 && (
            <View style={{
              position: 'absolute', bottom: -5, right: -5,
              width: 20, height: 20, borderRadius: 10,
              backgroundColor: accentColor,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: colors.surface,
            }}>
              <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>
                +{order.items.length - 1}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center', gap: 5 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={2}>
            {order.items[0]?.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.textSecondary, fontWeight: '600', fontSize: 13 }}>
              Rs. {order.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              Qty: {order.items.reduce((a, i) => a + i.quantity, 0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Return Reason ── */}
      {rr?.reason && (
        <View style={{
          padding: 14, borderRadius: 16, borderWidth: 1,
          backgroundColor: colors.background + '30', borderColor: colors.border,
          marginBottom: 14, gap: 6,
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={colors.textSecondary} />
            <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Return Reason
            </Text>
          </View>
          <Text style={{ color: colors.text, fontSize: 13, lineHeight: 19 }}>
            {rr.reason}
          </Text>
        </View>
      )}

      {/* ── Requested At ── */}
      {rr?.requestedAt && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
            Request Ki Gayi: {formatDate(rr.requestedAt)}
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({
  order,
  colors,
  timelineProgress,
  onCancel,
  onReturn,
  onReview,
  isCancelling,
  isReturning,
}: {
  order: Order;
  colors: any;
  timelineProgress: Animated.Value;
  onCancel: (id: string) => void;
  onReturn: (id: string) => void;
  onReview: (order: Order) => void;
  isCancelling: boolean;
  isReturning: boolean;
}) {
  const isOnlinePayment = order.paymentMethod === 'easypaisa' || order.paymentMethod === 'jazzcash';
  const isAwaitingApproval = order.paymentStatus === 'awaiting_approval';
  const isPaymentApproved = order.paymentStatus === 'approved';
  const isPaymentRejected = order.paymentStatus === 'rejected';
  const isWaitingList = isOnlinePayment &&
    (isAwaitingApproval || isPaymentRejected || order.paymentStatus === 'pending');

  const cardBorderColor = isAwaitingApproval
    ? 'rgba(245,158,11,0.35)'
    : isPaymentRejected
    ? 'rgba(239,68,68,0.35)'
    : isPaymentApproved
    ? 'rgba(16,185,129,0.25)'
    : colors.glassBorder;

  const badgeColor = isAwaitingApproval ? '#F59E0B'
    : isPaymentRejected ? '#EF4444'
    : isPaymentApproved ? '#10B981'
    : order.status === 'delivered' ? '#22C55E'
    : order.status === 'cancelled' ? '#EF4444'
    : order.status === 'return_pending' ? '#F97316'
    : order.status === 'returned' ? '#F97316'
    : '#3B82F6';

  const badgeBg = isAwaitingApproval ? 'rgba(245,158,11,0.12)'
    : isPaymentRejected ? 'rgba(239,68,68,0.1)'
    : isPaymentApproved ? 'rgba(16,185,129,0.1)'
    : order.status === 'delivered' ? 'rgba(34,197,94,0.1)'
    : order.status === 'cancelled' ? 'rgba(239,68,68,0.1)'
    : order.status === 'return_pending' ? 'rgba(249,115,22,0.1)'
    : order.status === 'returned' ? 'rgba(249,115,22,0.1)'
    : 'rgba(59,130,246,0.1)';

  const badgeLabel = isAwaitingApproval ? 'Awaiting'
    : isPaymentRejected ? 'Rejected'
    : isPaymentApproved ? 'Approved'
    : order.status === 'return_pending' ? 'Return Pending'
    : order.status === 'returned' ? 'Returned'
    : order.status;

  return (
    <View
      key={order.id}
      style={{
        borderRadius: 24, padding: 20, borderWidth: 1,
        backgroundColor: colors.surface,
        borderColor: cardBorderColor,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08, shadowRadius: 8, elevation: 2,
      }}
    >
      {/* ── Waiting List Banner ── */}
      {isWaitingList && (
        <View style={{
          marginBottom: 14, borderRadius: 14, padding: 12,
          flexDirection: 'row', alignItems: 'flex-start', gap: 10,
          backgroundColor: isAwaitingApproval ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.08)',
          borderWidth: 1,
          borderColor: isAwaitingApproval ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.25)',
        }}>
          <View style={{
            width: 32, height: 32, borderRadius: 10,
            backgroundColor: isAwaitingApproval ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.15)',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Ionicons
              name={isAwaitingApproval ? 'time-outline' : 'close-circle-outline'}
              size={18}
              color={isAwaitingApproval ? '#F59E0B' : '#EF4444'}
            />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{
              color: isAwaitingApproval ? '#F59E0B' : '#EF4444',
              fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              {isAwaitingApproval
                ? '⏳ Waiting — Payment Verify Ho Rahi Hai'
                : '❌ Payment Reject Ho Gayi'}
            </Text>
            <Text style={{
              color: isAwaitingApproval ? 'rgba(245,158,11,0.85)' : 'rgba(239,68,68,0.8)',
              fontSize: 11, lineHeight: 16,
            }}>
              {isAwaitingApproval
                ? `${order.paymentMethod === 'easypaisa' ? 'Easypaisa' : 'JazzCash'} receipt admin ke paas hai. Approve hote hi order queue mein aa jaye ga.`
                : 'Receipt verify nahi ho saki. Dobara order karein ya support se rabta karein.'}
            </Text>
          </View>
        </View>
      )}

      {/* ── Approved Banner ── */}
      {isPaymentApproved && (
        <View style={{
          marginBottom: 14, borderRadius: 14, padding: 12,
          flexDirection: 'row', alignItems: 'center', gap: 10,
          backgroundColor: 'rgba(16,185,129,0.1)',
          borderWidth: 1, borderColor: 'rgba(16,185,129,0.3)',
        }}>
          <Ionicons name="checkmark-circle" size={20} color="#10B981" />
          <Text style={{ color: '#10B981', fontWeight: '800', fontSize: 12, flex: 1 }}>
            🎉 Payment Approved — Order ab active queue mein hai
          </Text>
        </View>
      )}

      {/* ── Order Header ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{
            width: 40, height: 40, borderRadius: 20,
            backgroundColor: colors.background + '30',
            alignItems: 'center', justifyContent: 'center', marginRight: 12,
          }}>
            <Ionicons
              name={isWaitingList ? 'time-outline' : 'receipt-outline'}
              size={20}
              color={isAwaitingApproval ? '#F59E0B' : isPaymentRejected ? '#EF4444' : colors.primary}
            />
          </View>
          <View>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
              #{order.id.slice(0, 8).toUpperCase()}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
              {formatDate(order.date)}
            </Text>
          </View>
        </View>
        <View style={{
          paddingHorizontal: 10, paddingVertical: 5,
          borderRadius: 20, borderWidth: 1,
          backgroundColor: badgeBg,
          borderColor: badgeColor + '50',
        }}>
          <Text style={{ color: badgeColor, fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {badgeLabel}
          </Text>
        </View>
      </View>

      {/* ── Product Card ── */}
      <TouchableOpacity
        onPress={() => router.push(`/product/${order.items[0]?.baseProductId || order.items[0]?.id}`)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row', marginBottom: 16, padding: 12,
          borderRadius: 18, borderWidth: 1,
          backgroundColor: colors.background + '40',
          borderColor: colors.border,
        }}
      >
        <View style={{ position: 'relative' }}>
          <Image
            source={order.items[0]?.image || 'https://via.placeholder.com/150'}
            style={{ width: 72, height: 72, borderRadius: 16 }}
            contentFit="cover"
            transition={200}
          />
          {order.items.length > 1 && (
            <View style={{
              position: 'absolute', bottom: -6, right: -6,
              width: 22, height: 22, borderRadius: 11,
              backgroundColor: colors.primary,
              alignItems: 'center', justifyContent: 'center',
              borderWidth: 2, borderColor: colors.surface,
            }}>
              <Text style={{ color: '#000', fontSize: 9, fontWeight: '900' }}>
                +{order.items.length - 1}
              </Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 14, justifyContent: 'center', gap: 6 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }} numberOfLines={2}>
            {order.items[0]?.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 16 }}>
              Rs. {order.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 11 }}>
              Qty: {order.items.reduce((a, i) => a + i.quantity, 0)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Status Info Box ── */}
      <View style={{
        marginBottom: 14, borderRadius: 16, padding: 12,
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderWidth: 1,
        backgroundColor: isAwaitingApproval ? 'rgba(245,158,11,0.07)'
          : isPaymentRejected ? 'rgba(239,68,68,0.06)'
          : isPaymentApproved ? 'rgba(16,185,129,0.07)'
          : order.status === 'delivered' ? 'rgba(34,197,94,0.1)'
          : order.status === 'cancelled' ? 'rgba(239,68,68,0.06)'
          : order.status === 'returned' ? 'rgba(249,115,22,0.06)'
          : colors.background + '30',
        borderColor: isAwaitingApproval ? 'rgba(245,158,11,0.22)'
          : isPaymentRejected ? 'rgba(239,68,68,0.18)'
          : isPaymentApproved ? 'rgba(16,185,129,0.22)'
          : order.status === 'delivered' ? 'rgba(34,197,94,0.3)'
          : order.status === 'cancelled' ? 'rgba(239,68,68,0.2)'
          : order.status === 'returned' ? 'rgba(249,115,22,0.2)'
          : colors.border,
      }}>
        <View style={{ flex: 1, marginRight: 10, gap: 3 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons
              name={
                isAwaitingApproval ? 'time-outline'
                : isPaymentRejected ? 'close-circle-outline'
                : isPaymentApproved ? 'checkmark-circle-outline'
                : order.status === 'delivered' ? 'checkmark-circle'
                : order.status === 'cancelled' ? 'close-circle'
                : order.status === 'returned' ? 'arrow-undo'
                : 'time-outline'
              }
              size={15}
              color={
                isAwaitingApproval ? '#F59E0B'
                : isPaymentRejected ? '#EF4444'
                : isPaymentApproved ? '#10B981'
                : order.status === 'delivered' ? '#22C55E'
                : order.status === 'cancelled' ? '#EF4444'
                : order.status === 'returned' ? '#F97316'
                : colors.primary
              }
            />
            <Text style={{ color: colors.text, fontSize: 11, fontWeight: '700' }}>
              {getStatusTitle(order.status, order.paymentStatus)}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16 }} numberOfLines={2}>
            {getStatusSubtitle(order.status, order.paymentStatus)}
          </Text>
        </View>
        <View style={{
          paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10,
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: isAwaitingApproval ? 'rgba(245,158,11,0.15)'
            : isPaymentRejected ? 'rgba(239,68,68,0.12)'
            : isPaymentApproved ? 'rgba(16,185,129,0.15)'
            : order.status === 'delivered' ? 'rgba(34,197,94,0.2)'
            : order.status === 'cancelled' ? 'rgba(239,68,68,0.15)'
            : colors.surface,
        }}>
          <View style={{
            width: 6, height: 6, borderRadius: 3,
            backgroundColor: isAwaitingApproval ? '#F59E0B'
              : isPaymentRejected ? '#EF4444'
              : isPaymentApproved ? '#10B981'
              : order.status === 'delivered' ? '#22C55E'
              : order.status === 'cancelled' ? '#EF4444'
              : colors.primary,
          }} />
          <Text style={{
            fontSize: 9, fontWeight: '800',
            color: isAwaitingApproval ? '#D97706'
              : isPaymentRejected ? '#B91C1C'
              : isPaymentApproved ? '#065F46'
              : order.status === 'delivered' ? '#166534'
              : order.status === 'cancelled' ? '#B91C1C'
              : colors.textSecondary,
          }}>
            {isAwaitingApproval ? 'Waiting'
              : isPaymentRejected ? 'Rejected'
              : isPaymentApproved ? 'Approved'
              : order.status === 'delivered' ? 'Completed'
              : order.status === 'cancelled' ? 'Closed'
              : order.status === 'returned' ? 'Returned'
              : 'Live'}
          </Text>
        </View>
      </View>

      {/* ── Timeline (only for non-cancelled, non-returned, non-waiting) ── */}
      {order.status !== 'cancelled' && order.status !== 'returned' && !isWaitingList && (
        <View style={{ marginBottom: 16, paddingHorizontal: 4 }}>
          {/* Step dots row */}
          <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
            {[
              { label: 'Order\nPlaced',  icon: 'cube-outline',     active: true },
              { label: 'Confirmed',      icon: 'checkmark-circle-outline', active: ['shipped', 'delivered'].includes(order.status) },
              { label: 'Shipped',        icon: 'car-outline',       active: ['shipped', 'delivered'].includes(order.status) },
              { label: 'Delivered',      icon: 'home-outline',      active: order.status === 'delivered' },
            ].map((s, idx, arr) => (
              <React.Fragment key={s.label}>
                {/* Step */}
                <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
                  <View style={{
                    width: 34, height: 34, borderRadius: 17,
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: s.active ? colors.primary : colors.surfaceSecondary,
                    borderWidth: 2,
                    borderColor: s.active ? colors.primary : colors.border,
                  }}>
                    <Ionicons
                      name={s.icon as any}
                      size={15}
                      color={s.active ? '#000' : colors.textSecondary}
                    />
                  </View>
                  <Text style={{
                    fontSize: 8, fontWeight: '800', textTransform: 'uppercase',
                    letterSpacing: 0.3, textAlign: 'center', lineHeight: 11,
                    color: s.active ? colors.primary : colors.textSecondary,
                  }}>
                    {s.label}
                  </Text>
                </View>

                {/* Connector line between steps */}
                {idx < arr.length - 1 && (
                  <View style={{
                    flex: 0.5, height: 2, marginTop: 16,
                    backgroundColor: arr[idx + 1].active ? colors.primary : colors.border,
                    borderRadius: 1,
                  }} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>
      )}

      {/* ── Cancelled/Returned badge ── */}
      {(order.status === 'cancelled' || order.status === 'returned' || order.status === 'return_pending') && (
        <View style={{
          marginBottom: 14, padding: 12, borderRadius: 14,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
          backgroundColor: order.status === 'return_pending' ? 'rgba(249,115,22,0.08)' : 'rgba(239,68,68,0.06)',
          borderWidth: 1,
          borderColor: order.status === 'return_pending' ? 'rgba(249,115,22,0.25)' : 'rgba(239,68,68,0.15)',
        }}>
          <Ionicons
            name={order.status === 'cancelled' ? 'close-circle' : 'arrow-undo'}
            size={16}
            color={order.status === 'return_pending' ? '#F97316' : '#EF4444'}
          />
          <Text style={{
            color: order.status === 'return_pending' ? '#F97316' : '#EF4444',
            fontWeight: '700', fontSize: 12, textTransform: 'uppercase',
          }}>
            {order.status === 'return_pending'
              ? '⏳ Return Request — Admin Review Mein'
              : `Order ${order.status}${order.returnRequest ? ' (Return Requested)' : ''}`}
          </Text>
        </View>
      )}

      {/* ── Action Buttons ── */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {order.status === 'pending' && !isWaitingList && (
          <TouchableOpacity
            onPress={() => onCancel(order.id)}
            disabled={isCancelling}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 18,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
              backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
            }}
          >
            {isCancelling
              ? <ActivityIndicator size="small" color="#EF4444" />
              : <>
                  <Ionicons name="close-circle" size={16} color="#EF4444" />
                  <Text style={{ color: '#EF4444', fontWeight: '700', fontSize: 13 }}>Cancel Order</Text>
                </>
            }
          </TouchableOpacity>
        )}

        {order.status === 'delivered' && !order.hasReviewed && (
          <TouchableOpacity
            onPress={() => onReview(order)}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 18,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
              backgroundColor: colors.primary + '15', borderWidth: 1, borderColor: colors.primary + '40',
            }}
          >
            <Ionicons name="star-outline" size={16} color={colors.primary} />
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}>Review Now</Text>
          </TouchableOpacity>
        )}

        {order.status === 'delivered' && order.hasReviewed && (
          <View style={{
            flex: 1, paddingVertical: 14, borderRadius: 18,
            alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
            backgroundColor: 'rgba(34,197,94,0.1)', borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
          }}>
            <Ionicons name="checkmark-circle" size={16} color="#1DB954" />
            <Text style={{ color: '#1DB954', fontWeight: '700', fontSize: 13 }}>Reviewed</Text>
          </View>
        )}

        {order.status === 'delivered' && (
          <TouchableOpacity
            onPress={() => onReturn(order.id)}
            disabled={isReturning}
            style={{
              flex: 1, paddingVertical: 14, borderRadius: 18,
              alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8,
              backgroundColor: colors.glassSurface, borderWidth: 1, borderColor: colors.glassBorder,
            }}
          >
            <Ionicons name="arrow-undo" size={16} color={colors.text} />
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>Return</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
function OrdersScreen() {
  const { colors } = useTheme();
  const { showAlert } = useAlert();
  const {
    data: orders, isLoading, isError,
    cancelOrder, returnOrder, isCancelling, isReturning,
    refetch,
  } = useOrders();

  // ── Screen focus par auto-refetch ─────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [returnModalVisible, setReturnModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [returnCategory, setReturnCategory] = useState('');
  const [returnDetails, setReturnDetails] = useState('');
  const [selectedTab, setSelectedTab] = useState<"pending_payment" | "active" | "returns" | "history">("active");
  const [timelineProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    timelineProgress.setValue(0);
    Animated.timing(timelineProgress, {
      toValue: 1, duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [timelineProgress, selectedTab, orders]);

  // ── Categorise orders ──────────────────────────────────────────────────────
  const pendingPaymentOrders = (orders ?? []).filter(
    (o) => (o.paymentMethod === 'easypaisa' || o.paymentMethod === 'jazzcash') &&
      (o.paymentStatus === 'awaiting_approval' || o.paymentStatus === 'rejected' || o.paymentStatus === 'pending')
  );

  const activeOrders = (orders ?? []).filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled' && o.status !== 'returned' &&
      o.status !== 'return_pending' &&
      (o.paymentStatus === 'approved' || o.paymentStatus === 'paid' || o.paymentMethod === 'cod')
  );

  const returnOrders = (orders ?? []).filter(
    (o) => o.status === 'returned' || o.status === 'return_pending'
  );

  const historyOrders = (orders ?? []).filter(
    (o) => o.status === 'delivered' || o.status === 'cancelled'
  );

  const visibleOrders =
    selectedTab === 'pending_payment' ? pendingPaymentOrders :
    selectedTab === 'active' ? activeOrders :
    selectedTab === 'returns' ? returnOrders :
    historyOrders;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCancelOrder = (orderId: string) => {
    showAlert({
      title: 'Cancel Order', message: 'Are you sure you want to cancel this order?',
      icon: 'close-circle-outline',
      buttons: [
        { text: 'No', onPress: () => {}, style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => cancelOrder(orderId) },
      ],
    });
  };

  const handleReturnOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
    setReturnCategory('');
    setReturnDetails('');
    setReturnModalVisible(true);
  };

  const handleOpenReview = (order: Order) => {
    const productId = order.items[0]?.baseProductId || order.items[0]?.id;
    if (productId) {
      router.push({ pathname: `/product/${productId}`, params: { autoReview: 'true', orderId: order.id } } as any);
    }
  };

  const submitReturnRequest = () => {
    if (!selectedOrderId || !returnCategory) {
      showAlert({ title: 'Select Reason', message: 'Please select a return reason.', icon: 'information-circle-outline', buttons: [{ text: 'OK', onPress: () => {} }] });
      return;
    }
    const fullReason = returnDetails.trim()
      ? `${returnCategory}: ${returnDetails.trim()}`
      : returnCategory;
    returnOrder({ orderId: selectedOrderId, reason: fullReason });
    setReturnModalVisible(false);
    setSelectedTab('returns');
  };

  if (isLoading) return <LoadingUI />;
  if (isError) return <ErrorUI />;

  const emptyText =
    selectedTab === 'active' ? 'Koi active order nahi hai.' :
    selectedTab === 'pending_payment' ? 'Koi pending payment order nahi hai.' :
    selectedTab === 'returns' ? 'Koi return request nahi hai.' :
    'Koi complete ya cancel order nahi mila.';

  return (
    <SafeScreen>
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Header */}
        <View style={{
          paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16,
          flexDirection: 'row', alignItems: 'center',
          borderBottomWidth: 1, borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              width: 40, height: 40, borderRadius: 20,
              alignItems: 'center', justifyContent: 'center',
              marginRight: 12, borderWidth: 1,
              backgroundColor: colors.glassSurface, borderColor: colors.glassBorder,
            }}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>My Orders</Text>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
          {(!orders || orders.length === 0) ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 }}>
              {/* Icon */}
              <View style={{
                width: 96, height: 96, borderRadius: 48,
                backgroundColor: colors.glassSurface,
                borderWidth: 1, borderColor: colors.glassBorder,
                alignItems: 'center', justifyContent: 'center',
                marginBottom: 4,
              }}>
                <Ionicons name="receipt-outline" size={46} color={colors.textSecondary} />
              </View>

              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 20, letterSpacing: -0.3 }}>
                Koi order nahi
              </Text>
              <Text style={{
                color: colors.textSecondary, textAlign: 'center',
                fontSize: 13, lineHeight: 20, maxWidth: 260,
              }}>
                Abhi tak koi order nahi kiya. Shopping shuru karein aur orders yahan nazar aayenge.
              </Text>

              {/* Button */}
              <TouchableOpacity
                onPress={() => router.push('/')}
                activeOpacity={0.85}
                style={{
                  marginTop: 12,
                  paddingVertical: 16, paddingHorizontal: 40,
                  borderRadius: 20,
                  backgroundColor: colors.primary,
                  flexDirection: 'row', alignItems: 'center', gap: 8,
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                <Ionicons name="bag-handle-outline" size={18} color="#000" />
                <Text style={{ color: '#000', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}>
                  Shopping Karein
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 16 }}>

              {/* ── Tab Bar ── */}
              <View style={{
                flexDirection: 'row', padding: 4, borderRadius: 24,
                borderWidth: 1, borderColor: colors.border,
                backgroundColor: colors.surface, marginBottom: 4,
              }}>
                {pendingPaymentOrders.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSelectedTab('pending_payment')}
                    activeOpacity={0.85}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 20,
                      alignItems: 'center', justifyContent: 'center',
                      backgroundColor: selectedTab === 'pending_payment' ? '#F59E0B' : 'transparent',
                      position: 'relative',
                    }}
                  >
                    <Text style={{
                      fontSize: 11, fontWeight: '700',
                      color: selectedTab === 'pending_payment' ? '#000' : '#F59E0B',
                    }}>
                      Awaiting
                    </Text>
                    <View style={{
                      position: 'absolute', top: 2, right: 6,
                      backgroundColor: '#EF4444', borderRadius: 6,
                      minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>
                        {pendingPaymentOrders.length}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setSelectedTab('active')}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 20,
                    alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    backgroundColor: selectedTab === 'active' ? colors.primary : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: selectedTab === 'active' ? '#000' : colors.textSecondary,
                  }}>
                    Active
                  </Text>
                  {activeOrders.length > 0 && (
                    <View style={{
                      position: 'absolute', top: 2, right: 6,
                      backgroundColor: colors.primary, borderRadius: 6,
                      minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
                    }}>
                      <Text style={{ color: '#000', fontSize: 8, fontWeight: '900' }}>
                        {activeOrders.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedTab('returns')}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 20,
                    alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    backgroundColor: selectedTab === 'returns' ? '#F97316' : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: selectedTab === 'returns' ? '#fff' : colors.textSecondary,
                  }}>
                    Returns
                  </Text>
                  {returnOrders.length > 0 && (
                    <View style={{
                      position: 'absolute', top: 2, right: 6,
                      backgroundColor: '#F97316', borderRadius: 6,
                      minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>
                        {returnOrders.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedTab('history')}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, paddingVertical: 10, borderRadius: 20,
                    alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                    backgroundColor: selectedTab === 'history' ? colors.primary : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: 11, fontWeight: '700',
                    color: selectedTab === 'history' ? '#000' : colors.textSecondary,
                  }}>
                    History
                  </Text>
                  {historyOrders.length > 0 && (
                    <View style={{
                      position: 'absolute', top: 2, right: 6,
                      backgroundColor: selectedTab === 'history' ? '#000' : colors.textSecondary,
                      borderRadius: 6,
                      minWidth: 14, height: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
                      opacity: 0.65,
                    }}>
                      <Text style={{ color: '#fff', fontSize: 8, fontWeight: '900' }}>
                        {historyOrders.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* ── Empty state ── */}
              {visibleOrders.length === 0 ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 10 }}>
                  <Ionicons name="information-circle-outline" size={32} color={colors.textSecondary} />
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: 15 }}>{emptyText}</Text>
                </View>
              ) : (
                visibleOrders.map((order: Order) => (
                  selectedTab === 'returns'
                    ? <ReturnCard key={order.id} order={order} colors={colors} />
                    : <OrderCard
                        key={order.id}
                        order={order}
                        colors={colors}
                        timelineProgress={timelineProgress}
                        onCancel={handleCancelOrder}
                        onReturn={handleReturnOrder}
                        onReview={handleOpenReview}
                        isCancelling={isCancelling}
                        isReturning={isReturning}
                      />
                ))
              )}
            </View>
          )}
        </ScrollView>

        {/* ── Return Modal ── */}
        <Modal
          visible={returnModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setReturnModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}>
            <View style={{
              backgroundColor: colors.background,
              borderTopLeftRadius: 32, borderTopRightRadius: 32,
              maxHeight: '90%',
              borderTopWidth: 1, borderColor: colors.border,
            }}>
              {/* Handle */}
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
                <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
              >
                {/* Header */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16 }}>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.3 }}>Return Request</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>7-day return policy applies</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setReturnModalVisible(false)}
                    style={{
                      width: 36, height: 36, borderRadius: 12,
                      backgroundColor: colors.surfaceSecondary,
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>

                {/* Policy Banner */}
                <View style={{
                  backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 16,
                  padding: 14, borderWidth: 1, borderColor: 'rgba(59,130,246,0.2)',
                  flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginBottom: 20,
                }}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#3B82F6" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={{ color: '#3B82F6', fontWeight: '800', fontSize: 12 }}>Return Policy</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 17 }}>
                      • 7 din ke andar return request karein{'\n'}
                      • Product original packaging mein hona chahiye{'\n'}
                      • Used ya damaged items return nahi ho saktay{'\n'}
                      • Refund 3-5 business days mein process hoga
                    </Text>
                  </View>
                </View>

                {/* Step 1: Return Reason Categories */}
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginBottom: 12 }}>
                  Return ka reason select karein *
                </Text>

                {[
                  { id: 'Wrong Item Received',       icon: 'swap-horizontal-outline',  color: '#EF4444', desc: 'Galat product deliver hua' },
                  { id: 'Damaged / Defective Item',  icon: 'warning-outline',           color: '#F59E0B', desc: 'Product damaged ya kharab hai' },
                  { id: 'Product Not as Described',  icon: 'alert-circle-outline',      color: '#8B5CF6', desc: 'Product description se match nahi' },
                  { id: 'Size / Fit Issue',          icon: 'resize-outline',            color: '#3B82F6', desc: 'Size galat hai' },
                  { id: 'Quality Not Satisfactory',  icon: 'thumbs-down-outline',       color: '#EC4899', desc: 'Quality expectations se kam hai' },
                  { id: 'Changed My Mind',           icon: 'heart-dislike-outline',     color: '#6B7280', desc: 'Ab yeh product nahi chahiye' },
                  { id: 'Missing Parts / Accessories', icon: 'cube-outline',            color: '#10B981', desc: 'Parts ya accessories missing hain' },
                ].map(r => {
                  const sel = returnCategory === r.id;
                  return (
                    <TouchableOpacity
                      key={r.id}
                      onPress={() => setReturnCategory(r.id)}
                      activeOpacity={0.85}
                      style={{
                        flexDirection: 'row', alignItems: 'center', gap: 14,
                        padding: 14, borderRadius: 16, marginBottom: 8,
                        borderWidth: sel ? 2 : 1,
                        borderColor: sel ? r.color : colors.border,
                        backgroundColor: sel ? r.color + '10' : colors.surface,
                      }}
                    >
                      <View style={{
                        width: 40, height: 40, borderRadius: 12,
                        backgroundColor: r.color + '15',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons name={r.icon as any} size={20} color={r.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{r.id}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 1 }}>{r.desc}</Text>
                      </View>
                      <View style={{
                        width: 22, height: 22, borderRadius: 11,
                        borderWidth: 2,
                        borderColor: sel ? r.color : colors.border,
                        backgroundColor: sel ? r.color : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {sel && <Ionicons name="checkmark" size={13} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Step 2: Additional Details */}
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800', marginTop: 16, marginBottom: 10 }}>
                  Additional Details (Optional)
                </Text>
                <View style={{
                  borderRadius: 16, borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.surface,
                  padding: 14,
                }}>
                  <TextInput
                    value={returnDetails}
                    onChangeText={setReturnDetails}
                    placeholder="Koi additional information share karein..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={4}
                    style={{
                      color: colors.text, fontSize: 13, lineHeight: 20,
                      minHeight: 90, textAlignVertical: 'top',
                    }}
                  />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6, marginLeft: 4 }}>
                  {returnDetails.length}/300 characters
                </Text>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={submitReturnRequest}
                  disabled={isReturning || !returnCategory}
                  style={{
                    marginTop: 20, paddingVertical: 16, borderRadius: 18,
                    alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10,
                    backgroundColor: returnCategory ? colors.primary : colors.surfaceSecondary,
                    opacity: (!returnCategory || isReturning) ? 0.6 : 1,
                  }}
                >
                  {isReturning
                    ? <ActivityIndicator size="small" color="#000" />
                    : <>
                        <Ionicons name="arrow-undo-circle-outline" size={20} color={returnCategory ? '#000' : colors.textSecondary} />
                        <Text style={{
                          color: returnCategory ? '#000' : colors.textSecondary,
                          fontWeight: '900', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1,
                        }}>
                          Submit Return Request
                        </Text>
                      </>
                  }
                </TouchableOpacity>

                <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 16 }}>
                  Request submit hone ke baad admin 24-48 hours mein review karega.{'\n'}
                  Approved hone par return instructions send ki jayengi.
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

      </View>
    </SafeScreen>
  );
}

export default OrdersScreen;
