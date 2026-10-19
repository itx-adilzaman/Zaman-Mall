import { Order } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useReviews } from "@/hooks/useReviews";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const { height: SCREEN_H } = Dimensions.get("window");

// Star rating labels
const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
const STAR_COLORS = ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

interface RatingModalProps {
  visible: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess: () => void;
}

export default function RatingModal({ visible, onClose, order, onSuccess }: RatingModalProps) {
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { addReview, isAddingReview } = useReviews(selectedProductId || "");

  // Animations
  const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const starAnims = useRef([1,2,3,4,5].map(() => new Animated.Value(1))).current;
  const successScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSubmitted(false);
      setComment("");
      setRating(0);
      if (order?.items?.length) setSelectedProductId(order.items[0].id);

      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, friction: 9, tension: 50, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: SCREEN_H, duration: 260, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const animateStar = (index: number) => {
    Animated.sequence([
      Animated.spring(starAnims[index], { toValue: 1.4, friction: 3, tension: 200, useNativeDriver: true }),
      Animated.spring(starAnims[index], { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleStarPress = (star: number) => {
    setRating(star);
    animateStar(star - 1);
    // Also animate all previous stars
    for (let i = 0; i < star - 1; i++) {
      setTimeout(() => animateStar(i), i * 60);
    }
  };

  const handleSubmit = () => {
    if (!selectedProductId || !order) return;
    if (rating === 0) {
      showAlert({ title: "Rating Zaroor Hai", message: "Pehle stars select karein.", icon: "star-outline", buttons: [{ text: "OK", onPress: () => {} }] });
      return;
    }
    if (!comment.trim()) {
      showAlert({ title: "Review Likhein", message: "Apna experience share karein.", icon: "chatbubble-outline", buttons: [{ text: "OK", onPress: () => {} }] });
      return;
    }

    addReview(
      { rating, comment, orderId: order.id },
      {
        onSuccess: () => {
          setSubmitted(true);
          Animated.spring(successScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
          setTimeout(() => {
            onSuccess();
            onClose();
            setSubmitted(false);
            successScale.setValue(0);
          }, 2200);
        },
        onError: (error: any) => {
          showAlert({ title: "Error", message: error.message || "Review submit nahi ho saki.", icon: "alert-circle-outline", buttons: [{ text: "OK", onPress: () => {} }] });
        },
      }
    );
  };

  const selectedProduct = order?.items.find(i => i.id === selectedProductId);
  const activeStar = hoveredStar || rating;
  const canSubmit = rating > 0 && comment.trim().length > 0 && !isAddingReview;

  if (!order) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>

        {/* Backdrop */}
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <BlurView intensity={isDark ? 40 : 55} tint={isDark ? "dark" : "light"} style={{ flex: 1 }}>
            <View style={{ flex: 1, backgroundColor: isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.4)" }}>

              {/* Tap backdrop to close */}
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />

              {/* Sheet */}
              <Animated.View style={{
                transform: [{ translateY: slideAnim }],
                backgroundColor: isDark ? "#0f0f0f" : "#ffffff",
                borderTopLeftRadius: 32, borderTopRightRadius: 32,
                maxHeight: SCREEN_H * 0.9,
                borderWidth: 1,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: -8 },
                elevation: 20,
              }}>

                {/* ── Success Overlay ── */}
                {submitted && (
                  <View style={{
                    position: "absolute", inset: 0, zIndex: 99,
                    backgroundColor: isDark ? "#0f0f0f" : "#fff",
                    borderTopLeftRadius: 32, borderTopRightRadius: 32,
                    alignItems: "center", justifyContent: "center", gap: 16,
                  }}>
                    <Animated.View style={{
                      transform: [{ scale: successScale }],
                      alignItems: "center", gap: 12,
                    }}>
                      <View style={{
                        width: 88, height: 88, borderRadius: 44,
                        backgroundColor: "rgba(34,197,94,0.12)",
                        alignItems: "center", justifyContent: "center",
                        borderWidth: 2, borderColor: "rgba(34,197,94,0.3)",
                      }}>
                        <Ionicons name="checkmark-circle" size={52} color="#22c55e" />
                      </View>
                      <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900", textAlign: "center" }}>
                        Shukriya! 🎉
                      </Text>
                      <Text style={{ color: colors.textSecondary, fontSize: 14, textAlign: "center", opacity: 0.7 }}>
                        Aapka review submit ho gaya
                      </Text>
                    </Animated.View>
                  </View>
                )}

                {/* Drag handle */}
                <View style={{ alignItems: "center", paddingTop: 14, paddingBottom: 6 }}>
                  <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)" }} />
                </View>

                {/* Header */}
                <View style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  paddingHorizontal: 22, paddingBottom: 16, paddingTop: 4,
                  borderBottomWidth: 1, borderBottomColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                }}>
                  <View style={{ gap: 2 }}>
                    <Text style={{ color: colors.text, fontSize: 19, fontWeight: "900", letterSpacing: -0.4 }}>
                      Write a Review
                    </Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, opacity: 0.6 }}>
                      Share your honest experience
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={onClose}
                    activeOpacity={0.7}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
                      alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ padding: 22, paddingBottom: 36 }}
                >

                  {/* ── Step 1: Product Select ── */}
                  {order.items.length > 1 && (
                    <View style={{ marginBottom: 24 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                          <Text style={{ color: "#000", fontSize: 11, fontWeight: "900" }}>1</Text>
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 }}>
                          Product Select Karein
                        </Text>
                      </View>

                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                        {order.items.map((item) => {
                          const isSelected = selectedProductId === item.id;
                          return (
                            <TouchableOpacity
                              key={item.id}
                              onPress={() => setSelectedProductId(item.id)}
                              activeOpacity={0.85}
                              style={{
                                width: 100, borderRadius: 16, padding: 8, alignItems: "center",
                                borderWidth: 2,
                                borderColor: isSelected ? colors.primary : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)"),
                                backgroundColor: isSelected ? colors.primary + "12" : (isDark ? "rgba(255,255,255,0.03)" : "#f8fafc"),
                              }}
                            >
                              <Image source={item.image} style={{ width: 72, height: 72, borderRadius: 10 }} contentFit="cover" />
                              <Text style={{ color: colors.text, fontSize: 10, fontWeight: "700", marginTop: 6, textAlign: "center" }} numberOfLines={2}>
                                {item.name}
                              </Text>
                              {isSelected && (
                                <View style={{ position: "absolute", top: -6, right: -6, width: 18, height: 18, borderRadius: 9, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: isDark ? "#0f0f0f" : "#fff" }}>
                                  <Ionicons name="checkmark" size={10} color="#000" />
                                </View>
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Selected product preview (when single item) */}
                  {order.items.length === 1 && selectedProduct && (
                    <View style={{
                      flexDirection: "row", alignItems: "center", gap: 12,
                      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                      borderRadius: 16, padding: 12, marginBottom: 24,
                      borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
                    }}>
                      <Image source={selectedProduct.image} style={{ width: 56, height: 56, borderRadius: 12 }} contentFit="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 14, fontWeight: "800" }} numberOfLines={2}>{selectedProduct.name}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                          <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                          <Text style={{ color: "#22c55e", fontSize: 11, fontWeight: "700" }}>Verified Purchase</Text>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* ── Step 2: Star Rating ── */}
                  <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#000", fontSize: 11, fontWeight: "900" }}>{order.items.length > 1 ? "2" : "1"}</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 }}>
                        Rating Dein
                      </Text>
                    </View>

                    {/* Stars */}
                    <View style={{ alignItems: "center", gap: 12 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <TouchableOpacity
                            key={star}
                            onPress={() => handleStarPress(star)}
                            activeOpacity={0.7}
                          >
                            <Animated.View style={{ transform: [{ scale: starAnims[star - 1] }] }}>
                              <Ionicons
                                name={star <= activeStar ? "star" : "star-outline"}
                                size={40}
                                color={star <= activeStar ? STAR_COLORS[activeStar] || "#FFC107" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
                              />
                            </Animated.View>
                          </TouchableOpacity>
                        ))}
                      </View>

                      {/* Label */}
                      {activeStar > 0 && (
                        <View style={{
                          backgroundColor: (STAR_COLORS[activeStar] || "#FFC107") + "18",
                          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
                          borderWidth: 1, borderColor: (STAR_COLORS[activeStar] || "#FFC107") + "30",
                        }}>
                          <Text style={{ color: STAR_COLORS[activeStar] || "#FFC107", fontSize: 13, fontWeight: "800" }}>
                            {STAR_LABELS[activeStar]}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* ── Step 3: Comment ── */}
                  <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" }}>
                        <Text style={{ color: "#000", fontSize: 11, fontWeight: "900" }}>{order.items.length > 1 ? "3" : "2"}</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.5 }}>
                        Apna Experience Likhein
                      </Text>
                    </View>

                    <View style={{
                      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#f8fafc",
                      borderRadius: 18, padding: 16,
                      borderWidth: 1.5,
                      borderColor: comment.length > 0
                        ? colors.primary + "60"
                        : isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                    }}>
                      <TextInput
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Product kaisa laga? Quality, delivery, packaging — sab batayein..."
                        placeholderTextColor={isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}
                        multiline
                        textAlignVertical="top"
                        style={{
                          color: colors.text,
                          fontSize: 14,
                          lineHeight: 22,
                          minHeight: 120,
                          fontFamily: "Inter-Regular",
                        }}
                      />
                      {/* Char count */}
                      <Text style={{
                        color: comment.length > 200 ? "#ef4444" : colors.textSecondary,
                        fontSize: 11, textAlign: "right", marginTop: 8, opacity: 0.6,
                      }}>
                        {comment.length}/500
                      </Text>
                    </View>

                    {/* Tips */}
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      {["Quality acha tha", "Fast delivery", "Packaging theek thi", "Value for money"].map((tip, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setComment(prev => prev ? prev + ", " + tip : tip)}
                          activeOpacity={0.7}
                          style={{
                            flexDirection: "row", alignItems: "center", gap: 4,
                            backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
                            borderWidth: 1, borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)",
                          }}
                        >
                          <Ionicons name="add" size={12} color={colors.textSecondary} />
                          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: "600" }}>{tip}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* ── Submit Button ── */}
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    activeOpacity={0.87}
                  >
                    <LinearGradient
                      colors={canSubmit
                        ? ["#FFC107", "#FF8F00"]
                        : [isDark ? "#1a1a1a" : "#e2e8f0", isDark ? "#1a1a1a" : "#e2e8f0"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={{
                        height: 56, borderRadius: 18,
                        alignItems: "center", justifyContent: "center",
                        flexDirection: "row", gap: 10,
                        opacity: canSubmit ? 1 : 0.5,
                        shadowColor: "#FFC107",
                        shadowOpacity: canSubmit ? 0.5 : 0,
                        shadowRadius: 14, shadowOffset: { width: 0, height: 5 },
                        elevation: canSubmit ? 8 : 0,
                      }}
                    >
                      {isAddingReview ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <Ionicons name="star" size={18} color={canSubmit ? "#000" : colors.textSecondary} />
                          <Text style={{
                            color: canSubmit ? "#000" : colors.textSecondary,
                            fontSize: 15, fontWeight: "900", letterSpacing: 0.3,
                          }}>
                            Review Submit Karein
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  {/* Disclaimer */}
                  <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: "center", marginTop: 12, opacity: 0.45, lineHeight: 16 }}>
                    Aapka review publicly visible hoga.{"\n"}Honest aur helpful review likhein.
                  </Text>

                </ScrollView>
              </Animated.View>
            </View>
          </BlurView>
        </Animated.View>

      </KeyboardAvoidingView>
    </Modal>
  );
}
