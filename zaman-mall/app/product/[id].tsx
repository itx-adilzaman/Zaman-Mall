import SafeScreen from "@/components/SafeScreen";
import useCart from "@/hooks/useCart";
import { useProduct } from "@/hooks/useProduct";
import useProducts from "@/hooks/useProducts";
import useWishlist from "@/hooks/useWishlist";
import { useReviews } from "@/hooks/useReviews";
import { useImageUpload } from "@/hooks/useImageUpload";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useAlert } from "@/context/AlertContext";
import { formatDate } from "@/lib/utils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState, useMemo, useEffect } from "react";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import LiquidGlassVideoPlayer from "@/components/LiquidGlassVideoPlayer";
import AIChatModal from "@/components/AIChatModal";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated
} from "react-native";
import { memo, useCallback, useRef } from "react";
import PremiumTextInput from "@/components/PremiumTextInput";
import PremiumButton from "@/components/PremiumButton";

const { width, height } = Dimensions.get("window");

const CollapsibleSection = memo(({ title, icon, children, isOpen, onToggle, colors }: any) => {
  return (
    <View 
      style={{ 
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 20,
        marginBottom: 12,
        overflow: 'hidden'
      }}
    >
      <TouchableOpacity 
        onPress={onToggle}
        activeOpacity={0.7}
        style={{ 
          padding: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <View className="flex-row items-center flex-1">
          <View 
            style={{ 
              backgroundColor: `${colors.primary}15`,
              width: 36,
              height: 36,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12
            }}
          >
            <Ionicons name={icon} size={18} color={colors.primary} />
          </View>
          <Text style={{ color: colors.text }} className="text-base font-bold">{title}</Text>
        </View>
        <Ionicons 
          name={isOpen ? "chevron-up" : "chevron-down"} 
          size={20} 
          color={colors.textSecondary} 
        />
      </TouchableOpacity>
      
      {isOpen && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
          <View style={{ height: 1, backgroundColor: colors.border, marginBottom: 16, opacity: 0.5 }} />
          {children}
        </View>
      )}
    </View>
  );
});

const ProductDetailScreen = () => {
  const { id, autoReview } = useLocalSearchParams<{ id: string, autoReview?: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { showAlert } = useAlert();
  const { data: product, isError, isLoading } = useProduct(id);
  const { reviews, addReview, isAddingReview } = useReviews(id);
  const { addToCart, isAddingToCart } = useCart();

  const { averageRating, totalReviews } = useMemo(() => {
    if (!reviews || reviews.length === 0) return { averageRating: 0, totalReviews: 0 };
    const total = reviews.reduce((acc: number, review: any) => acc + review.rating, 0);
    return {
      averageRating: (total / reviews.length).toFixed(1),
      totalReviews: reviews.length
    };
  }, [reviews]);

  const { pickImage, uploadImage } = useImageUpload();

  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (autoReview === 'true' && user) {
      setReviewModalVisible(true);
    }
  }, [autoReview, user]);

  const { isInWishlist, toggleWishlist, isAddingToWishlist, isRemovingFromWishlist } =
    useWishlist();

  const { data: allProducts } = useProducts();

  const groupedVariants = useMemo(() => {
    if (!product?.variants) return [];
    
    const groups: Record<string, { value: string; price?: number }[]> = {};
    
    product.variants.forEach((variant: any) => {
      const type = variant.type;
      if (!groups[type]) groups[type] = [];
      
      variant.options.forEach((opt: any) => {
        const val = typeof opt === 'string' ? opt : opt.value;
        const price = typeof opt === 'object' && opt.price > 0 ? opt.price : undefined;
        // deduplicate by value
        if (!groups[type].find(o => o.value === val)) {
          groups[type].push({ value: val, price });
        }
      });
    });

    return Object.entries(groups).map(([type, options]) => ({ type, options }));
  }, [product]);

  const relatedProducts = useMemo(() => {
    if (!allProducts || !product) return [];
    return allProducts
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [allProducts, product]);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [zoomedImageIndex, setZoomedImageIndex] = useState<number | null>(null);
  const [zoomedReviewImage, setZoomedReviewImage] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<'photos' | 'video'>('photos');
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>('description');
  const [aiSectionVisible, setAiSectionVisible] = useState(false);

  // Random number of viewers for social proof
  const viewersCount = useMemo(() => Math.floor(Math.random() * (45 - 12 + 1)) + 12, []);

  // Set default variants
  useEffect(() => {
    if (product && groupedVariants.length > 0 && Object.keys(selectedVariants).length === 0) {
      const defaults: Record<string, string> = {};
      groupedVariants.forEach(variant => {
        if (variant.options.length > 0) {
          defaults[variant.type] = variant.options[0].value;
        }
      });
      setSelectedVariants(defaults);
    }
  }, [product, groupedVariants]);

  // Reset tab when product changes or if it has no video
  useEffect(() => {
    if (product && (!product.videos || product.videos.length === 0)) {
      setActiveTab('photos');
    }
    setActiveVideoIndex(0);
  }, [product]);

  // Get the actual video URLs from the database
  const productVideos = useMemo(() => {
    if (product?.videos && product.videos.length > 0) {
      return product.videos;
    }
    if (product?.videoUrl) {
      return [{ videoUrl: product.videoUrl, title: 'Product Video' }];
    }
    return [];
  }, [product]);

  const productVideoUrl = productVideos.length > 0 ? productVideos[activeVideoIndex].videoUrl : null;
  
  // Review Modal State
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewImages, setReviewImages] = useState<{ uri: string; base64?: string | null }[]>([]);

  const handlePickImage = useCallback(async () => {
    try {
      const result = await pickImage();
      if (result) {
        setReviewImages((prev) => [...prev, { uri: result.uri, base64: result.base64 }]);
      }
    } catch {
      showAlert({
        title: "Error",
        message: "Failed to pick image",
        icon: "image-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
    }
  }, [pickImage, showAlert]);

  const handleRemoveImage = useCallback((index: number) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleImageError = useCallback((index: number) => {
    setFailedImages(prev => new Set(prev).add(index));
  }, []);

  const validImages = useMemo(() => {
    const images = product?.images || [product?.image];
    return images.filter((_, index) => !failedImages.has(index));
  }, [product, failedImages]);

  const handleAddToCart = useCallback(() => {
    if (!product) return;

    // Check if all variants are selected
    const requiredVariantTypes = groupedVariants.map(g => g.type);
    const selectedVariantTypes = Object.keys(selectedVariants);
    const missingVariants = requiredVariantTypes.filter(type => !selectedVariantTypes.includes(type));

    if (missingVariants.length > 0) {
      showAlert({
        title: "Select Options",
        message: `Please select ${missingVariants.join(' and ')} before adding to cart.`,
        icon: "options-outline",
        buttons: [{ text: "Got it", onPress: () => {} }]
      });
      return;
    }

    addToCart(
      { product, quantity, variants: selectedVariants, variantPrice: currentPrice },
      {
        onSuccess: () => {
          showAlert({
            title: "Added to Cart",
            message: `${product.name} has been added to your cart.`,
            icon: "cart-outline",
            buttons: [
              { text: "Continue Shopping", onPress: () => {} },
              { text: "View Cart", onPress: () => router.push("/cart") }
            ]
          });
        },
        onError: () => {
          showAlert({
            title: "Error",
            message: "Failed to add to cart",
            icon: "alert-circle-outline",
            buttons: [{ text: "OK", onPress: () => {} }]
          });
        },
      }
    );
  }, [product, groupedVariants, selectedVariants, quantity, currentPrice, addToCart, showAlert]);

  const handleOrderNow = useCallback(() => {
    if (!product) return;

    // Check if all variants are selected
    const requiredVariantTypes = groupedVariants.map(g => g.type);
    const selectedVariantTypes = Object.keys(selectedVariants);
    const missingVariants = requiredVariantTypes.filter(type => !selectedVariantTypes.includes(type));

    if (missingVariants.length > 0) {
      showAlert({
        title: "Select Options",
        message: `Please select ${missingVariants.join(' and ')} before ordering.`,
        icon: "options-outline",
        buttons: [{ text: "Got it", onPress: () => {} }]
      });
      return;
    }

    addToCart(
      { product, quantity, variants: selectedVariants, variantPrice: currentPrice },
      {
        onSuccess: () => {
          router.push("/cart");
        },
        onError: () => {
          showAlert({
            title: "Error",
            message: "Failed to add to cart",
            icon: "alert-circle-outline",
            buttons: [{ text: "OK", onPress: () => {} }]
          });
        },
      }
    );
  }, [product, groupedVariants, selectedVariants, quantity, currentPrice, addToCart, showAlert]);

  const handleToggleWishlist = useCallback(() => {
    if (!user) {
      showAlert({
        title: "Login Required",
        message: "Please login to add items to your wishlist.",
        icon: "heart-outline",
        buttons: [
          { text: "Cancel", onPress: () => {}, style: "cancel" },
          { text: "Login", onPress: () => router.push("/(auth)") }
        ]
      });
      return;
    }
    if (product) {
      toggleWishlist(product.id);
    }
  }, [user, product, toggleWishlist, showAlert]);

  const handleSubmitReview = useCallback(async () => {
    if (!user) {
      showAlert({
        title: "Login Required",
        message: "Please login to submit a review.",
        icon: "star-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
      return;
    }

    if (!comment.trim()) {
      showAlert({
        title: "Empty Review",
        message: "Please write a comment for your review.",
        icon: "chatbubble-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
      return;
    }

    try {
      // Upload all images to Cloudinary
      const imageUrls: string[] = [];
      for (const img of reviewImages) {
        if (img.uri && img.base64) {
          const url = await uploadImage(img.uri, img.base64);
          imageUrls.push(url);
        } else if (img.uri && !img.uri.startsWith('file://')) {
          // If it's already an uploaded URL
          imageUrls.push(img.uri);
        }
      }

      addReview(
        { rating, comment, images: imageUrls },
        {
          onSuccess: () => {
            showAlert({
              title: "Review Submitted",
              message: "Thank you for your review! It will be visible once approved.",
              icon: "checkmark-circle-outline",
              buttons: [{ text: "OK", onPress: () => {} }]
            });
            setReviewModalVisible(false);
            setComment("");
            setRating(5);
            setReviewImages([]);
          },
          onError: () => {
          showAlert({
            title: "Error",
            message: "Failed to submit review",
            icon: "alert-circle-outline",
            buttons: [{ text: "OK", onPress: () => {} }]
          });
        },
        }
      );
    } catch (error) {
      showAlert({
        title: "Error",
        message: "Failed to process review",
        icon: "alert-circle-outline",
        buttons: [{ text: "OK", onPress: () => {} }]
      });
    }
  }, [user, comment, reviewImages, rating, uploadImage, addReview, showAlert]);

  const handleVariantSelect = useCallback((variantType: string, option: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [variantType]: option
    }));
  }, []);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = useCallback((e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setSelectedImageIndex(index);
  }, []);

  const getValidImages = useCallback(() => {
    return validImages;
  }, [validImages]);

  // Resolve price based on selected variants — must be BEFORE early returns (Rules of Hooks)
  const currentPrice = useMemo(() => {
    if (!product) return 0;
    for (const variant of groupedVariants) {
      const selectedVal = selectedVariants[variant.type];
      if (!selectedVal) continue;
      const matched = variant.options.find(o => o.value === selectedVal);
      if (matched?.price != null && matched.price > 0) return matched.price;
    }
    return product.price;
  }, [product, groupedVariants, selectedVariants]);

  if (isLoading) return <LoadingUI />;
  if (isError || !product) return <ErrorUI />;

  const inStock = (product?.stock ?? 0) > 0;

  return (
    <SafeScreen>
      {/* HEADER */}
      <View className="absolute top-0 left-0 right-0 z-10 px-6 pt-20 pb-4 flex-row items-center justify-between">
        <TouchableOpacity
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)' }}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={isDark ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>

        <TouchableOpacity
          className="w-12 h-12 rounded-full items-center justify-center"
          style={{ 
            backgroundColor: isInWishlist(product?.id ?? "") 
              ? colors.primary 
              : (isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)') 
          }}
          onPress={handleToggleWishlist}
          disabled={isAddingToWishlist || isRemovingFromWishlist}
          activeOpacity={0.7}
        >
          {isAddingToWishlist || isRemovingFromWishlist ? (
            <ActivityIndicator size="small" color={isInWishlist(product?.id ?? "") ? "#000" : (isDark ? "#FFF" : "#000")} />
          ) : (
            <Ionicons
              name={isInWishlist(product?.id ?? "") ? "heart" : "heart-outline"}
              size={24}
              color={isInWishlist(product?.id ?? "") ? (isDark ? "#000" : "#FFF") : (isDark ? "#FFFFFF" : "#000000")}
            />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        style={{ backgroundColor: colors.background }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* IMAGE/VIDEO GALLERY */}
        <View className="relative overflow-hidden" style={{ height: 450 }}>
          {/* TAB SWITCHER - MOVED TO BOTTOM & SMALLER */}
          {productVideos.length > 0 && (
            <View 
              className="absolute bottom-6 left-0 right-0 z-30 flex-row justify-center items-center"
              pointerEvents="box-none"
            >
              <View 
                style={{ 
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  borderRadius: 20,
                  padding: 3,
                  flexDirection: 'row',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.2)',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.5,
                  shadowRadius: 5,
                  elevation: 10
                }}
              >
                <TouchableOpacity
                  onPress={() => setActiveTab('photos')}
                  style={{
                    backgroundColor: activeTab === 'photos' ? colors.primary : 'transparent',
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images" size={14} color={activeTab === 'photos' ? "#000" : "#FFF"} />
                  <Text style={{ color: activeTab === 'photos' ? "#000" : "#FFF", fontWeight: '800', fontSize: 11 }}>Photos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveTab('video')}
                  style={{
                    backgroundColor: activeTab === 'video' ? colors.primary : 'transparent',
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="play-circle" size={14} color={activeTab === 'video' ? "#000" : "#FFF"} />
                  <Text style={{ color: activeTab === 'video' ? "#000" : "#FFF", fontWeight: '800', fontSize: 11 }}>Video</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {activeTab === 'photos' || productVideos.length === 0 ? (
            <>
              {/* Background Blurred Image for Depth */}
              <View className="absolute inset-0 opacity-30">
                {validImages.map((image: string, index: number) => {
                  const opacity = scrollX.interpolate({
                    inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                    outputRange: [0, 1, 0],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View key={`bg-${index}`} style={[{ position: 'absolute', inset: 0, opacity }]}>
                      <Image 
                        source={image} 
                        style={{ width, height: 450 }} 
                        contentFit="cover" 
                        blurRadius={20}
                        onError={() => handleImageError(index)}
                        cachePolicy="memory"
                      />
                    </Animated.View>
                  );
                })}
              </View>

              <Animated.ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEventThrottle={16}
              >
                {validImages.map((image: string, index: number) => (
                  <TouchableOpacity 
                    key={index} 
                    activeOpacity={1} 
                    onPress={() => setZoomedImageIndex(index)} 
                    style={{ width, justifyContent: 'center', alignItems: 'center' }}
                  >
                    <View 
                      className="rounded-3xl overflow-hidden shadow-2xl" 
                      style={{ 
                        width: width * 0.85, 
                        height: 380,
                        backgroundColor: colors.glassSurface,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 10 },
                        shadowOpacity: 0.3,
                        shadowRadius: 20,
                        elevation: 10,
                        marginTop: 40
                      }}
                    >
                      <Image 
                        source={image} 
                        style={{ width: '100%', height: '100%' }} 
                        contentFit="cover" 
                        onError={() => handleImageError(index)}
                        cachePolicy="memory-disk"
                        priority="high"
                      />
                    </View>
                  </TouchableOpacity>
                ))}
              </Animated.ScrollView>

              {/* Image Indicators - Premium Style - MOVED SLIGHTLY UP */}
              <View className="absolute bottom-20 left-0 right-0 flex-row justify-center items-center gap-1.5">
                {validImages.map((_: any, index: number) => {
                  const dotWidth = scrollX.interpolate({
                    inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                    outputRange: [8, 20, 8],
                    extrapolate: 'clamp',
                  });
                  const dotOpacity = scrollX.interpolate({
                    inputRange: [(index - 1) * width, index * width, (index + 1) * width],
                    outputRange: [0.4, 1, 0.4],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View
                      key={index}
                      style={{
                        height: 8,
                        width: dotWidth,
                        borderRadius: 4,
                        backgroundColor: colors.primary,
                        opacity: dotOpacity,
                      }}
                    />
                  );
                })}
              </View>

              {/* Image Counter Badge - MOVED TO CENTER TOP */}
              <View className="absolute top-10 left-0 right-0 flex-row justify-center z-20">
                <View className="overflow-hidden rounded-2xl">
                  <BlurView intensity={40} tint="dark" className="px-4 py-2 flex-row items-center border border-white/10">
                    <Ionicons name="images-outline" size={14} color="#fff" style={{ marginRight: 6 }} />
                    <Text className="text-white text-xs font-black">
                      {selectedImageIndex + 1} / {validImages.length}
                    </Text>
                  </BlurView>
                </View>
              </View>
            </>
          ) : (
             <View style={{ flex: 1, backgroundColor: '#000' }}>
               <LiquidGlassVideoPlayer 
                 videoUrl={productVideoUrl} 
                 height={450} 
                 width={width} 
               />
               
               {/* MULTIPLE VIDEO INDICATORS - MOVED ABOVE TABS */}
               {productVideos.length > 1 && (
                 <View 
                   className="absolute bottom-24 left-0 right-0 flex-row justify-center items-center gap-3 px-6"
                   pointerEvents="box-none"
                 >
                   {productVideos.map((_, idx) => (
                     <TouchableOpacity
                       key={idx}
                       onPress={() => setActiveVideoIndex(idx)}
                       style={{
                         backgroundColor: activeVideoIndex === idx ? colors.primary : 'rgba(0,0,0,0.5)',
                         paddingHorizontal: 12,
                         paddingVertical: 6,
                         borderRadius: 12,
                         borderWidth: 1,
                         borderColor: activeVideoIndex === idx ? 'transparent' : 'rgba(255,255,255,0.2)',
                       }}
                       activeOpacity={0.7}
                     >
                       <Text 
                         style={{ 
                           color: activeVideoIndex === idx ? '#000' : '#FFF',
                           fontSize: 10,
                           fontWeight: 'bold'
                         }}
                       >
                         Video {idx + 1}
                       </Text>
                     </TouchableOpacity>
                   ))}
                 </View>
               )}
             </View>
           )}
        </View>

        {/* PRODUCT INFO */}
        <View style={{ padding: 20 }}>

          {/* Category + Country + Viewers */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{
                backgroundColor: colors.primary + '15', borderWidth: 1,
                borderColor: colors.primary + '30', borderRadius: 20,
                paddingHorizontal: 10, paddingVertical: 5,
              }}>
                <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.2 }}>
                  {product?.category}
                </Text>
              </View>

              {product?.country === 'china' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Image source={require("@/assets/images/china.png")} style={{ width: 14, height: 10 }} contentFit="contain" />
                  <Text style={{ color: '#EF4444', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Global</Text>
                </View>
              )}
              {product?.country === 'pakistan' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Image source={require("@/assets/images/pakistan.png")} style={{ width: 14, height: 10 }} contentFit="contain" />
                  <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Local</Text>
                </View>
              )}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' }} />
              <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>{viewersCount} viewing</Text>
            </View>
          </View>

          {/* Product Name */}
          <Text style={{ color: colors.text, fontSize: 26, fontWeight: '900', lineHeight: 32, letterSpacing: -0.5, marginBottom: 14 }}>
            {product?.name}
          </Text>

          {/* Rating + Stock row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: 'rgba(255,193,7,0.1)', borderWidth: 1,
                borderColor: 'rgba(255,193,7,0.25)', borderRadius: 12,
                paddingHorizontal: 12, paddingVertical: 7,
              }}
            >
              <Ionicons name="star" size={13} color="#FFC107" />
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '800' }}>{averageRating}</Text>
              <View style={{ width: 1, height: 12, backgroundColor: 'rgba(255,193,7,0.3)' }} />
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{totalReviews} reviews</Text>
            </TouchableOpacity>

            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 6,
              backgroundColor: inStock ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
              borderWidth: 1, borderColor: inStock ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)',
              borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
            }}>
              <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: inStock ? '#10B981' : '#EF4444' }} />
              <Text style={{ color: inStock ? '#10B981' : '#EF4444', fontSize: 12, fontWeight: '800' }}>
                {inStock ? `In Stock (${product?.stock})` : 'Out of Stock'}
              </Text>
            </View>
          </View>

          {/* ── PRICE CARD ── */}
          <View style={{ marginBottom: 22 }}>
            <LinearGradient
              colors={isDark ? ['rgba(29,185,84,0.08)', 'rgba(29,185,84,0.03)'] : ['rgba(29,185,84,0.06)', 'rgba(29,185,84,0.02)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 20, padding: 18,
                borderWidth: 1, borderColor: isDark ? 'rgba(29,185,84,0.2)' : 'rgba(29,185,84,0.15)',
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                Price
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
                <Text style={{ color: colors.primary, fontSize: 38, fontWeight: '900', letterSpacing: -1 }}>
                  Rs. {currentPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </Text>
                {currentPrice !== product.price && (
                  <Text style={{ color: colors.textSecondary, fontSize: 17, textDecorationLine: 'line-through', opacity: 0.5 }}>
                    Rs. {product.price.toLocaleString()}
                  </Text>
                )}
              </View>
              {currentPrice !== product.price && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                  <View style={{ backgroundColor: '#22c55e', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>
                      Save Rs. {(product.price - currentPrice).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* ── VARIANTS ── */}
          {groupedVariants.length > 0 && (
            <View style={{ marginBottom: 22 }}>
              {groupedVariants.map((variant, variantIndex) => (
                <View key={variantIndex} style={{ marginBottom: 16 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                      {variant.type}
                    </Text>
                    {selectedVariants[variant.type] && (
                      <View style={{ backgroundColor: colors.primary + '15', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3 }}>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800' }}>
                          {selectedVariants[variant.type]}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {variant.options.map((opt, optionIndex) => {
                      const isSelected = selectedVariants[variant.type] === opt.value;
                      const hasPrice = opt.price != null && opt.price > 0;
                      return (
                        <TouchableOpacity
                          key={`${variantIndex}-${optionIndex}`}
                          onPress={() => handleVariantSelect(variant.type, opt.value)}
                          activeOpacity={0.75}
                          style={{
                            paddingHorizontal: 16, paddingVertical: hasPrice ? 8 : 10,
                            borderRadius: 14, alignItems: 'center', minWidth: 52,
                            borderWidth: isSelected ? 2 : 1.5,
                            borderColor: isSelected ? colors.primary : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                            backgroundColor: isSelected ? colors.primary + '12' : isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                          }}
                        >
                          <Text style={{ color: isSelected ? colors.primary : colors.textSecondary, fontSize: 12, fontWeight: '800' }}>
                            {opt.value}
                          </Text>
                          {hasPrice && (
                            <Text style={{ color: isSelected ? colors.primary : colors.textSecondary, fontSize: 10, fontWeight: '700', marginTop: 2, opacity: 0.8 }}>
                              Rs. {opt.price!.toLocaleString()}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* ── QUANTITY ── */}
          <View style={{ marginBottom: 22 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>Quantity</Text>
              {quantity >= product.stock && inStock && (
                <Text style={{ color: '#f97316', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>Stock Limit</Text>
              )}
            </View>
            <View style={{
              flexDirection: 'row', alignItems: 'center',
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
              borderRadius: 20, padding: 6, borderWidth: 1,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.07)',
              justifyContent: 'space-between',
            }}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={!inStock || quantity <= 1}
                activeOpacity={0.7}
                style={{
                  width: 48, height: 48, borderRadius: 14,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#fff',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                  opacity: (quantity <= 1 || !inStock) ? 0.4 : 1,
                }}
              >
                <Ionicons name="remove" size={20} color={colors.text} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center', flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.5 }}>{quantity}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>Items</Text>
              </View>

              <TouchableOpacity
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={!inStock || quantity >= product.stock}
                activeOpacity={0.7}
                style={{
                  width: 48, height: 48, borderRadius: 14,
                  backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
                  shadowColor: colors.primary, shadowOpacity: 0.4, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4,
                  opacity: (!inStock || quantity >= product.stock) ? 0.4 : 1,
                }}
              >
                <Ionicons name="add" size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── COLLAPSIBLE SECTIONS ── */}
          <View style={{ marginBottom: 22 }}>
            <CollapsibleSection
              title="Description"
              icon="document-text-outline"
              isOpen={openSection === 'description'}
              onToggle={() => setOpenSection(openSection === 'description' ? null : 'description')}
              colors={colors}
            >
              {product.description.includes('\n') || product.description.includes('•') || product.description.includes('- ') ? (
                product.description.split(/\n|•|- /).filter((line: string) => line.trim().length > 0).map((line: string, index: number) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary, marginTop: 8, marginRight: 12, flexShrink: 0 }} />
                    <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, flex: 1 }}>{line.trim()}</Text>
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>{product.description}</Text>
              )}
            </CollapsibleSection>

            <CollapsibleSection
              title="Delivery & Returns"
              icon="bus-outline"
              isOpen={openSection === 'delivery'}
              onToggle={() => setOpenSection(openSection === 'delivery' ? null : 'delivery')}
              colors={colors}
            >
              {[
                { icon: 'bus-outline', title: 'Standard Delivery', sub: '3-5 working days' },
                { icon: 'refresh-circle-outline', title: '7 Days Return', sub: 'Easy return if product is damaged' },
              ].map((item, i) => (
                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: i === 0 ? 14 : 0 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primary + '12', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                    <Ionicons name={item.icon as any} size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700', marginBottom: 2 }}>{item.title}</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </CollapsibleSection>

            <CollapsibleSection
              title="Specifications"
              icon="list-outline"
              isOpen={openSection === 'specs'}
              onToggle={() => setOpenSection(openSection === 'specs' ? null : 'specs')}
              colors={colors}
            >
              {[
                { label: 'SKU', value: product.id.substring(0, 8).toUpperCase() },
                { label: 'Category', value: product.category },
                { label: 'Stock Status', value: inStock ? 'In Stock' : 'Out of Stock', color: inStock ? '#10B981' : '#EF4444' },
              ].map((row, i) => (
                <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: colors.border + '60' }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>{row.label}</Text>
                  <Text style={{ color: row.color || colors.text, fontSize: 12, fontWeight: '800' }}>{row.value}</Text>
                </View>
              ))}
            </CollapsibleSection>

            <CollapsibleSection
              title="Product Gallery"
              icon="images-outline"
              isOpen={openSection === 'gallery'}
              onToggle={() => setOpenSection(openSection === 'gallery' ? null : 'gallery')}
              colors={colors}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {validImages.map((img: string, index: number) => (
                  <TouchableOpacity key={index} onPress={() => setZoomedImageIndex(index)} activeOpacity={0.8}
                    style={{ width: (width - 100) / 3, height: (width - 100) / 3, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: colors.border + '60' }}>
                    <Image source={img} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </TouchableOpacity>
                ))}
              </View>
            </CollapsibleSection>
          </View>

          {/* ── TRUST BADGES ── */}
          <View style={{
            flexDirection: 'row', justifyContent: 'space-around',
            backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
            borderRadius: 20, padding: 18, marginBottom: 28,
            borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
          }}>
            {[
              { icon: 'shield-checkmark', label: 'Secure\nPayment', color: '#10B981' },
              { icon: 'ribbon', label: '100%\nOriginal', color: colors.primary },
              { icon: 'flash', label: 'Fast\nDelivery', color: '#F59E0B' },
            ].map((badge, i) => (
              <View key={i} style={{ alignItems: 'center', flex: 1 }}>
                {i > 0 && <View style={{ position: 'absolute', left: 0, top: '50%', width: 1, height: 32, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', marginTop: -16 }} />}
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: badge.color + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 8, borderWidth: 1, borderColor: badge.color + '25' }}>
                  <Ionicons name={badge.icon as any} size={20} color={badge.color} />
                </View>
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', textAlign: 'center', lineHeight: 14 }}>{badge.label}</Text>
              </View>
            ))}
          </View>

          {/* ══ REVIEWS SECTION — Premium ══════════════════════════════════ */}
          <View style={{ marginBottom: 32 }}>

            {/* ── Header row ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ width: 4, height: 20, borderRadius: 2, backgroundColor: '#FFC107' }} />
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', letterSpacing: -0.3 }}>
                  Customer Reviews
                </Text>
              </View>
              {user && (
                <TouchableOpacity
                  onPress={() => setReviewModalVisible(true)}
                  activeOpacity={0.8}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: '#FFC107', borderRadius: 20,
                    paddingHorizontal: 14, paddingVertical: 8,
                    shadowColor: '#FFC107', shadowOpacity: 0.4,
                    shadowRadius: 8, shadowOffset: { width: 0, height: 3 },
                    elevation: 4,
                  }}
                >
                  <Ionicons name="create-outline" size={14} color="#000" />
                  <Text style={{ color: '#000', fontWeight: '800', fontSize: 12 }}>Write Review</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* ── Rating Summary Card ── */}
            {reviews && reviews.length > 0 && (
              <View style={{
                backgroundColor: isDark ? 'rgba(255,193,7,0.06)' : 'rgba(255,193,7,0.04)',
                borderRadius: 20, padding: 20, marginBottom: 16,
                borderWidth: 1, borderColor: 'rgba(255,193,7,0.15)',
                flexDirection: 'row', alignItems: 'center', gap: 16,
              }}>
                {/* Big rating number */}
                <View style={{ alignItems: 'center', minWidth: 72 }}>
                  <Text style={{ color: colors.text, fontSize: 48, fontWeight: '900', lineHeight: 52 }}>
                    {averageRating}
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                    {[1,2,3,4,5].map(s => (
                      <Ionicons key={s} name={s <= Math.round(Number(averageRating)) ? 'star' : 'star-outline'} size={13} color="#FFC107" />
                    ))}
                  </View>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 4, opacity: 0.7 }}>
                    {totalReviews} review{totalReviews !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Divider */}
                <View style={{ width: 1, height: 64, backgroundColor: 'rgba(255,193,7,0.2)' }} />

                {/* Bar chart */}
                <View style={{ flex: 1, gap: 5 }}>
                  {[5,4,3,2,1].map(star => {
                    const count = reviews.filter((r:any) => r.rating === star).length;
                    const pct = reviews.length > 0 ? (count / reviews.length) : 0;
                    return (
                      <View key={star} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700', width: 8 }}>{star}</Text>
                        <Ionicons name="star" size={9} color="#FFC107" />
                        <View style={{ flex: 1, height: 5, backgroundColor: colors.border + '60', borderRadius: 3 }}>
                          <View style={{ width: pct * 100 + '%' as any, height: 5, backgroundColor: '#FFC107', borderRadius: 3 }} />
                        </View>
                        <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600', width: 16, textAlign: 'right', opacity: 0.6 }}>{count}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ── Review Cards ── */}
            {reviews && reviews.length > 0 ? (
              reviews.map((review: any, index: number) => (
                <View
                  key={review.id}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 20, padding: 16, marginBottom: 12,
                    borderWidth: 1,
                    borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    shadowColor: '#000',
                    shadowOpacity: isDark ? 0.2 : 0.04,
                    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
                    elevation: 2,
                  }}
                >
                  {/* Card top row */}
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}>
                    {/* Avatar */}
                    <View style={{ position: 'relative', marginRight: 12 }}>
                      <Image
                        source={{ uri: review.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=FFC107&color=000&size=80` }}
                        style={{ width: 44, height: 44, borderRadius: 22 }}
                        contentFit="cover"
                      />
                      {/* Verified badge */}
                      <View style={{
                        position: 'absolute', bottom: -2, right: -2,
                        width: 16, height: 16, borderRadius: 8,
                        backgroundColor: '#10B981',
                        alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1.5, borderColor: colors.surface,
                      }}>
                        <Ionicons name="checkmark" size={9} color="#fff" />
                      </View>
                    </View>

                    {/* Name + stars */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>{review.userName}</Text>
                        <Text style={{ color: colors.textSecondary, fontSize: 11, opacity: 0.55 }}>{formatDate(review.date)}</Text>
                      </View>
                      {/* Stars row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <Ionicons key={s} name={s <= review.rating ? 'star' : 'star-outline'} size={13} color="#FFC107" />
                        ))}
                        <View style={{
                          marginLeft: 8, backgroundColor: review.rating >= 4 ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                          borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
                        }}>
                          <Text style={{ color: review.rating >= 4 ? '#10B981' : '#f59e0b', fontSize: 10, fontWeight: '800' }}>
                            {review.rating >= 5 ? 'Excellent' : review.rating >= 4 ? 'Very Good' : review.rating >= 3 ? 'Good' : 'Fair'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Comment */}
                  <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22, marginBottom: review.images?.length > 0 ? 12 : 0 }}>
                    {review.comment}
                  </Text>

                  {/* Review images */}
                  {review.images && review.images.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 4 }}>
                      {review.images.map((img: string, i: number) => (
                        <TouchableOpacity key={i} activeOpacity={0.9} onPress={() => setZoomedReviewImage(img)}>
                          <Image
                            source={{ uri: img }}
                            style={{ width: 88, height: 88, borderRadius: 12 }}
                            contentFit="cover"
                          />
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {/* Helpful row */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border + '40' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                      <Text style={{ color: '#10B981', fontSize: 10, fontWeight: '700' }}>Verified Purchase</Text>
                    </View>
                    <Text style={{ color: colors.textSecondary, fontSize: 10, opacity: 0.5 }}>
                      Review #{index + 1}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              /* ── Empty State ── */
              <View style={{
                backgroundColor: colors.surface, borderRadius: 24, padding: 32,
                alignItems: 'center', borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
              }}>
                <View style={{
                  width: 72, height: 72, borderRadius: 36,
                  backgroundColor: 'rgba(255,193,7,0.1)', borderWidth: 1,
                  borderColor: 'rgba(255,193,7,0.2)',
                  alignItems: 'center', justifyContent: 'center', marginBottom: 16,
                }}>
                  <Ionicons name="star-outline" size={34} color="#FFC107" />
                </View>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 6 }}>
                  No Reviews Yet
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 13, textAlign: 'center', lineHeight: 20, opacity: 0.65, marginBottom: 20 }}>
                  Is product ka pehla review likhein{'\n'}aur doosron ki madad karein!
                </Text>
                {user ? (
                  <TouchableOpacity
                    onPress={() => setReviewModalVisible(true)}
                    activeOpacity={0.85}
                    style={{
                      flexDirection: 'row', alignItems: 'center', gap: 8,
                      backgroundColor: '#FFC107', borderRadius: 16,
                      paddingHorizontal: 24, paddingVertical: 12,
                      shadowColor: '#FFC107', shadowOpacity: 0.4,
                      shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 5,
                    }}
                  >
                    <Ionicons name="create" size={16} color="#000" />
                    <Text style={{ color: '#000', fontWeight: '800', fontSize: 14 }}>Pehla Review Likhein</Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: colors.textSecondary, fontSize: 12, opacity: 0.6 }}>
                    Review likhne ke liye login karein
                  </Text>
                )}
              </View>
            )}
          </View>
          {/* ══ END REVIEWS ════════════════════════════════════════════════ */}

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <View className="mb-8">
              <Text style={{ color: colors.text }} className="text-lg font-bold mb-3">Related Products</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
                {relatedProducts.map((relatedProduct) => (
                  <TouchableOpacity
                    key={relatedProduct.id}
                    style={{ 
                      backgroundColor: colors.glassSurface,
                      borderWidth: 1,
                      borderColor: colors.glassBorder,
                      borderRadius: 16,
                      width: 150,
                      overflow: 'hidden',
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.08,
                      shadowRadius: 8,
                      elevation: 3
                    }}
                    activeOpacity={0.7}
                    onPress={() => router.push(`/product/${relatedProduct.id}`)}
                  >
                    <Image
                      source={{ uri: relatedProduct.images?.[0] || relatedProduct.image }}
                      style={{ width: '100%', height: 150 }}
                      contentFit="cover"
                    />
                    <View style={{ padding: 12 }}>
                      <Text style={{ color: colors.text }} className="font-bold text-sm mb-1" numberOfLines={1}>
                        {relatedProduct.name}
                      </Text>
                      <Text style={{ color: colors.primary }} className="font-bold text-sm">
                        Rs. {relatedProduct.price.toLocaleString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t"
        style={{ 
          borderTopColor: colors.border,
          backgroundColor: isDark ? '#111111' : '#FFFFFF',
          paddingHorizontal: 16,
          paddingVertical: 12,
          paddingBottom: Platform.OS === 'ios' ? 34 : 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: isDark ? 0.4 : 0.1,
          shadowRadius: 12,
          elevation: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>

          {/* AI Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setAiSectionVisible(true)}
            style={{
              width: 54, height: 54, borderRadius: 16,
              alignItems: 'center', justifyContent: 'center',
              backgroundColor: '#2563EB',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '900', letterSpacing: 0.5 }}>AI</Text>
            <View style={{
              position: 'absolute', top: -3, right: -3,
              width: 10, height: 10, borderRadius: 5,
              backgroundColor: '#10B981',
              borderWidth: 2, borderColor: isDark ? '#111111' : '#FFFFFF',
            }} />
          </TouchableOpacity>

          {/* Add to Cart */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleAddToCart}
            disabled={!inStock || isAddingToCart}
            style={{
              flex: 1, height: 54, borderRadius: 16,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 8,
              backgroundColor: isDark ? '#2A2A2A' : '#F0F0F0',
              borderWidth: 1.5,
              borderColor: isDark ? '#3A3A3A' : '#D8D8D8',
              opacity: (!inStock || isAddingToCart) ? 0.45 : 1,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color={colors.text} />
            ) : (
              <>
                <Ionicons name="cart" size={18} color={isDark ? '#FFFFFF' : '#111111'} />
                <Text style={{ color: isDark ? '#FFFFFF' : '#111111', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 }}>
                  Add to Cart
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Buy Now */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleOrderNow}
            disabled={!inStock || isAddingToCart}
            style={{
              flex: 1, height: 54, borderRadius: 16,
              alignItems: 'center', justifyContent: 'center',
              flexDirection: 'row', gap: 8,
              backgroundColor: inStock ? colors.primary : '#555555',
              opacity: (!inStock || isAddingToCart) ? 0.45 : 1,
              shadowColor: inStock ? colors.primary : '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.45,
              shadowRadius: 8,
              elevation: 6,
            }}
          >
            {isAddingToCart ? (
              <ActivityIndicator size="small" color="#121212" />
            ) : (
              <>
                <Ionicons name="flash" size={18} color={inStock ? '#121212' : '#CCCCCC'} />
                <Text style={{
                  color: inStock ? '#121212' : '#CCCCCC',
                  fontSize: 12, fontWeight: '900', letterSpacing: 0.5,
                }}>
                  {inStock ? 'Buy Now' : 'Sold Out'}
                </Text>
              </>
            )}
          </TouchableOpacity>

        </View>
      </View>
      {/* ── Premium Review Modal ── */}
      <Modal
        animationType="none"
        transparent={true}
        visible={reviewModalVisible}
        onRequestClose={() => setReviewModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>

              {/* Tap outside to close */}
              <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => setReviewModalVisible(false)} />

              <View style={{
                backgroundColor: isDark ? '#0f0f0f' : '#ffffff',
                borderTopLeftRadius: 32, borderTopRightRadius: 32,
                maxHeight: '90%',
                borderWidth: 1,
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 24,
                shadowOffset: { width: 0, height: -8 }, elevation: 20,
              }}>

                {/* Drag handle */}
                <View style={{ alignItems: 'center', paddingTop: 14, paddingBottom: 4 }}>
                  <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
                </View>

                {/* Header */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                  paddingHorizontal: 22, paddingVertical: 14,
                  borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                }}>
                  <View style={{ gap: 2 }}>
                    <Text style={{ color: colors.text, fontSize: 19, fontWeight: '900', letterSpacing: -0.4 }}>Write a Review</Text>
                    <Text style={{ color: colors.textSecondary, fontSize: 12, opacity: 0.6 }}>Share your honest experience</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setReviewModalVisible(false)}
                    activeOpacity={0.7}
                    style={{
                      width: 36, height: 36, borderRadius: 18,
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                      alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ padding: 22, paddingBottom: 40 }}
                >
                  {/* Product preview */}
                  <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                    borderRadius: 16, padding: 12, marginBottom: 24,
                    borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
                  }}>
                    {product?.image && (
                      <Image source={{ uri: product.image }} style={{ width: 52, height: 52, borderRadius: 12 }} contentFit="cover" />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 14, fontWeight: '800' }} numberOfLines={2}>{product?.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                        <Ionicons name="checkmark-circle" size={12} color="#22c55e" />
                        <Text style={{ color: '#22c55e', fontSize: 11, fontWeight: '700' }}>Verified Purchase</Text>
                      </View>
                    </View>
                  </View>

                  {/* Step 1 — Star Rating */}
                  <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFC107', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#000', fontSize: 11, fontWeight: '900' }}>1</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Rating Dein</Text>
                    </View>

                    <View style={{ alignItems: 'center', gap: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        {[1,2,3,4,5].map((star) => {
                          const starColors = ["","#ef4444","#f97316","#eab308","#22c55e","#16a34a"];
                          const isActive = star <= rating;
                          return (
                            <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                              <Ionicons
                                name={isActive ? "star" : "star-outline"}
                                size={42}
                                color={isActive ? starColors[rating] || "#FFC107" : isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {rating > 0 && (
                        <View style={{
                          backgroundColor: (["","#ef4444","#f97316","#eab308","#22c55e","#16a34a"][rating]) + "18",
                          borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
                          borderWidth: 1, borderColor: (["","#ef4444","#f97316","#eab308","#22c55e","#16a34a"][rating]) + "30",
                        }}>
                          <Text style={{ color: ["","#ef4444","#f97316","#eab308","#22c55e","#16a34a"][rating], fontSize: 13, fontWeight: '800' }}>
                            {["","Poor","Fair","Good","Very Good","Excellent"][rating]}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Step 2 — Comment */}
                  <View style={{ marginBottom: 24 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFC107', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#000', fontSize: 11, fontWeight: '900' }}>2</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>Experience Likhein</Text>
                    </View>

                    <View style={{
                      backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                      borderRadius: 18, padding: 16,
                      borderWidth: 1.5,
                      borderColor: comment.length > 0 ? '#FFC10760' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    }}>
                      <TextInput
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Product kaisa laga? Quality, delivery, packaging sab batayein..."
                        placeholderTextColor={isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'}
                        multiline
                        textAlignVertical="top"
                        style={{ color: colors.text, fontSize: 14, lineHeight: 22, minHeight: 110 }}
                      />
                      <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'right', marginTop: 6, opacity: 0.5 }}>
                        {comment.length}/500
                      </Text>
                    </View>

                    {/* Quick tips */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {["Quality acha tha", "Fast delivery", "Value for money", "Packaging theek thi"].map((tip, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => setComment(prev => prev ? prev + ", " + tip : tip)}
                          style={{
                            flexDirection: 'row', alignItems: 'center', gap: 4,
                            backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
                            borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                          }}
                        >
                          <Ionicons name="add" size={12} color={colors.textSecondary} />
                          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>{tip}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Step 3 — Photos */}
                  <View style={{ marginBottom: 28 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFC107', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ color: '#000', fontSize: 11, fontWeight: '900' }}>3</Text>
                      </View>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                        Photos Add Karein (Optional)
                      </Text>
                    </View>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
                      {reviewImages.map((img, index) => (
                        <View key={index} style={{ position: 'relative' }}>
                          <Image source={{ uri: img.uri }} style={{ width: 80, height: 80, borderRadius: 14 }} contentFit="cover" />
                          <TouchableOpacity
                            onPress={() => handleRemoveImage(index)}
                            style={{
                              position: 'absolute', top: -6, right: -6,
                              width: 22, height: 22, borderRadius: 11,
                              backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center',
                              borderWidth: 2, borderColor: isDark ? '#0f0f0f' : '#fff',
                            }}
                          >
                            <Ionicons name="close" size={12} color="#fff" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity
                        onPress={handlePickImage}
                        style={{
                          width: 80, height: 80, borderRadius: 14,
                          borderWidth: 2, borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                          borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                          gap: 4,
                        }}
                      >
                        <Ionicons name="camera-outline" size={22} color={colors.textSecondary} />
                        <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '700' }}>Add</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>

                  {/* Submit */}
                  <TouchableOpacity
                    onPress={handleSubmitReview}
                    disabled={isAddingReview || rating === 0 || !comment.trim()}
                    activeOpacity={0.87}
                  >
                    <LinearGradient
                      colors={(rating > 0 && comment.trim()) ? ["#FFC107", "#FF8F00"] : [isDark ? "#1a1a1a" : "#e2e8f0", isDark ? "#1a1a1a" : "#e2e8f0"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={{
                        height: 56, borderRadius: 18,
                        alignItems: 'center', justifyContent: 'center',
                        flexDirection: 'row', gap: 10,
                        opacity: (rating > 0 && comment.trim()) ? 1 : 0.5,
                        shadowColor: '#FFC107',
                        shadowOpacity: (rating > 0 && comment.trim()) ? 0.5 : 0,
                        shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 8,
                      }}
                    >
                      {isAddingReview ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <>
                          <Ionicons name="star" size={18} color={(rating > 0 && comment.trim()) ? "#000" : colors.textSecondary} />
                          <Text style={{ color: (rating > 0 && comment.trim()) ? "#000" : colors.textSecondary, fontSize: 15, fontWeight: '900' }}>
                            Review Submit Karein
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>

                  <Text style={{ color: colors.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 10, opacity: 0.4, lineHeight: 16 }}>
                    Aapka review publicly visible hoga.{'\n'}Honest aur helpful review likhein.
                  </Text>
                </ScrollView>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
      {/* Zoomed Image Slider Modal */}
      <Modal
        visible={zoomedImageIndex !== null}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setZoomedImageIndex(null)}
      >
        <View className="flex-1 bg-black">
          {/* Header Actions */}
          <View className="absolute top-12 left-0 right-0 z-20 flex-row justify-between px-6 items-center">
            <BlurView intensity={20} tint="dark" className="px-4 py-2 rounded-full overflow-hidden border border-white/10">
              <Text className="text-white font-bold text-lg tracking-widest">
                {(zoomedImageIndex ?? 0) + 1} <Text className="text-white/40 font-normal">|</Text> {(product.images || [product.image]).length}
              </Text>
            </BlurView>
            <TouchableOpacity 
              className="w-12 h-12 rounded-full items-center justify-center overflow-hidden border border-white/10"
              onPress={() => setZoomedImageIndex(null)}
              activeOpacity={0.7}
            >
              <BlurView intensity={20} tint="dark" className="w-full h-full items-center justify-center">
                <Ionicons name="close" size={28} color="#fff" />
              </BlurView>
            </TouchableOpacity>
          </View>
          
          <Animated.ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: (zoomedImageIndex ?? 0) * width, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / width);
              setZoomedImageIndex(index);
            }}
            scrollEventThrottle={16}
          >
            {validImages.map((img: string, index: number) => (
              <ScrollView
                key={index}
                maximumZoomScale={5}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ width, height: '100%', justifyContent: 'center', alignItems: 'center' }}
              >
                <Image 
                  source={img} 
                  style={{ width: width, height: height * 0.7 }} 
                  contentFit="contain" 
                  cachePolicy="memory-disk"
                />
              </ScrollView>
            ))}
          </Animated.ScrollView>

          {/* Bottom Thumbnails */}
          <View className="absolute bottom-12 left-0 right-0">
            <BlurView intensity={10} tint="dark" className="mx-6 py-4 rounded-3xl overflow-hidden border border-white/5">
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
              >
                {validImages.map((img: string, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => setZoomedImageIndex(index)}
                    activeOpacity={0.8}
                    className="rounded-2xl overflow-hidden border-2 shadow-sm"
                    style={{ 
                      borderColor: zoomedImageIndex === index ? colors.primary : 'rgba(255,255,255,0.1)',
                      width: 64,
                      height: 64
                    }}
                  >
                    <Image 
                      source={img} 
                      style={{ width: '100%', height: '100%' }} 
                      contentFit="cover" 
                      className={zoomedImageIndex === index ? "opacity-100" : "opacity-40"}
                      cachePolicy="memory"
                    />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </BlurView>
          </View>
        </View>
      </Modal>

      {/* Review Image Zoom Modal */}
      <Modal
        visible={!!zoomedReviewImage}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setZoomedReviewImage(null)}
      >
        <View className="flex-1 bg-black">
          <TouchableOpacity 
            className="absolute top-12 right-6 z-20 w-12 h-12 bg-white/10 rounded-full items-center justify-center"
            onPress={() => setZoomedReviewImage(null)}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          
          <ScrollView
            maximumZoomScale={5}
            minimumZoomScale={1}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
          >
            {zoomedReviewImage && (
              <Image 
                source={{ uri: zoomedReviewImage }} 
                style={{ width: width, height: height * 0.7 }} 
                contentFit="contain" 
              />
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* AI Chat Modal */}
      <AIChatModal 
        visible={aiSectionVisible} 
        onClose={() => setAiSectionVisible(false)} 
      />
    </SafeScreen>
  );
};

export default ProductDetailScreen;

function ErrorUI() {
  const { colors } = useTheme();
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
        <Text style={{ color: colors.text }} className="font-semibold text-xl mt-4">Product not found</Text>
        <Text style={{ color: colors.textSecondary }} className="text-center mt-2">
          This product may have been removed or doesn&apos;t exist
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: colors.primary }}
          className="rounded-2xl px-6 py-3 mt-6"
          onPress={() => router.back()}
        >
          <Text style={{ color: "#121212" }} className="font-bold">Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeScreen>
  );
}

function LoadingUI() {
  const { colors } = useTheme();
  return (
    <SafeScreen>
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.textSecondary }} className="mt-4">Loading product...</Text>
      </View>
    </SafeScreen>
  );
}
