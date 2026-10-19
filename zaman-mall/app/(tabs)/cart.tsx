import React, { useState, useMemo } from "react";
import SafeScreen from "@/components/SafeScreen";
import { useAddresses } from "@/hooks/useAddresses";
import useCart from "@/hooks/useCart";
import useProducts from "@/hooks/useProducts";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import {
  ActivityIndicator, ScrollView, Text, TouchableOpacity,
  View, Dimensions, Platform, Pressable,
} from "react-native";
import { Address, Order } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import OnlinePaymentModal from "@/components/OnlinePaymentModal";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import * as Crypto from 'expo-crypto';
import { router as expoRouter, useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Notifications from "expo-notifications";

const { width } = Dimensions.get("window");
const CARD_W = (width - 48 - 12) / 2;

// Tab bar total height: 70 (bar) + 15 (bottom margin) = 85, plus safe area bottom
const TAB_BAR_HEIGHT = 85;

// ─── Step indicator ──────────────────────────────────────────────────────────
const STEPS = ['Cart', 'Address', 'Payment', 'Review'];

const StepIndicator = ({ current, colors }: { current: number; colors: any }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
    {STEPS.map((label, i) => (
      <React.Fragment key={label}>
        <View style={{ alignItems: 'center', gap: 4 }}>
          <View style={{
            width: 32, height: 32, borderRadius: 16,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: i < current ? colors.primary : i === current ? colors.primary : 'transparent',
            borderWidth: i < current || i === current ? 0 : 1.5,
            borderColor: colors.glassBorder,
          }}>
            {i < current
              ? <Ionicons name="checkmark" size={16} color="#000" />
              : <Text style={{ color: i === current ? '#000' : colors.textSecondary, fontSize: 12, fontWeight: '900' }}>{i + 1}</Text>
            }
          </View>
          <Text style={{
            color: i === current ? colors.primary : colors.textSecondary,
            fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5,
          }}>{label}</Text>
        </View>
        {i < STEPS.length - 1 && (
          <View style={{
            flex: 1, height: 1.5, marginBottom: 16, marginHorizontal: 4,
            backgroundColor: i < current ? colors.primary : colors.glassBorder,
          }} />
        )}
      </React.Fragment>
    ))}
  </View>
);

// ─── Proceed / Place Order button (solid, no gradient) ───────────────────────
const ProceedButton = ({
  label, onPress, loading, backAction, primaryColor, bottomInset, colors,
}: {
  label: string; onPress: () => void; loading?: boolean;
  backAction?: () => void; primaryColor: string; bottomInset: number;
  colors: any;
}) => {
  const totalBottom = TAB_BAR_HEIGHT + bottomInset + 8;

  return (
    <View style={{
      position: 'absolute',
      bottom: totalBottom,
      left: 0, right: 0,
      paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12,
      flexDirection: 'row', gap: 12,
      backgroundColor: 'transparent',
    }}>
      {backAction && (
        <TouchableOpacity
          onPress={backAction}
          style={{
            width: 56, height: 56, borderRadius: 18,
            alignItems: 'center', justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: colors.surface,
          }}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.85}
        style={{
          flex: 1, height: 56, borderRadius: 18,
          backgroundColor: primaryColor,
          alignItems: 'center', justifyContent: 'center',
          flexDirection: 'row', gap: 10,
          shadowColor: primaryColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
          opacity: loading ? 0.75 : 1,
        }}
      >
        {loading
          ? <ActivityIndicator color="#000" size="small" />
          : <>
              <Text style={{ color: '#000', fontWeight: '900', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1.5 }}>
                {label}
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#000" />
            </>
        }
      </TouchableOpacity>
    </View>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
const CartScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const insets = useSafeAreaInsets();
  const { cart, cartItemCount, clearCart, isLoading, removeFromCart, updateQuantity } = useCart();
  const { addresses } = useAddresses();
  const { data: products } = useProducts();

  const [step, setStep] = useState(0); // 0=cart 1=address 2=payment 3=review
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'cod' | 'easypaisa' | 'jazzcash'>('cod');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [updatingQty, setUpdatingQty] = useState<Set<string>>(new Set());

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const shipping = 250;
  const total = subtotal + shipping;

  // China products mein COD allowed nahi — sirf advance payment
  const hasChineseProducts = useMemo(() =>
    cartItems.some(item => {
      const country = item.country || products?.find(p => String(p.id) === String(item.baseProductId || item.id))?.country;
      return country === 'china';
    }),
  [cartItems, products]);

  // Agar China products hain aur COD selected hai toh auto-switch to easypaisa
  React.useEffect(() => {
    if (hasChineseProducts && selectedPayment === 'cod') {
      setSelectedPayment('easypaisa');
    }
  }, [hasChineseProducts]);

  // ── Suggested products (same category as first cart item) ──────────────────
  const suggested = useMemo(() => {
    if (!products || !cartItems[0]) return [];
    return products
      .filter(p => p.category === cartItems[0].category && !cartItems.find(c => String(c.baseProductId || c.id) === String(p.id)))
      .slice(0, 6);
  }, [products, cartItems]);

  const changeQty = async (id: string, cur: number, delta: number) => {
    const next = cur + delta;
    if (next < 1 || updatingQty.has(id)) return;
    setUpdatingQty(s => new Set(s).add(id));
    try { await updateQuantity({ cartItemId: id, quantity: next }); }
    finally { setUpdatingQty(s => { const n = new Set(s); n.delete(id); return n; }); }
  };

  const confirmRemove = (id: string, name: string) =>
    showAlert({
      title: 'Remove Item', message: `Remove "${name}" from cart?`, icon: 'trash-outline',
      buttons: [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        { text: 'Remove', style: 'destructive', onPress: () => removeFromCart(id) },
      ],
    });

  const goNext = () => {
    if (step === 0) {
      if (!user) { router.push('/(auth)'); return; }
      if (!addresses.length) {
        showAlert({ title: 'No Address', message: 'Add a delivery address first.', icon: 'location-outline', buttons: [{ text: 'Add Now', onPress: () => router.push('/(profile)/addresses') }] });
        return;
      }
      setStep(1);
    } else if (step === 1) {
      if (!selectedAddress) {
        showAlert({ title: 'Select Address', message: 'Please choose a delivery address.', icon: 'alert-circle-outline', buttons: [{ text: 'OK', onPress: () => {} }] });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleProceed = () => {
    if (step < 3) { goNext(); return; }
    // step === 3 (review)
    if (selectedPayment === 'easypaisa' || selectedPayment === 'jazzcash') {
      setShowPaymentModal(true);
    } else {
      placeOrder();
    }
  };

  const handleReceiptUploaded = async (receiptUrl: string) => {
    setShowPaymentModal(false);
    await placeOrder(receiptUrl);
  };

  const placeOrder = async (receiptUrl?: string) => {
    if (!user || !selectedAddress) return;
    setPlacingOrder(true);
    try {
      const orderId = Crypto.randomUUID();
      const isOnline = selectedPayment === 'easypaisa' || selectedPayment === 'jazzcash';
      const paymentStatus = isOnline ? (receiptUrl ? 'awaiting_approval' : 'pending') : 'paid';

      let inserted = false;
      // Try 1: camelCase + payment columns
      { const { error } = await supabase.from('orders').insert([{
        id: orderId, userId: user.id, items: cartItems, total,
        status: 'pending', date: new Date().toISOString(),
        customerName: selectedAddress.fullName, customerPhone: selectedAddress.phone,
        customerEmail: user.email || '',
        shippingAddress: `${selectedAddress.streetAddress}, ${selectedAddress.city}, ${selectedAddress.province || ''}`.replace(/, $/, ''),
        paymentMethod: selectedPayment, paymentStatus, paymentReceiptUrl: receiptUrl || null,
      }]);
      if (!error) inserted = true; else console.warn('[Order] try1:', error.message); }

      // Try 2: snake_case payment columns
      if (!inserted) { const { error } = await supabase.from('orders').insert([{
        id: orderId, userId: user.id, items: cartItems, total,
        status: 'pending', date: new Date().toISOString(),
        customerName: selectedAddress.fullName, customerPhone: selectedAddress.phone,
        customerEmail: user.email || '',
        shippingAddress: `${selectedAddress.streetAddress}, ${selectedAddress.city}, ${selectedAddress.province || ''}`.replace(/, $/, ''),
        paymentMethod: selectedPayment, payment_status: paymentStatus, payment_receipt_url: receiptUrl || null,
      }]);
      if (!error) inserted = true; else console.warn('[Order] try2:', error.message); }

      // Try 3: no payment columns
      if (!inserted) { const { error } = await supabase.from('orders').insert([{
        id: orderId, userId: user.id, items: cartItems, total,
        status: 'pending', date: new Date().toISOString(),
        customerName: selectedAddress.fullName, customerPhone: selectedAddress.phone,
        customerEmail: user.email || '',
        shippingAddress: `${selectedAddress.streetAddress}, ${selectedAddress.city}, ${selectedAddress.province || ''}`.replace(/, $/, ''),
        paymentMethod: selectedPayment,
      }]);
      if (!error) inserted = true; else console.warn('[Order] try3:', error.message); }

      if (!inserted) throw new Error('Order insert failed');

      // Notify
      try {
        const fd = new FormData();
        fd.append('access_key', 'c8f29373-4d3a-4355-8dcb-83bcb5809716');
        fd.append('subject', `🛒 New Order — ${orderId} (${selectedPayment.toUpperCase()})`);
        fd.append('to', 'malikmuhammadadilzaman@gmail.com');
        fd.append('message', `Order: ${orderId}\nTotal: Rs.${total.toLocaleString()}\nPayment: ${selectedPayment}\nStatus: ${paymentStatus}`);
        await fetch('https://api.web3forms.com/submit', { method: 'POST', body: fd });
      } catch (_) {}

      // Trigger immediate local notification on order placement
      try {
        const shortId = orderId.slice(-8).toUpperCase();
        Notifications.scheduleNotificationAsync({
          content: {
            title: "🛍️ Order Placed Successfully!",
            body: `Zaman Mall: Aap ka order #${shortId} received ho gaya hai aur confirmation pending hai.`,
            sound: "default",
            data: { url: '/(profile)/orders', type: 'order_status' }
          },
          trigger: null,
        }).catch(() => {});
      } catch (_) {}

      clearCart();
      queryClient.invalidateQueries({ queryKey: ['orders', user.id] });
      queryClient.invalidateQueries({ queryKey: ['cart', user.id] });
      router.replace({ pathname: '/order-success', params: { orderId, paymentMethod: selectedPayment, paymentStatus } });
    } catch {
      showAlert({ title: 'Order Failed', message: 'Could not place order. Please try again.', icon: 'alert-circle-outline', buttons: [{ text: 'OK', onPress: () => {} }] });
    } finally {
      setPlacingOrder(false);
    }
  };

  if (isLoading) return (
    <SafeScreen>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    </SafeScreen>
  );

  const proceedLabel = step === 3
    ? (selectedPayment === 'cod' ? 'Place Order' : 'Proceed to Pay')
    : step === 0 ? 'Proceed to Address'
    : step === 1 ? 'Proceed to Payment'
    : 'Review Order';

  return (
    <SafeScreen>
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Step indicator — only when cart has items */}
        {cartItems.length > 0 && (
          <StepIndicator current={step} colors={colors} />
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: cartItems.length > 0
              ? TAB_BAR_HEIGHT + insets.bottom + 80
              : 40,
          }}
        >
          {/* ── STEP 0: CART ─────────────────────────────────────── */}
          {step === 0 && (
            <>
              {/* Header */}
              <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontSize: 26, fontWeight: '900', letterSpacing: -0.5 }}>
                    My Cart
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                    {cartItemCount} {cartItemCount === 1 ? 'item' : 'items'} · Rs. {subtotal.toLocaleString()}
                  </Text>
                </View>
                {cartItemCount > 0 && (
                  <View style={{
                    backgroundColor: colors.primary + '18', paddingHorizontal: 14, paddingVertical: 6,
                    borderRadius: 20, borderWidth: 1, borderColor: colors.primary + '30',
                  }}>
                    <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 12 }}>{cartItemCount}</Text>
                  </View>
                )}
              </View>

              {cartItems.length === 0 ? (
                /* Empty state */
                <View style={{ alignItems: 'center', paddingTop: 80, paddingBottom: 40, gap: 16 }}>
                  <View style={{
                    width: 96, height: 96, borderRadius: 32,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                  }}>
                    <Ionicons name="cart-outline" size={44} color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} />
                  </View>
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)', fontSize: 15, fontWeight: '700' }}>
                    Your cart is empty
                  </Text>
                  <TouchableOpacity
                    onPress={() => expoRouter.push('/(tabs)/')}
                    style={{
                      backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 12,
                      borderRadius: 16, marginTop: 8,
                    }}
                  >
                    <Text style={{ color: '#000', fontWeight: '900', fontSize: 13 }}>Start Shopping</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* ── 2-COLUMN PRODUCT GRID ── */}
                  <View style={{ paddingHorizontal: 16 }}>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                      {cartItems.map((item) => {
                        const productInfo = products?.find(p => String(p.id) === String(item.baseProductId || item.id));
                        const country = item.country || productInfo?.country;
                        const isUpdating = updatingQty.has(item.id);

                        return (
                          <View
                            key={item.id}
                            style={{
                              width: CARD_W,
                              backgroundColor: colors.surface,
                              borderRadius: 24,
                              borderWidth: 1,
                              borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)',
                              overflow: 'hidden',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 3 },
                              shadowOpacity: isDark ? 0.28 : 0.08,
                              shadowRadius: 8,
                              elevation: 3,
                            }}
                          >
                            {/* Product image */}
                            <View style={{ position: 'relative' }}>
                              <Image
                                source={item.images?.[0] || item.image}
                                style={{ width: CARD_W, height: CARD_W }}
                                contentFit="cover"
                              />
                              {/* Country badge — bottom left */}
                              {country && (
                                <View style={{
                                  position: 'absolute', bottom: 8, left: 8,
                                  flexDirection: 'row', alignItems: 'center', gap: 4,
                                  backgroundColor: 'rgba(0,0,0,0.6)',
                                  paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8,
                                }}>
                                  <Image
                                    source={country === 'china'
                                      ? require('@/assets/images/china.png')
                                      : require('@/assets/images/pakistan.png')}
                                    style={{ width: 14, height: 10 }}
                                    contentFit="contain"
                                  />
                                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                                    {country === 'china' ? 'CN' : 'PK'}
                                  </Text>
                                </View>
                              )}
                              {/* Remove button — top right */}
                              <TouchableOpacity
                                onPress={() => confirmRemove(item.id, item.name)}
                                style={{
                                  position: 'absolute', top: 8, right: 8,
                                  width: 30, height: 30, borderRadius: 10,
                                  backgroundColor: 'rgba(239,68,68,0.88)',
                                  alignItems: 'center', justifyContent: 'center',
                                }}
                              >
                                <Ionicons name="close" size={15} color="#fff" />
                              </TouchableOpacity>
                            </View>

                            {/* Info section */}
                            <View style={{ padding: 12, gap: 6 }}>
                              {/* Name */}
                              <Text
                                style={{
                                  color: isDark ? '#fff' : '#0a0a0a',
                                  fontWeight: '700', fontSize: 12, lineHeight: 17,
                                }}
                                numberOfLines={2}
                              >
                                {item.name}
                              </Text>

                              {/* Price */}
                              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                                <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 15 }}>
                                  Rs. {(item.price * item.quantity).toLocaleString()}
                                </Text>
                                {item.quantity > 1 && (
                                  <Text style={{ color: colors.textSecondary, fontSize: 10 }}>
                                    ×{item.quantity}
                                  </Text>
                                )}
                              </View>

                              {/* Quantity controls */}
                              <View style={{
                                flexDirection: 'row', alignItems: 'center',
                                justifyContent: 'space-between',
                                backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                                borderRadius: 14, padding: 4, marginTop: 2,
                              }}>
                                <TouchableOpacity
                                  onPress={() => changeQty(item.id, item.quantity, -1)}
                                  disabled={isUpdating || item.quantity <= 1}
                                  style={{
                                    width: 32, height: 32, borderRadius: 10,
                                    alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)',
                                    opacity: item.quantity <= 1 ? 0.4 : 1,
                                  }}
                                >
                                  <Ionicons name="remove" size={15} color={isDark ? '#fff' : '#0a0a0a'} />
                                </TouchableOpacity>

                                {isUpdating
                                  ? <ActivityIndicator size="small" color={colors.primary} />
                                  : <Text style={{
                                      color: isDark ? '#fff' : '#0a0a0a',
                                      fontWeight: '900', fontSize: 15,
                                      minWidth: 28, textAlign: 'center',
                                    }}>
                                      {item.quantity}
                                    </Text>
                                }

                                <TouchableOpacity
                                  onPress={() => changeQty(item.id, item.quantity, 1)}
                                  disabled={isUpdating}
                                  style={{
                                    width: 32, height: 32, borderRadius: 10,
                                    alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: colors.primary,
                                  }}
                                >
                                  <Ionicons name="add" size={15} color="#000" />
                                </TouchableOpacity>
                              </View>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </View>

                  {/* ── ORDER SUMMARY ── */}
                  <View style={{
                    marginHorizontal: 16, marginTop: 20,
                    backgroundColor: colors.surface,
                    borderRadius: 24, borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                    padding: 20,
                    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 8, elevation: 2,
                  }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 16 }}>
                      Order Summary
                    </Text>
                    <View style={{ gap: 10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Subtotal ({cartItemCount} items)</Text>
                        <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontWeight: '700', fontSize: 13 }}>Rs. {subtotal.toLocaleString()}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Delivery Charges</Text>
                        <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontWeight: '700', fontSize: 13 }}>Rs. {shipping}</Text>
                      </View>
                      <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)', marginVertical: 4 }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontWeight: '900', fontSize: 16 }}>Total</Text>
                        <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 20 }}>Rs. {total.toLocaleString()}</Text>
                      </View>
                    </View>

                    {/* China advance payment notice */}
                    {hasChineseProducts && (
                      <View style={{
                        marginTop: 14,
                        backgroundColor: 'rgba(239,68,68,0.08)',
                        borderRadius: 12, padding: 10, borderWidth: 1,
                        borderColor: 'rgba(239,68,68,0.2)',
                        flexDirection: 'row', alignItems: 'center', gap: 8,
                      }}>
                        <Image
                          source={require('@/assets/images/china.png')}
                          style={{ width: 18, height: 12 }}
                          contentFit="contain"
                        />
                        <Text style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', fontSize: 11, flex: 1, lineHeight: 16 }}>
                          China products ke liye <Text style={{ color: '#EF4444', fontWeight: '800' }}>Advance Payment</Text> zaroori hai — COD available nahi
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* ── SUGGESTED PRODUCTS ── */}
                  {suggested.length > 0 && (
                    <View style={{ marginTop: 32, paddingHorizontal: 16 }}>
                      {/* Section header */}
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                        <View>
                          <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontSize: 17, fontWeight: '900', letterSpacing: -0.3 }}>
                            You May Also Like
                          </Text>
                          <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                            More from this category
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => expoRouter.push('/(tabs)/')}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                            backgroundColor: colors.primary + '15',
                            paddingHorizontal: 12, paddingVertical: 7,
                            borderRadius: 12,
                          }}
                        >
                          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '800' }}>See All</Text>
                          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
                        </TouchableOpacity>
                      </View>

                      {/* 2-column grid — centered with auto margins */}
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
                        {suggested.map(item => (
                          <TouchableOpacity
                            key={item.id}
                            onPress={() => expoRouter.push(`/product/${item.id}`)}
                            activeOpacity={0.85}
                            style={{
                              width: CARD_W,
                              backgroundColor: colors.surface,
                              borderRadius: 22,
                              borderWidth: 1,
                              borderColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)',
                              overflow: 'hidden',
                              shadowColor: '#000',
                              shadowOffset: { width: 0, height: 3 },
                              shadowOpacity: isDark ? 0.25 : 0.08,
                              shadowRadius: 8,
                              elevation: 3,
                            }}
                          >
                            {/* Image */}
                            <View style={{ position: 'relative' }}>
                              <Image
                                source={item.images?.[0] || item.image}
                                style={{ width: CARD_W, height: CARD_W }}
                                contentFit="cover"
                              />
                              {/* Country flag */}
                              {item.country && (
                                <View style={{
                                  position: 'absolute', bottom: 8, left: 8,
                                  flexDirection: 'row', alignItems: 'center', gap: 4,
                                  backgroundColor: 'rgba(0,0,0,0.55)',
                                  paddingHorizontal: 7, paddingVertical: 3,
                                  borderRadius: 8,
                                }}>
                                  <Image
                                    source={item.country === 'china'
                                      ? require('@/assets/images/china.png')
                                      : require('@/assets/images/pakistan.png')}
                                    style={{ width: 14, height: 10 }}
                                    contentFit="contain"
                                  />
                                  <Text style={{ color: '#fff', fontSize: 9, fontWeight: '800' }}>
                                    {item.country === 'china' ? 'CN' : 'PK'}
                                  </Text>
                                </View>
                              )}
                              {/* Featured badge */}
                              {item.featured && (
                                <View style={{
                                  position: 'absolute', top: 8, right: 8,
                                  backgroundColor: '#F59E0B',
                                  paddingHorizontal: 7, paddingVertical: 3,
                                  borderRadius: 8,
                                  flexDirection: 'row', alignItems: 'center', gap: 3,
                                }}>
                                  <Ionicons name="star" size={9} color="#000" />
                                  <Text style={{ color: '#000', fontSize: 9, fontWeight: '900' }}>Top Pick</Text>
                                </View>
                              )}
                            </View>

                            {/* Info */}
                            <View style={{ padding: 12, gap: 4 }}>
                              <Text
                                style={{
                                  color: isDark ? '#fff' : '#0a0a0a',
                                  fontWeight: '700', fontSize: 12, lineHeight: 17,
                                }}
                                numberOfLines={2}
                              >
                                {item.name}
                              </Text>

                              {/* Rating row */}
                              {item.averageRating && item.averageRating > 0 ? (
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  <Ionicons name="star" size={11} color="#F59E0B" />
                                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
                                    {item.averageRating.toFixed(1)}
                                    {item.totalReviews ? ` (${item.totalReviews})` : ''}
                                  </Text>
                                </View>
                              ) : null}

                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                                <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 14 }}>
                                  Rs. {item.price.toLocaleString()}
                                </Text>
                                <View style={{
                                  width: 30, height: 30, borderRadius: 10,
                                  backgroundColor: colors.primary,
                                  alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <Ionicons name="add" size={16} color="#000" />
                                </View>
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </>
              )}
            </>
          )}

          {/* ── STEP 1: ADDRESS ──────────────────────────────────── */}
          {step === 1 && (
            <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
              <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontSize: 22, fontWeight: '900', marginBottom: 4 }}>
                Delivery Address
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 20 }}>
                Choose where to deliver your order
              </Text>

              <View style={{ gap: 12 }}>
                {addresses.map((addr) => {
                  const isSelected = selectedAddress?.id === addr.id;
                  return (
                    <Pressable
                      key={addr.id}
                      onPress={() => setSelectedAddress(addr)}
                      android_ripple={null}
                      style={{
                        borderRadius: 20, borderWidth: isSelected ? 2 : 1,
                        borderColor: isSelected ? colors.primary : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)'),
                        backgroundColor: isSelected
                          ? (isDark ? '#1a2e1a' : '#f0fdf4')
                          : (isDark ? '#1a1a1a' : '#ffffff'),
                        padding: 18, overflow: 'hidden',
                        elevation: 0,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14, flex: 1 }}>
                          {/* Icon */}
                          <View style={{
                            width: 44, height: 44, borderRadius: 14,
                            backgroundColor: isSelected ? colors.primary + '20' : (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)'),
                            alignItems: 'center', justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: isSelected ? colors.primary + '30' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                          }}>
                            <Ionicons
                              name={addr.label?.toLowerCase() === 'work' ? 'briefcase-outline' : 'home-outline'}
                              size={20}
                              color={isSelected ? colors.primary : colors.textSecondary}
                            />
                          </View>

                          {/* Details */}
                          <View style={{ flex: 1, gap: 3 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontWeight: '800', fontSize: 14 }}>
                                {addr.label || 'Home'}
                              </Text>
                              {addr.isDefault && (
                                <View style={{
                                  backgroundColor: colors.primary + '20', paddingHorizontal: 7, paddingVertical: 2,
                                  borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '30',
                                }}>
                                  <Text style={{ color: colors.primary, fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>Default</Text>
                                </View>
                              )}
                            </View>
                            <Text style={{ color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.75)', fontSize: 13, fontWeight: '600' }}>
                              {addr.fullName}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                              {addr.phone}
                            </Text>
                            <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
                              {addr.streetAddress}
                              {addr.city ? `, ${addr.city}` : ''}
                              {addr.province ? `, ${addr.province}` : ''}
                            </Text>
                          </View>
                        </View>

                        {/* Check */}
                        <View style={{
                          width: 24, height: 24, borderRadius: 12,
                          borderWidth: 2,
                          borderColor: isSelected ? colors.primary : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                          backgroundColor: isSelected ? colors.primary : 'transparent',
                          alignItems: 'center', justifyContent: 'center',
                        }}>
                          {isSelected && <Ionicons name="checkmark" size={14} color="#000" />}
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Add new address */}
              <TouchableOpacity
                onPress={() => router.push('/(profile)/addresses')}
                style={{
                  marginTop: 12, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed',
                  borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                  padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12,
                }}
              >
                <View style={{
                  width: 44, height: 44, borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="add" size={22} color={colors.textSecondary} />
                </View>
                <Text style={{ color: colors.textSecondary, fontWeight: '700', fontSize: 14 }}>
                  Add New Address
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── STEP 2: PAYMENT ──────────────────────────────────── */}
          {step === 2 && (
            <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
              <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontSize: 22, fontWeight: '900', marginBottom: 4 }}>
                Payment Method
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 20 }}>
                Choose how you want to pay
              </Text>

              {/* China products notice */}
              {hasChineseProducts && (
                <View style={{
                  marginBottom: 16,
                  backgroundColor: 'rgba(239,68,68,0.08)',
                  borderRadius: 16, padding: 14, borderWidth: 1,
                  borderColor: 'rgba(239,68,68,0.22)',
                  flexDirection: 'row', gap: 10, alignItems: 'flex-start',
                }}>
                  <View style={{
                    width: 32, height: 32, borderRadius: 10,
                    backgroundColor: 'rgba(239,68,68,0.15)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Image
                      source={require('@/assets/images/china.png')}
                      style={{ width: 20, height: 14 }}
                      contentFit="contain"
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 13 }}>
                      China Products — Advance Payment Only
                    </Text>
                    <Text style={{ color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)', fontSize: 12, lineHeight: 18 }}>
                      Aapke cart mein China ke products hain. Cash on Delivery sirf Pakistan products ke liye available hai.
                    </Text>
                  </View>
                </View>
              )}

              <View style={{ gap: 12 }}>
                {[
                  { id: 'cod',       label: 'Cash on Delivery', sub: 'Pay when order arrives',                      icon: 'cash-outline',           color: '#10B981' },
                  { id: 'easypaisa', label: 'Easypaisa',        sub: 'Send to 0318-5576890 & upload receipt',       icon: 'phone-portrait-outline', color: '#1DB954' },
                  { id: 'jazzcash',  label: 'JazzCash',         sub: 'Send to 0336-5942212 & upload receipt',       icon: 'wallet-outline',         color: '#EF4444' },
                ].map(m => {
                  const sel = selectedPayment === m.id;
                  // COD disabled agar China products hain
                  const disabled = m.id === 'cod' && hasChineseProducts;

                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => !disabled && setSelectedPayment(m.id as any)}
                      android_ripple={null}
                      style={{
                        borderRadius: 20,
                        borderWidth: sel ? 2 : 1,
                        borderColor: disabled
                          ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')
                          : sel ? m.color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.09)'),
                        backgroundColor: disabled
                          ? (isDark ? '#1a1a1a' : '#f5f5f5')
                          : sel
                            ? (isDark ? '#1a1a1a' : '#f8fffe')
                            : (isDark ? '#1a1a1a' : '#ffffff'),
                        padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14,
                        opacity: disabled ? 0.45 : 1,
                        overflow: 'hidden',
                        elevation: 0,
                      }}
                    >
                      <View style={{
                        width: 48, height: 48, borderRadius: 16,
                        backgroundColor: disabled ? (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)') : m.color + '18',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Ionicons name={m.icon as any} size={24} color={disabled ? colors.textSecondary : m.color} />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={{
                            color: disabled ? colors.textSecondary : (isDark ? '#fff' : '#0a0a0a'),
                            fontWeight: '800', fontSize: 14,
                          }}>
                            {m.label}
                          </Text>
                          {disabled && (
                            <View style={{
                              backgroundColor: 'rgba(239,68,68,0.12)',
                              paddingHorizontal: 7, paddingVertical: 2,
                              borderRadius: 7, borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
                            }}>
                              <Text style={{ color: '#EF4444', fontSize: 9, fontWeight: '800', textTransform: 'uppercase' }}>
                                Not Available
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
                          {disabled ? 'China products ke liye available nahi' : m.sub}
                        </Text>
                      </View>

                      <View style={{
                        width: 24, height: 24, borderRadius: 12,
                        borderWidth: 2,
                        borderColor: disabled
                          ? (isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)')
                          : sel ? m.color : (isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'),
                        backgroundColor: (!disabled && sel) ? m.color : 'transparent',
                        alignItems: 'center', justifyContent: 'center',
                      }}>
                        {!disabled && sel && <Ionicons name="checkmark" size={14} color="#fff" />}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* Info for online payments */}
              {(selectedPayment === 'easypaisa' || selectedPayment === 'jazzcash') && (
                <View style={{
                  marginTop: 16, backgroundColor: 'rgba(245,158,11,0.08)',
                  borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)',
                  flexDirection: 'row', gap: 10, alignItems: 'flex-start',
                }}>
                  <Ionicons name="information-circle-outline" size={18} color="#F59E0B" style={{ marginTop: 1 }} />
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.6)', fontSize: 12, lineHeight: 18, flex: 1 }}>
                    Next step mein payment number aur receipt upload screen khulegi. Admin 1-2 ghante mein verify karega.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* ── STEP 3: REVIEW ───────────────────────────────────── */}
          {step === 3 && (
            <View style={{ paddingHorizontal: 20, paddingTop: 8, gap: 12 }}>
              <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontSize: 22, fontWeight: '900', marginBottom: 8 }}>
                Order Review
              </Text>

              {/* Order total */}
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20, borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                padding: 20,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 6, elevation: 2,
              }}>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>Order Summary</Text>
                <View style={{ gap: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Items ({cartItemCount})</Text>
                    <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontWeight: '700', fontSize: 13 }}>Rs. {subtotal.toLocaleString()}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={{ color: colors.textSecondary, fontSize: 13 }}>Delivery</Text>
                    <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontWeight: '700', fontSize: 13 }}>Rs. {shipping}</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)' }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontWeight: '900', fontSize: 16 }}>Total</Text>
                    <Text style={{ color: colors.primary, fontWeight: '900', fontSize: 22 }}>Rs. {total.toLocaleString()}</Text>
                  </View>
                </View>
              </View>

              {/* Address */}
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20, borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                padding: 18,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 6, elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Delivery Address</Text>
                </View>
                <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontWeight: '700', fontSize: 14 }}>{selectedAddress?.fullName}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 3 }}>{selectedAddress?.phone}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
                  {selectedAddress?.streetAddress}{selectedAddress?.city ? `, ${selectedAddress.city}` : ''}
                </Text>
              </View>

              {/* Payment */}
              <View style={{
                backgroundColor: colors.surface,
                borderRadius: 20, borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                padding: 18,
                shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.2 : 0.05, shadowRadius: 6, elevation: 2,
              }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="card-outline" size={16} color={colors.textSecondary} />
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Payment Method</Text>
                </View>
                <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontWeight: '800', fontSize: 15 }}>
                  {selectedPayment === 'cod' ? 'Cash on Delivery' : selectedPayment === 'easypaisa' ? 'Easypaisa' : 'JazzCash'}
                </Text>
                {(selectedPayment === 'easypaisa' || selectedPayment === 'jazzcash') && (
                  <View style={{
                    marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8,
                    backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: 10,
                    borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
                  }}>
                    <Ionicons name="time-outline" size={14} color="#F59E0B" />
                    <Text style={{ color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)', fontSize: 12, flex: 1 }}>
                      Payment screen khulegi — receipt upload karein
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── PROCEED BUTTON ──────────────────────────────────────── */}
        {cartItems.length > 0 && (
          <ProceedButton
            label={proceedLabel}
            onPress={handleProceed}
            loading={placingOrder}
            backAction={step > 0 ? () => setStep(s => s - 1) : undefined}
            primaryColor={colors.primary}
            bottomInset={insets.bottom}
            colors={colors}
          />
        )}

        {/* ── ONLINE PAYMENT MODAL ─────────────────────────────────── */}
        {(selectedPayment === 'easypaisa' || selectedPayment === 'jazzcash') && (
          <OnlinePaymentModal
            visible={showPaymentModal}
            method={selectedPayment}
            totalAmount={total}
            onReceiptUploaded={handleReceiptUploaded}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
      </View>
    </SafeScreen>
  );
};

export default CartScreen;
