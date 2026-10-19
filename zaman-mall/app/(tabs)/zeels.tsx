import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View, Text, Dimensions, TouchableOpacity,
  StatusBar, Animated,
  StyleSheet, Share, ScrollView, Modal, Alert,
} from "react-native";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { FlashList } from "@shopify/flash-list";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import LottieView from "lottie-react-native";

const { width: W, height: H } = Dimensions.get("screen");

interface Product {
  id: string; name: string; description?: string;
  price: number; image: string; images?: string[];
  country?: string; category?: string; stock?: number;
}
interface Zeel {
  id: string; title: string; description?: string;
  video_url: string; thumbnail_url?: string;
  product_id?: string | null;
  likes_count: number; views_count: number;
  is_active: boolean; created_at: string;
  product?: Product | null; userLiked?: boolean;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Floating heart ───────────────────────────────────────────────────────────
// ─── Center Heart — fires from screen center on like button press ────────────
const CenterHeart = ({ onDone }: { onDone: () => void }) => {
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0, right: 0, top: 0, bottom: 0,
        alignItems: "center", justifyContent: "center",
        zIndex: 99,
      }}
    >
      <LottieView
        source={require("../../assets/aa68f03e-b3b0-11ee-910c-37b5dabd5cbe.json")}
        autoPlay
        loop={false}
        onAnimationFinish={onDone}
        style={{ width: 160, height: 160 }}
      />
    </Animated.View>
  );
};

// ─── Custom Alert ─────────────────────────────────────────────────────────────
interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}
interface CustomAlertProps {
  visible: boolean;
  icon?: string;
  iconColor?: string;
  iconBg?: string;
  title: string;
  message: string;
  buttons: CustomAlertButton[];
  onClose: () => void;
}

const CustomAlert = ({
  visible, icon, iconColor, iconBg, title, message, buttons, onClose,
}: CustomAlertProps) => {
  const scaleAnim   = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim,   { toValue: 1,   useNativeDriver: true, friction: 7, tension: 100 }),
        Animated.timing(opacityAnim, { toValue: 1,   duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim,   { toValue: 0.85, duration: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0,    duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <Animated.View style={{
        flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
        alignItems: "center", justifyContent: "center",
        opacity: opacityAnim, paddingHorizontal: 32,
      }}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={{
          width: "100%", backgroundColor: "#141414",
          borderRadius: 24, overflow: "hidden",
          borderWidth: 1, borderColor: "#2a2a2a",
          transform: [{ scale: scaleAnim }],
          shadowColor: "#000", shadowOffset: { width: 0, height: 20 },
          shadowOpacity: 0.5, shadowRadius: 30, elevation: 20,
        }}>
          {/* Icon */}
          {icon && (
            <View style={{ alignItems: "center", paddingTop: 28, paddingBottom: 4 }}>
              <View style={{
                width: 64, height: 64, borderRadius: 32,
                backgroundColor: iconBg ?? "rgba(167,139,250,0.15)",
                alignItems: "center", justifyContent: "center",
                borderWidth: 2, borderColor: iconColor ? `${iconColor}30` : "rgba(167,139,250,0.3)",
              }}>
                <Ionicons name={icon as any} size={30} color={iconColor ?? "#a78bfa"} />
              </View>
            </View>
          )}

          {/* Title + Message */}
          <View style={{ paddingHorizontal: 24, paddingTop: icon ? 12 : 28, paddingBottom: 20, alignItems: "center" }}>
            <Text style={{
              color: "#fff", fontSize: 18, fontWeight: "800",
              textAlign: "center", marginBottom: 8, letterSpacing: -0.3,
            }}>{title}</Text>
            <Text style={{
              color: "#888", fontSize: 14, textAlign: "center",
              lineHeight: 20, fontWeight: "400",
            }}>{message}</Text>
          </View>

          {/* Divider */}
          <View style={{ height: 1, backgroundColor: "#1f1f1f" }} />

          {/* Buttons */}
          <View style={{
            flexDirection: buttons.length > 2 ? "column" : "row",
          }}>
            {buttons.map((btn, i) => {
              const isDestructive = btn.style === "destructive";
              const isCancel      = btn.style === "cancel";
              const isLast        = i === buttons.length - 1;
              return (
                <React.Fragment key={i}>
                  <TouchableOpacity
                    onPress={() => { btn.onPress?.(); onClose(); }}
                    activeOpacity={0.7}
                    style={{
                      flex: buttons.length <= 2 ? 1 : undefined,
                      paddingVertical: 16,
                      alignItems: "center",
                      backgroundColor: isDestructive
                        ? "rgba(239,68,68,0.08)"
                        : isCancel ? "transparent" : "transparent",
                    }}
                  >
                    <Text style={{
                      fontSize: 15,
                      fontWeight: isCancel ? "600" : "700",
                      color: isDestructive ? "#ef4444"
                           : isCancel      ? "#555"
                           : "#a78bfa",
                    }}>{btn.text}</Text>
                  </TouchableOpacity>
                  {/* Vertical divider between row buttons */}
                  {buttons.length === 2 && i === 0 && (
                    <View style={{ width: 1, backgroundColor: "#1f1f1f" }} />
                  )}
                  {/* Horizontal divider between column buttons */}
                  {buttons.length > 2 && !isLast && (
                    <View style={{ height: 1, backgroundColor: "#1f1f1f" }} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// ─── Long press menu ──────────────────────────────────────────────────────────
const LongPressMenu = ({
  visible, onClose, item, onLike, onShare, insets, onShowAlert,
}: {
  visible: boolean;
  onClose: () => void;
  item: Zeel;
  onLike: (id: string) => void;
  onShare: (item: Zeel) => void;
  insets: any;
  onShowAlert: (cfg: Omit<CustomAlertProps, "visible" | "onClose">) => void;
}) => {
  const slideY    = useRef(new Animated.Value(300)).current;
  const bgOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideY,    { toValue: 0,   useNativeDriver: true, friction: 8, tension: 80 }),
        Animated.timing(bgOpacity, { toValue: 1,   duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideY,    { toValue: 300, duration: 250, useNativeDriver: true }),
        Animated.timing(bgOpacity, { toValue: 0,   duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const menuOptions = [
    {
      icon: item.userLiked ? "heart" as const : "heart-outline" as const,
      label: item.userLiked ? "Liked" : "Like this Zeel",
      color: item.userLiked ? "#ff4d6d" : "#fff",
      bg: item.userLiked ? "rgba(255,77,109,0.2)" : "rgba(255,255,255,0.1)",
      sub: item.userLiked ? "Tap to remove like" : "Show some love ❤️",
      onPress: () => {
        onClose();
        onLike(item.id);
        onShowAlert({
          icon: item.userLiked ? "heart-dislike-outline" : "heart",
          iconColor: item.userLiked ? "#888" : "#ff4d6d",
          iconBg: item.userLiked ? "rgba(136,136,136,0.15)" : "rgba(255,77,109,0.15)",
          title: item.userLiked ? "Like Removed" : "Liked! ❤️",
          message: item.userLiked
            ? `You removed your like from "${item.title}"`
            : `You liked "${item.title}"`,
          buttons: [{ text: "OK", style: "default" }],
        });
      },
    },
    {
      icon: "paper-plane-outline" as const,
      label: "Share this Zeel",
      color: "#38bdf8",
      bg: "rgba(56,189,248,0.15)",
      sub: "Share with friends",
      onPress: () => {
        onClose();
        onShare(item);
        onShowAlert({
          icon: "paper-plane",
          iconColor: "#38bdf8",
          iconBg: "rgba(56,189,248,0.15)",
          title: "Sharing Zeel 📤",
          message: `Sharing "${item.title}" with your friends.`,
          buttons: [{ text: "OK", style: "default" }],
        });
      },
    },
    ...(item.product ? [{
      icon: "bag-handle-outline" as const,
      label: "View Product",
      color: "#a78bfa",
      bg: "rgba(167,139,250,0.18)",
      sub: item.product.name,
      onPress: () => {
        onClose();
        onShowAlert({
          icon: "bag-handle",
          iconColor: "#a78bfa",
          iconBg: "rgba(167,139,250,0.15)",
          title: "Open Product 🛍️",
          message: `"${item.product!.name}"\nRs. ${item.product!.price.toLocaleString()}`,
          buttons: [
            { text: "Cancel", style: "cancel" },
            { text: "View Now", style: "default", onPress: () => router.push(`/product/${item.product!.id}`) },
          ],
        });
      },
    }] : []),
    {
      icon: "link-outline" as const,
      label: "Copy Link",
      color: "#34d399",
      bg: "rgba(52,211,153,0.15)",
      sub: "zamanmall.netlify.app/zeels",
      onPress: () => {
        onClose();
        onShowAlert({
          icon: "checkmark-circle",
          iconColor: "#34d399",
          iconBg: "rgba(52,211,153,0.15)",
          title: "Link Copied! 🔗",
          message: "The Zeel link has been copied to clipboard.\nhttps://zamanmall.netlify.app/zeels",
          buttons: [{ text: "OK", style: "default" }],
        });
      },
    },
    {
      icon: "flag-outline" as const,
      label: "Report",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.15)",
      sub: "Report inappropriate content",
      onPress: () => {
        onClose();
        onShowAlert({
          icon: "flag",
          iconColor: "#ef4444",
          iconBg: "rgba(239,68,68,0.12)",
          title: "Report Zeel",
          message: `Are you sure you want to report "${item.title}"? We'll review it shortly.`,
          buttons: [
            { text: "Cancel", style: "cancel" },
            {
              text: "Report",
              style: "destructive",
              onPress: () => onShowAlert({
                icon: "checkmark-circle",
                iconColor: "#34d399",
                iconBg: "rgba(52,211,153,0.15)",
                title: "Reported ✅",
                message: "Thank you for your feedback. Our team will review this content.",
                buttons: [{ text: "Done", style: "default" }],
              }),
            },
          ],
        });
      },
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={{ ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)", opacity: bgOpacity }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        transform: [{ translateY: slideY }],
      }}>
        <View style={{
          backgroundColor: "#0f0f0f",
          borderTopLeftRadius: 28, borderTopRightRadius: 28,
          paddingBottom: insets.bottom + 12,
          borderTopWidth: 1,
          borderColor: "rgba(167,139,250,0.25)",
        }}>
          {/* Handle bar */}
          <View style={{ width: 40, height: 4, backgroundColor: "#333", borderRadius: 2, alignSelf: "center", marginTop: 14, marginBottom: 6 }} />

          {/* Header */}
          <View style={{
            paddingHorizontal: 20, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: "#1e1e1e",
            flexDirection: "row", alignItems: "center", gap: 12,
          }}>
            <View style={{
              width: 42, height: 42, borderRadius: 12,
              backgroundColor: "rgba(167,139,250,0.15)",
              borderWidth: 1, borderColor: "rgba(167,139,250,0.3)",
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name="play-circle" size={22} color="#a78bfa" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#a78bfa", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 2 }}>Zeel Options</Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }} numberOfLines={1}>{item.title}</Text>
            </View>
          </View>

          {/* Options */}
          <View style={{ paddingHorizontal: 12, paddingTop: 8 }}>
            {menuOptions.map((opt, i) => (
              <TouchableOpacity
                key={i}
                onPress={opt.onPress}
                activeOpacity={0.75}
                style={{
                  flexDirection: "row", alignItems: "center",
                  paddingHorizontal: 14, paddingVertical: 13,
                  borderRadius: 18, marginBottom: 4,
                  backgroundColor: "#1a1a1a",
                }}
              >
                {/* Full circle icon */}
                <View style={{
                  width: 46, height: 46, borderRadius: 23,
                  backgroundColor: opt.bg,
                  alignItems: "center", justifyContent: "center",
                  marginRight: 14,
                  borderWidth: 1.5,
                  borderColor: `${opt.color}30`,
                }}>
                  <Ionicons name={opt.icon} size={21} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: opt.color, fontSize: 15, fontWeight: "700" }}>{opt.label}</Text>
                  {opt.sub ? <Text style={{ color: "#555", fontSize: 12, marginTop: 2 }}>{opt.sub}</Text> : null}
                </View>
                <Ionicons name="chevron-forward" size={15} color="#2a2a2a" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel button */}
          <View style={{ paddingHorizontal: 12, paddingTop: 4 }}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.75}
              style={{
                paddingVertical: 16, borderRadius: 18,
                backgroundColor: "#1a1a1a",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#666", fontSize: 15, fontWeight: "700" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

// ─── ZeelItem ─────────────────────────────────────────────────────────────────
const ZeelItem = React.memo(({
  item, isActive, onLike, onShare, insets, totalCount, currentIndex,
}: {
  item: Zeel; isActive: boolean;
  onLike: (id: string) => void;
  onShare: (item: Zeel) => void;
  insets: any;
  totalCount: number;
  currentIndex: number;
}) => {
  const likeScale   = useRef(new Animated.Value(1)).current;
  const progressVal = useRef(new Animated.Value(0)).current;

  const [muted,       setMuted]       = useState(false);
  const [paused,      setPaused]      = useState(false);
  const [showLoader,  setShowLoader]  = useState(true);
  const [showProduct, setShowProduct] = useState(false);
  const [showMenu,    setShowMenu]    = useState(false);
  const [showHeart,   setShowHeart]   = useState(false);
  const [showUnlike,  setShowUnlike]  = useState(false);
  const [alertConfig, setAlertConfig] = useState<Omit<CustomAlertProps,"visible"|"onClose"> | null>(null);

  const showCustomAlert = useCallback((cfg: Omit<CustomAlertProps,"visible"|"onClose">) => {
    setAlertConfig(cfg);
  }, []);


  // Reset when scrolled away
  useEffect(() => {
    if (!isActive) {
      setPaused(false);
      setShowLoader(true);
      progressVal.setValue(0);
    }
  }, [isActive]);

  // Progress bar width
  const barWidth = progressVal.interpolate({
    inputRange: [0, 1], outputRange: ["0%", "100%"], extrapolate: "clamp",
  });

  // Playback status callback
  const onStatus = useCallback((s: AVPlaybackStatus) => {
    if (!s.isLoaded) return;
    if (s.isPlaying) setShowLoader(false);
    const dur = s.durationMillis ?? 0;
    const pos = s.positionMillis ?? 0;
    if (dur > 0) progressVal.setValue(pos / dur);
  }, [progressVal]);

  // ── Like animation — quick pop on like button ───────────────────────────
  const animateLike = useCallback(() => {
    likeScale.stopAnimation();
    likeScale.setValue(1);

    Animated.sequence([
      Animated.timing(likeScale, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(likeScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();
  }, [likeScale]);

  // Full-screen tap → instant pause / play (no double-tap logic)
  const handleTap = useCallback(() => {
    setPaused(p => !p);
  }, []);

  // Like button → center heart + button animation + like
  const handleLikeBtn = useCallback(() => {
    animateLike();
    // Show animation only when ADDING a like, not removing
    if (!item.userLiked) {
      setShowHeart(true);
    } else {
      setShowUnlike(true);
    }
    onLike(item.id);
  }, [item.id, onLike, animateLike]);

  // ── Layout: stack from bottom — uses insets.bottom for safe area ────────
  const PROGRESS_BOTTOM = insets.bottom + 8;                          // progress bar — close to bottom edge
  const PRODUCT_BOTTOM  = PROGRESS_BOTTOM + 6;                        // product card
  const TITLE_BOTTOM    = PRODUCT_BOTTOM + (item.product ? 76 : 10);  // title
  const ACTIONS_BOTTOM  = TITLE_BOTTOM + 30;                          // action icons — just above title

  return (
    <View style={{ width: W, height: H, backgroundColor: "#000" }}>

      {/* ── Video ── */}
      <Video
        source={{ uri: item.video_url }}
        style={StyleSheet.absoluteFill}
        resizeMode={ResizeMode.COVER}
        isLooping
        isMuted={muted}
        shouldPlay={isActive && !paused}
        onPlaybackStatusUpdate={onStatus}
        useNativeControls={false}
        progressUpdateIntervalMillis={200}
      />

      {/* Thumbnail while loading — with Lottie placeholder */}
      {showLoader && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0a0a0a" }]} pointerEvents="none">
          {/* Lottie centered */}
          <View style={[StyleSheet.absoluteFill, s.center]}>
            <LottieView
              source={require("../../assets/58741126-92b7-45ad-97db-0ef14c9baa72.json")}
              autoPlay
              loop
              style={{ width: 80, height: 80 }}
            />
          </View>
          {/* Thumbnail on top — fades in when loaded */}
          {item.thumbnail_url && (
            <Image
              source={{ uri: item.thumbnail_url }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          )}
        </View>
      )}

      {/* Initial video loader — Lottie */}
      {showLoader && isActive && (
        <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
          <LottieView
            source={require("../../assets/58741126-92b7-45ad-97db-0ef14c9baa72.json")}
            autoPlay
            loop
            style={{ width: 70, height: 70 }}
          />
        </View>
      )}

      {/* Paused overlay */}
      {paused && (
        <View style={[StyleSheet.absoluteFill, s.center]} pointerEvents="none">
          <LottieView
            source={require("../../assets/53f875b6-1168-11ee-996b-97ff5e8e6708.json")}
            autoPlay
            loop
            style={{ width: 120, height: 120 }}
          />
        </View>
      )}

      {/* Full-screen tap area */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={handleTap}
        onLongPress={() => setShowMenu(true)}
        delayLongPress={400}
        style={StyleSheet.absoluteFill}
      />

      {/* Center heart — shown on like button press */}
      {showHeart && (
        <CenterHeart onDone={() => setShowHeart(false)} />
      )}

      {/* Unlike animation — shown on unlike button press */}
      {showUnlike && (
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: 0, right: 0, top: 0, bottom: 0,
            alignItems: "center", justifyContent: "center",
            zIndex: 99,
          }}
        >
          <LottieView
            source={require("../../assets/7872bfce-1171-11ee-af56-a74ec27d1365.json")}
            autoPlay
            loop={false}
            onAnimationFinish={() => setShowUnlike(false)}
            style={{ width: 220, height: 220 }}
          />
        </Animated.View>
      )}

      {/* Gradients */}
      <LinearGradient
        colors={["rgba(0,0,0,0.55)", "transparent"]}
        style={{ position: "absolute", top: 0, left: 0, right: 0, height: 140 }}
        pointerEvents="none"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.97)"]}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 500 }}
        pointerEvents="none"
      />

      {/* ── Top bar ── */}
      <View style={{
        position: "absolute", top: insets.top + 8, left: 16, right: 16,
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      }} pointerEvents="box-none">
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={s.topBtn}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Zeels badge with count */}
        <View style={s.zeelsBadge} pointerEvents="none">
          <Ionicons name="play-circle" size={15} color="#a78bfa" />
          <Text style={s.zeelsBadgeText}>Zeels</Text>
          <View style={s.zeelsCountDivider} />
          <Text style={s.zeelsCountText}>{currentIndex + 1} / {totalCount}</Text>
        </View>

        <TouchableOpacity onPress={() => setMuted(m => !m)} activeOpacity={0.8} style={s.topBtn}>
          <Ionicons name={muted ? "volume-mute" : "volume-high"} size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 1 ── Progress bar ── */}
      <View style={{
        position: "absolute", left: 0, right: 0,
        bottom: PROGRESS_BOTTOM, height: 3,
        backgroundColor: "rgba(255,255,255,0.18)",
      }}>
        <Animated.View style={{
          height: 3, width: barWidth,
          backgroundColor: "#a78bfa", borderRadius: 2,
        }} />
      </View>

      {/* 2 ── Product card ── */}
      {item.product && (
        <View style={{
          position: "absolute", left: 0, right: 0,
          bottom: PRODUCT_BOTTOM, paddingHorizontal: 12,
        }}>
          <TouchableOpacity activeOpacity={0.88} onPress={() => setShowProduct(true)}>
            <BlurView intensity={55} tint="dark" style={s.productCard}>
              <Image
                source={{ uri: item.product.image || item.product.images?.[0] }}
                style={s.productThumb} contentFit="cover"
              />
              <View style={{ flex: 1, minWidth: 0, marginLeft: 10 }}>
                <View style={{ flexDirection: "row", gap: 5, marginBottom: 3 }}>
                  {item.product.country === "china" && (
                    <View style={s.chinaBadge}><Text style={s.chinaBadgeText}>🇨🇳 CHINA</Text></View>
                  )}
                  {item.product.country === "pakistan" && (
                    <View style={s.pakBadge}><Text style={s.pakBadgeText}>🇵🇰 PAK</Text></View>
                  )}
                </View>
                <Text style={s.productName} numberOfLines={1}>{item.product.name}</Text>
                <Text style={s.productPrice}>Rs. {item.product.price.toLocaleString()}</Text>
              </View>
              <View style={s.shopBtn}>
                <Ionicons name="bag-handle-outline" size={14} color="#a78bfa" />
                <Text style={s.shopBtnText}>Shop</Text>
              </View>
            </BlurView>
          </TouchableOpacity>
        </View>
      )}

      {/* 3 ── Title + description ── */}
      <View style={{
        position: "absolute", left: 14, right: 76,
        bottom: TITLE_BOTTOM,
      }}>
        <Text style={s.title} numberOfLines={2}>{item.title}</Text>
        {!!item.description && (
          <Text style={s.desc} numberOfLines={2}>{item.description}</Text>
        )}
      </View>

      {/* 4 ── Right action bar — ABOVE title ── */}
      <View style={{
        position: "absolute", right: 14,
        bottom: ACTIONS_BOTTOM,
        alignItems: "center", gap: 28,
      }}>
        {/* Like */}
        <View style={s.actionItem}>
          <Animated.View style={{
            transform: [{ scale: likeScale }],
          }}>
            <TouchableOpacity onPress={handleLikeBtn} activeOpacity={0.7}>
              <Ionicons
                name={item.userLiked ? "heart" : "heart-outline"}
                size={38} color={item.userLiked ? "#ff4d6d" : "#fff"}
                style={s.iconShadow}
              />
            </TouchableOpacity>
          </Animated.View>
          <Text style={s.actionLabel}>{formatCount(item.likes_count)}</Text>
        </View>

        {/* Share */}
        <View style={s.actionItem}>
          <TouchableOpacity onPress={() => onShare(item)} activeOpacity={0.7}>
            <Ionicons name="paper-plane-outline" size={35} color="#fff" style={s.iconShadow} />
          </TouchableOpacity>
          <Text style={s.actionLabel}>Share</Text>
        </View>

        {/* Views */}
        <View style={s.actionItem}>
          <Ionicons name="eye-outline" size={33} color="rgba(255,255,255,0.9)" style={s.iconShadow} />
          <Text style={s.actionLabel}>{formatCount(item.views_count)}</Text>
        </View>
      </View>

      {/* ── Product bottom sheet ── */}
      {item.product && (
        <Modal visible={showProduct} animationType="slide" transparent
          onRequestClose={() => setShowProduct(false)}>
          <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" }}>
            <View style={{
              backgroundColor: "#111",
              borderTopLeftRadius: 28, borderTopRightRadius: 28,
              paddingBottom: insets.bottom + 16, maxHeight: H * 0.75,
            }}>
              <View style={{ width: 36, height: 4, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 16 }} />
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
                <View style={{ borderRadius: 20, overflow: "hidden", marginBottom: 16, height: 200 }}>
                  <Image source={{ uri: item.product.image || item.product.images?.[0] }} style={{ width: "100%", height: "100%" }} contentFit="cover" />
                  <LinearGradient colors={["transparent", "rgba(0,0,0,0.5)"]} style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80 }} />
                </View>
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                  {item.product.country === "china"    && <View style={[s.chinaBadge, { paddingHorizontal: 10, paddingVertical: 4 }]}><Text style={[s.chinaBadgeText, { fontSize: 10 }]}>🇨🇳 CHINA</Text></View>}
                  {item.product.country === "pakistan" && <View style={[s.pakBadge,   { paddingHorizontal: 10, paddingVertical: 4 }]}><Text style={[s.pakBadgeText,   { fontSize: 10 }]}>🇵🇰 PAKISTAN</Text></View>}
                  {item.product.category && <View style={{ backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}><Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10, fontWeight: "600" }}>{item.product.category}</Text></View>}
                  {(item.product.stock ?? 0) > 0 && <View style={{ backgroundColor: "rgba(74,222,128,0.12)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: "rgba(74,222,128,0.3)" }}><Text style={{ color: "#4ade80", fontSize: 10, fontWeight: "700" }}>In Stock</Text></View>}
                </View>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "900", marginBottom: 4, letterSpacing: -0.5 }}>{item.product.name}</Text>
                <Text style={{ color: "#a78bfa", fontSize: 22, fontWeight: "900", marginBottom: 12 }}>Rs. {item.product.price.toLocaleString()}</Text>
                {item.product.description && <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 20, marginBottom: 20 }}>{item.product.description}</Text>}
                <TouchableOpacity
                  onPress={() => { setShowProduct(false); router.push(`/product/${item.product!.id}`); }}
                  style={{ backgroundColor: "#a78bfa", borderRadius: 16, paddingVertical: 14, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                  activeOpacity={0.85}
                >
                  <Ionicons name="bag-handle" size={18} color="#fff" />
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>View Full Product</Text>
                </TouchableOpacity>
              </ScrollView>
              <TouchableOpacity onPress={() => setShowProduct(false)}
                style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
      {/* ── Long press menu ── */}
      <LongPressMenu
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        item={item}
        onLike={onLike}
        onShare={onShare}
        insets={insets}
        onShowAlert={showCustomAlert}
      />

      {/* ── Custom Alert — outside all Modals so it renders on top ── */}
      {alertConfig && (
        <CustomAlert
          {...alertConfig}
          visible={true}
          onClose={() => setAlertConfig(null)}
        />
      )}
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ZeelsScreen() {
  const { user }  = useAuth();
  const insets    = useSafeAreaInsets();

  const [zeels,       setZeels]       = useState<Zeel[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef       = useRef<any>(null);
  const hasLoadedRef  = useRef(false);
  const savedIndexRef = useRef(0);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

  const loadZeels = useCallback(async () => {
    setLoading(true);
    try {
      const { data: zeelData, error } = await supabase
        .from("zeels").select("*").eq("is_active", true);
      if (error || !zeelData) return;

      const productIds = zeelData.filter((z: any) => z.product_id).map((z: any) => z.product_id as string);
      let productsMap: Record<string, Product> = {};
      if (productIds.length > 0) {
        const { data: prodData } = await supabase
          .from("products")
          .select("id, name, description, price, image, images, country, category, stock")
          .in("id", productIds);
        if (prodData) productsMap = Object.fromEntries(prodData.map((p: any) => [p.id, p]));
      }

      let likedSet = new Set<string>();
      if (user?.id) {
        const { data: likeData } = await supabase
          .from("zeel_likes").select("zeel_id").eq("user_id", user.id);
        if (likeData) likeData.forEach((l: any) => likedSet.add(l.zeel_id));
      }

      setZeels(shuffleArray(zeelData.map((z: any) => ({
        ...z,
        product: z.product_id ? (productsMap[z.product_id] ?? null) : null,
        userLiked: likedSet.has(z.id),
      }))));
      hasLoadedRef.current = true;
    } finally { setLoading(false); }
  }, [user?.id]);

  useFocusEffect(useCallback(() => {
    if (!hasLoadedRef.current) {
      loadZeels();
    } else {
      setActiveIndex(savedIndexRef.current);
    }
    return () => { setActiveIndex(-1); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadZeels]));

  const handleLike = useCallback(async (zeelId: string) => {
    if (!user?.id) { router.push("/(auth)/login"); return; }
    const zeel = zeels.find(z => z.id === zeelId);
    if (!zeel) return;
    const nowLiked = !zeel.userLiked;
    setZeels(prev => prev.map(z => z.id !== zeelId ? z : {
      ...z, userLiked: nowLiked,
      likes_count: nowLiked ? z.likes_count + 1 : Math.max(0, z.likes_count - 1),
    }));
    try {
      if (nowLiked) {
        await supabase.from("zeel_likes").insert({ zeel_id: zeelId, user_id: user.id });
        await supabase.from("zeels").update({ likes_count: (zeel.likes_count ?? 0) + 1 }).eq("id", zeelId);
      } else {
        await supabase.from("zeel_likes").delete().eq("zeel_id", zeelId).eq("user_id", user.id);
        await supabase.from("zeels").update({ likes_count: Math.max(0, (zeel.likes_count ?? 1) - 1) }).eq("id", zeelId);
      }
    } catch {
      setZeels(prev => prev.map(z => z.id !== zeelId ? z : { ...z, userLiked: !nowLiked, likes_count: zeel.likes_count }));
    }
  }, [user?.id, zeels]);

  const handleShare = useCallback(async (shareItem: Zeel) => {
    try {
      // Deep link: opens app if installed, falls back to website zeels section
      const appDeepLink     = `zaman-mall://zeels`;
      const websiteFallback = `https://zamanmall.netlify.app/zeels`;

      const productLine = shareItem.product
        ? `\n\n🛍️ Product: ${shareItem.product.name} — Rs. ${shareItem.product.price.toLocaleString()}`
        : "";

      await Share.share({
        title:   `${shareItem.title} — Zaman Mall Zeels`,
        message: `🎬 ${shareItem.title}${productLine}\n\n📲 Watch on Zaman Mall app:\n${appDeepLink}\n\n🌐 Or open in browser:\n${websiteFallback}`,
        url:     websiteFallback, // iOS uses this; Android uses message
      });
    } catch { /* ignore */ }
  }, []);

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (!viewableItems.length) return;
    const idx: number = viewableItems[0].index ?? 0;
    setActiveIndex(idx);
    savedIndexRef.current = idx;
    const zeelId: string | undefined = viewableItems[0].item?.id;
    const currentViews: number = viewableItems[0].item?.views_count ?? 0;
    if (zeelId) {
      supabase.from("zeels").update({ views_count: currentViews + 1 }).eq("id", zeelId)
        .then(() => { /* ok */ }).catch(() => { /* ignore */ });
    }
  }).current;

  if (loading) return (
    <View style={[s.center, { flex: 1, backgroundColor: "#000" }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <LottieView
        source={require("../../assets/58741126-92b7-45ad-97db-0ef14c9baa72.json")}
        autoPlay
        loop
        style={{ width: 120, height: 120 }}
      />
      <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 8, fontSize: 13, letterSpacing: 1 }}>
        Loading Zeels...
      </Text>
    </View>
  );

  if (zeels.length === 0) return (
    <View style={[s.center, { flex: 1, backgroundColor: "#000" }]}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <TouchableOpacity onPress={() => router.back()}
        style={[s.topBtn, { position: "absolute", top: insets.top + 8, left: 16 }]}>
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Ionicons name="play-circle-outline" size={64} color="rgba(167,139,250,0.35)" />
      <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 16, fontSize: 16, fontWeight: "700" }}>No Zeels yet</Text>
      <Text style={{ color: "rgba(255,255,255,0.35)", marginTop: 6, fontSize: 13 }}>Check back soon!</Text>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <FlashList
        ref={listRef}
        data={zeels}
        keyExtractor={(item: Zeel) => item.id}
        renderItem={({ item, index }: { item: Zeel; index: number }) => (
          <ZeelItem
            item={item}
            isActive={index === activeIndex}
            onLike={handleLike}
            onShare={handleShare}
            insets={insets}
            totalCount={zeels.length}
            currentIndex={index}
          />
        )}
        estimatedItemSize={H}
        pagingEnabled
        snapToInterval={H}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews
        overrideItemLayout={(layout: any) => { layout.size = H; }}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  center:      { alignItems: "center", justifyContent: "center" },
  topBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  zeelsBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.35)",
  },
  zeelsBadgeText: { color: "#a78bfa", fontSize: 13, fontWeight: "800", letterSpacing: 1 },
  zeelsCountDivider: {
    width: 1, height: 14,
    backgroundColor: "rgba(167,139,250,0.4)",
    marginHorizontal: 2,
  },
  zeelsCountText: {
    color: "rgba(255,255,255,0.85)", fontSize: 13, fontWeight: "700",
  },
  pauseCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.3)",
  },
  actionItem: { alignItems: "center", gap: 4 },
  iconShadow: {
    textShadowColor: "rgba(0,0,0,0.95)",
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  actionLabel: {
    color: "#fff", fontSize: 12, fontWeight: "700",
    textShadowColor: "rgba(0,0,0,0.9)",
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4,
  },
  title: {
    color: "#fff", fontSize: 15, fontWeight: "900",
    letterSpacing: -0.3, marginBottom: 4,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 8,
  },
  desc: { color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 17 },
  productCard: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, overflow: "hidden",
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.15)",
  },
  productThumb: { width: 48, height: 48, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.08)" },
  productName:  { color: "#fff", fontSize: 13, fontWeight: "700" },
  productPrice: { color: "#a78bfa", fontSize: 13, fontWeight: "900", marginTop: 2 },
  shopBtn: {
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(167,139,250,0.18)",
    paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(167,139,250,0.4)", marginLeft: 8,
  },
  shopBtnText: { color: "#a78bfa", fontSize: 9, fontWeight: "800", marginTop: 2 },
  chinaBadge: {
    backgroundColor: "rgba(239,68,68,0.22)", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: "rgba(239,68,68,0.4)",
  },
  chinaBadgeText: { color: "#ff6b6b", fontSize: 9, fontWeight: "900" },
  pakBadge: {
    backgroundColor: "rgba(16,185,129,0.2)", borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: "rgba(16,185,129,0.35)",
  },
  pakBadgeText: { color: "#34d399", fontSize: 9, fontWeight: "900" },
});
