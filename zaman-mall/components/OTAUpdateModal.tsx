import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Easing,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

const { width } = Dimensions.get("window");

interface OTAUpdateModalProps {
  visible: boolean;
  onRestart: () => void;
  onDismiss: () => void;
}

const OTAUpdateModal: React.FC<OTAUpdateModalProps> = ({
  visible,
  onRestart,
  onDismiss,
}) => {
  const { isDark } = useTheme();

  // ── Animations ────────────────────────────────────────────────────────────
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const slideAnim  = useRef(new Animated.Value(60)).current;
  const scaleAnim  = useRef(new Animated.Value(0.9)).current;
  const spinAnim   = useRef(new Animated.Value(0)).current;
  const pulse1     = useRef(new Animated.Value(1)).current;
  const pulse1Op   = useRef(new Animated.Value(0.6)).current;
  const pulse2     = useRef(new Animated.Value(1)).current;
  const pulse2Op   = useRef(new Animated.Value(0.6)).current;
  const shimmer    = useRef(new Animated.Value(0)).current;
  const floatAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset
      [fadeAnim, scaleAnim, spinAnim, pulse1, pulse1Op, pulse2, pulse2Op, shimmer].forEach(a => a.setValue(
        a === fadeAnim || a === scaleAnim ? 0 : a === scaleAnim ? 0.9 : 0
      ));
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
      slideAnim.setValue(60);

      // Entrance
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 7, tension: 45, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      ]).start();

      // Radar pulse — 3 rings
      const radarLoop = Animated.loop(
        Animated.stagger(900, [
          Animated.parallel([
            Animated.timing(pulse1, { toValue: 2.4, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulse1Op, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
          Animated.parallel([
            Animated.timing(pulse2, { toValue: 2.4, duration: 2000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
            Animated.timing(pulse2Op, { toValue: 0, duration: 2000, useNativeDriver: true }),
          ]),
        ])
      );
      radarLoop.start();

      // Icon spin
      const spinLoop = Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })
      );
      spinLoop.start();

      // Shimmer badge
      const shimmerLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmer, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(shimmer, { toValue: 0, duration: 1600, useNativeDriver: true }),
        ])
      );
      shimmerLoop.start();

      // Float icon
      const floatLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, { toValue: -6, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(floatAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      floatLoop.start();

      return () => {
        radarLoop.stop();
        spinLoop.stop();
        shimmerLoop.stop();
        floatLoop.stop();
      };
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.92, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 40, duration: 220, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] });

  // Reset pulse refs when animating
  const resetPulse = () => {
    pulse1.setValue(1);
    pulse1Op.setValue(0.6);
    pulse2.setValue(1);
    pulse2Op.setValue(0.6);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <View style={styles.overlay}>
        {/* Frosted backdrop */}
        <BlurView
          intensity={isDark ? 50 : 70}
          tint={isDark ? "dark" : "light"}
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.35)' }]} />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { translateY: slideAnim }],
              backgroundColor: isDark ? "#0d0d0d" : "#ffffff",
              borderColor: isDark ? "rgba(29,185,84,0.2)" : "rgba(79,70,229,0.15)",
              shadowColor: isDark ? "#1DB954" : "#4F46E5",
            },
          ]}
        >
          {/* ══ HEADER GRADIENT ══════════════════════════════════════════ */}
          <LinearGradient
            colors={isDark
              ? ["#051505", "#091520", "#0d0820"]
              : ["#3730a3", "#4F46E5", "#0ea5e9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            {/* Decor blobs */}
            <View style={[styles.blob1, { backgroundColor: isDark ? "rgba(29,185,84,0.07)" : "rgba(255,255,255,0.07)" }]} />
            <View style={[styles.blob2, { backgroundColor: isDark ? "rgba(14,165,233,0.05)" : "rgba(255,255,255,0.05)" }]} />

            {/* Radar rings */}
            <Animated.View style={[styles.ring, {
              transform: [{ scale: pulse1 }], opacity: pulse1Op,
              borderColor: isDark ? "rgba(29,185,84,0.5)" : "rgba(255,255,255,0.5)",
            }]} />
            <Animated.View style={[styles.ring, {
              transform: [{ scale: pulse2 }], opacity: pulse2Op,
              borderColor: isDark ? "rgba(29,185,84,0.3)" : "rgba(255,255,255,0.3)",
            }]} />

            {/* Logo + icon floating */}
            <Animated.View style={[styles.iconWrap, {
              transform: [{ translateY: floatAnim }],
              backgroundColor: isDark ? "rgba(29,185,84,0.12)" : "rgba(255,255,255,0.15)",
              borderColor: isDark ? "rgba(29,185,84,0.35)" : "rgba(255,255,255,0.35)",
            }]}>
              <Image
                source={require("@/assets/images/zaman-logo.png")}
                style={{ width: 52, height: 52, borderRadius: 26 }}
                resizeMode="contain"
              />
              {/* Spinning orbit ring */}
              <Animated.View style={[styles.orbitRing, {
                transform: [{ rotate: spin }],
                borderColor: isDark ? "rgba(29,185,84,0.6)" : "rgba(255,255,255,0.6)",
              }]}>
                <View style={[styles.orbitDot, { backgroundColor: isDark ? "#1DB954" : "#fff" }]} />
              </Animated.View>
            </Animated.View>

            {/* Title */}
            <Text style={styles.headerTitle}>Naya Update Ready!</Text>
            <Text style={[styles.headerSub, { color: isDark ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.85)" }]}>
              Zaman Mall ka latest version tayyar hai
            </Text>

            {/* Live badge */}
            <Animated.View style={[styles.liveBadge, {
              opacity: shimmerOpacity,
              backgroundColor: isDark ? "rgba(29,185,84,0.15)" : "rgba(255,255,255,0.18)",
              borderColor: isDark ? "rgba(29,185,84,0.4)" : "rgba(255,255,255,0.4)",
            }]}>
              <View style={[styles.liveDot, { backgroundColor: isDark ? "#1DB954" : "#fff" }]} />
              <Text style={[styles.liveBadgeText, { color: isDark ? "#1DB954" : "#fff" }]}>
                ⚡ OTA LIVE UPDATE
              </Text>
            </Animated.View>
          </LinearGradient>

          {/* ══ BODY ═════════════════════════════════════════════════════ */}
          <View style={[styles.body, { backgroundColor: isDark ? "#0d0d0d" : "#ffffff" }]}>

            {/* What's new */}
            <Text style={[styles.bodyTitle, { color: isDark ? "#fff" : "#0f172a" }]}>
              Kya Naya Hai? ✨
            </Text>

            {/* Feature cards */}
            <View style={styles.featureRow}>
              {[
                { icon: "⚡", label: "Faster App", color: "#F59E0B" },
                { icon: "🐛", label: "Bug Fixes", color: "#EF4444" },
                { icon: "🎨", label: "UI Updates", color: "#8B5CF6" },
                { icon: "🔒", label: "Security", color: "#10B981" },
              ].map((f, i) => (
                <View key={i} style={[styles.featureCard, {
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                  borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                }]}>
                  <Text style={{ fontSize: 20, marginBottom: 4 }}>{f.icon}</Text>
                  <Text style={{ color: f.color, fontSize: 10, fontWeight: "800", textAlign: "center" }}>{f.label}</Text>
                </View>
              ))}
            </View>

            {/* Info strip */}
            <View style={[styles.infoStrip, {
              backgroundColor: isDark ? "rgba(29,185,84,0.06)" : "rgba(29,185,84,0.04)",
              borderColor: isDark ? "rgba(29,185,84,0.15)" : "rgba(29,185,84,0.12)",
            }]}>
              <Ionicons name="information-circle" size={15} color="#1DB954" />
              <Text style={[styles.infoText, { color: isDark ? "rgba(255,255,255,0.55)" : "#475569" }]}>
                Ye update background mein download ho chuka hai. App restart karein — nayi cheezein foran milein gee.
              </Text>
            </View>
          </View>

          {/* ══ FOOTER BUTTONS ═══════════════════════════════════════════ */}
          <View style={[styles.footer, { backgroundColor: isDark ? "#0d0d0d" : "#ffffff" }]}>

            {/* Primary — Restart */}
            <TouchableOpacity
              activeOpacity={0.87}
              onPress={onRestart}
              style={styles.primaryBtn}
            >
              <LinearGradient
                colors={["#1DB954", "#0d9640"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryGradient}
              >
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons name="refresh" size={19} color="#fff" />
                </Animated.View>
                <Text style={styles.primaryText}>Restart Karein & Apply Karein</Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary — Later */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onDismiss}
              style={[styles.secondaryBtn, {
                backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#f1f5f9",
                borderColor: isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0",
              }]}
            >
              <Text style={[styles.secondaryText, { color: isDark ? "rgba(255,255,255,0.4)" : "#94a3b8" }]}>
                Baad Mein
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const CARD_W = Math.min(width * 0.88, 380);
const RING_SIZE = 88;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    borderRadius: 32,
    width: CARD_W,
    overflow: "hidden",
    elevation: 28,
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.3,
    shadowRadius: 36,
    borderWidth: 1,
  },
  // Header
  header: {
    paddingTop: 40, paddingBottom: 28, paddingHorizontal: 24,
    alignItems: "center", overflow: "hidden", position: "relative",
  },
  blob1: {
    position: "absolute", width: 180, height: 180,
    borderRadius: 90, top: -60, right: -50,
  },
  blob2: {
    position: "absolute", width: 120, height: 120,
    borderRadius: 60, bottom: -30, left: -30,
  },
  ring: {
    position: "absolute",
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    borderWidth: 1.5,
    top: 40, alignSelf: "center",
  },
  iconWrap: {
    width: RING_SIZE, height: RING_SIZE,
    borderRadius: RING_SIZE / 2,
    justifyContent: "center", alignItems: "center",
    marginBottom: 18, borderWidth: 1.5, zIndex: 2,
    position: "relative",
  },
  orbitRing: {
    position: "absolute", width: RING_SIZE + 18, height: RING_SIZE + 18,
    borderRadius: (RING_SIZE + 18) / 2,
    borderWidth: 1.5, borderStyle: "dashed",
  },
  orbitDot: {
    position: "absolute", top: -4, left: "50%",
    width: 7, height: 7, borderRadius: 4,
    marginLeft: -3.5,
  },
  headerTitle: {
    fontSize: 24, fontWeight: "900", color: "#fff",
    letterSpacing: -0.4, marginBottom: 6, textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.15)",
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 6,
  },
  headerSub: {
    fontSize: 13, fontWeight: "500",
    textAlign: "center", marginBottom: 16, paddingHorizontal: 8,
  },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  liveDot: {
    width: 6, height: 6, borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 11, fontWeight: "800", letterSpacing: 0.8,
  },
  // Body
  body: {
    paddingHorizontal: 22, paddingTop: 22, paddingBottom: 12,
  },
  bodyTitle: {
    fontSize: 17, fontWeight: "900",
    textAlign: "center", marginBottom: 16, letterSpacing: -0.3,
  },
  featureRow: {
    flexDirection: "row", justifyContent: "space-between",
    gap: 8, marginBottom: 16,
  },
  featureCard: {
    flex: 1, borderRadius: 14, paddingVertical: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  infoStrip: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    borderRadius: 14, padding: 12, borderWidth: 1,
  },
  infoText: {
    fontSize: 12, lineHeight: 18, flex: 1,
  },
  // Footer
  footer: {
    paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24, gap: 10,
  },
  primaryBtn: {
    borderRadius: 16, overflow: "hidden",
    elevation: 6,
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  primaryGradient: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", paddingVertical: 16, gap: 9,
  },
  primaryText: {
    color: "#fff", fontSize: 15, fontWeight: "800", letterSpacing: -0.2,
  },
  secondaryBtn: {
    alignItems: "center", paddingVertical: 14,
    borderRadius: 16, borderWidth: 1,
  },
  secondaryText: {
    fontSize: 14, fontWeight: "700",
  },
});

export default OTAUpdateModal;
