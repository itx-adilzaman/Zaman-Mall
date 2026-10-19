import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Product, CartItem, Order, Review, User, ContactMessage, Ad, Address, ReturnRequest } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ADS } from '../constants';
import { supabase, isSupabaseEnabled as initialSupabaseEnabled } from '../services/supabase';
import { sendOrderEmail, logOrderForEmail } from '../services/emailService.ts';
import { loginWithOAuth as loginWithOAuthService } from '../services/oauthService.ts';
import { sendCustomerEmail } from '../services/customerNotifications.ts';
import { sendContactFormEmail, sendNewUserSignupEmail, sendWelcomeEmailToUser } from '../services/contactNotification.ts';
import { sendPushNotification } from '../services/pushNotificationService.ts';
import { signInWithOAuth, handleOAuthCallback as handleSupabaseOAuthCallback } from '../services/supabaseOAuth.ts';
import { rateLimitHandler } from '../services/rateLimitHandler.ts';
import { useCountrySession } from '../contexts/CountrySessionContext';

// Alert context for global access
let globalShowAlert: ((type: 'success' | 'error' | 'warning' | 'info', title: string, message?: string, duration?: number, hasDownloadButton?: boolean) => string) | null = null;

export const formatPrice = (pkr: number) => {
  return `Rs. ${pkr.toLocaleString()}`;
};

export const setGlobalAlert = (showAlert: typeof globalShowAlert) => {
  globalShowAlert = showAlert;
};

interface StoreContextType {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  messages: ContactMessage[];
  ads: Ad[];
  addresses: Address[];
  favorites: string[];
  currentUser: User | null;
  users: User[];
  isDbLoading: boolean;
  isAuthLoading: boolean;
  isAiOpen: boolean;
  setIsAiOpen: (open: boolean) => void;
  setCurrentUser: (user: User | null) => void;
  addToCart: (product: Product, selectedVariants?: Record<string, string>, variantPrice?: number) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateCartQuantity: (cartItemId: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleFavorite: (productId: string) => Promise<void>;
  addProduct: (product: Product) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  addAd: (ad: Ad) => Promise<void>;
  updateAd: (ad: Ad) => Promise<void>;
  removeAd: (id: string) => Promise<void>;
  addAddress: (address: Omit<Address, 'id' | 'userId'>) => Promise<void>;
  removeAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  addRating: (productId: string, rating: number) => Promise<void>;
  addReview: (productId: string, review: Omit<Review, 'id' | 'date'>) => Promise<void>;
  addMessage: (message: Omit<ContactMessage, 'id' | 'date' | 'read' | 'replyReadByUser'>) => Promise<void>;
  replyToMessage: (id: string, reply: string) => Promise<void>;
  markMessageAsRead: (id: string) => Promise<void>;
  markReplyAsRead: (id: string) => Promise<void>;
  removeMessage: (id: string) => Promise<void>;
  placeOrder: (details: { name: string, phone: string, email: string, address: string }, finalTotal: number, paymentMethod?: 'cod' | 'easypaisa' | 'jazzcash', paymentReceiptUrl?: string, onSuccess?: () => void) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  approvePayment: (orderId: string) => Promise<void>;
  rejectPayment: (orderId: string) => Promise<void>;
  requestReturn: (orderId: string, reason: string) => Promise<void>;
  updateReturnStatus: (orderId: string, status: 'approved' | 'rejected') => Promise<void>;
  cancelOrder: (orderId: string) => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean, message?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean, message?: string }>;
  loginWithOAuth: (provider: 'google' | 'microsoft' | 'github' | 'facebook', code: string) => Promise<{ success: boolean, message?: string }>;
  logout: () => void;
  updateProfile: (updatedData: Partial<User>) => Promise<void>;
  totalCartPrice: number;
  showProfileSetup: boolean;
  setShowProfileSetup: (show: boolean) => void;
  formatPrice: (pkr: number) => string;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const ADMIN_EMAILS = [
  'admin@zamansons.com',
  'admin@zaman.com',
  'malikmuhammadadilzaman@gmail.com',
  'malikzaman0987@gmail.com',
  'admin@terminal.com',
  'admin@admin.com'
];

export const StoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentSession } = useCountrySession();
  const [products, setProducts] = useState<Product[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isDbLoading, setIsDbLoading] = useState(true);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isSupabaseAvailable, setIsSupabaseAvailable] = useState(initialSupabaseEnabled);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  // Filter products based on current country session
  const filteredProducts = useMemo(() => {
    if (!currentSession) return products;
    return products.filter(product => {
      // If product has no country field, default to pakistan for backward compatibility
      const productCountry = product.country || 'pakistan';
      return productCountry === currentSession;
    });
  }, [products, currentSession]);

  // Simple UUID generator for compatibility across all environments
  const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const mapMessage = useCallback((msg: any): ContactMessage => {
    return {
      ...msg,
      id: String(msg.id),
      userId: msg.user_id || msg.userId,
      repliedAt: msg.replied_at || msg.repliedAt,
      replyReadByUser: msg.reply_read_by_user !== undefined ? msg.reply_read_by_user : msg.replyReadByUser,
      reply: msg.reply || null,
      date: msg.date || msg.created_at
    };
  }, []);

  const mapAd = useCallback((ad: any): Ad => ({
    id: String(ad.id),
    title: ad.title || '',
    // Prioritize DB 'image' column, fall back to 'imageUrl' if from local/legacy
    imageUrl: ad.image || ad.imageUrl || '',
    link: ad.link || '#',
    videoUrl: ad.videoUrl || '',
    active: ad.active !== undefined ? ad.active : true
  }), []);

  const mapOrder = useCallback((order: any): Order => {
    // Parse items if it's a string (JSONB from Supabase)
    let items = order.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        console.error("Failed to parse order items:", e);
        items = [];
      }
    }

    // Parse returnRequest if it's a string (JSONB from Supabase)
    let returnRequest = order.returnRequest || order.return_request;
    if (typeof returnRequest === 'string') {
      try {
        returnRequest = JSON.parse(returnRequest);
      } catch (e) {
        returnRequest = undefined;
      }
    }

    return {
      id: String(order.id),
      userId: order.user_id || order.userId,
      items: items || [],
      total: order.total || 0,
      status: order.status || 'pending',
      date: order.date || order.created_at || new Date().toISOString(),
      deliveredAt: order.delivered_at || order.deliveredAt,
      customerName: order.customer_name || order.customerName || '',
      customerPhone: order.customer_phone || order.customerPhone || '',
      customerEmail: order.customer_email || order.customerEmail || '',
      shippingAddress: order.shipping_address || order.shippingAddress || '',
      paymentMethod: order.payment_method || order.paymentMethod || 'cod',
      paymentStatus: order.payment_status || order.paymentStatus,
      paymentReceiptUrl: order.payment_receipt_url || order.paymentReceiptUrl,
      returnRequest: returnRequest
    };
  }, []);

  const mapCartItem = useCallback((item: any): CartItem => ({
    ...item,
    id: item.id,
    name: item.name,
    price: item.price,
    image: item.image,
    quantity: item.quantity,
    baseProductId: item.base_product_id || item.baseProductId,
    selectedVariants: item.selected_variants || item.selectedVariants,
    userId: item.user_id || item.userId,
    category: item.category,
    country: item.country
  }), []);

  const mapUser = useCallback((profile: any): User => ({
    id: profile.id,
    email: profile.email || '',
    name: profile.full_name || profile.name || '',
    role: profile.role || 'user',
    avatar: profile.avatar_url || profile.avatar || '',
    bio: profile.bio || '',
    location: profile.location || '',
    joinedDate: profile.created_at || profile.joinedDate || new Date().toISOString(),
    phone: profile.phone || '',
    address: profile.address || '',
    provider: profile.provider,
    isOAuthUser: !!profile.provider,
    verified: profile.verified
  }), []);

  const refreshCart = useCallback(async (uid: string) => {
    if (!isSupabaseAvailable || !uid) return;
    try {
      const { data, error } = await supabase.from('cart').select('*').eq('user_id', uid);
      if (!error) {
        setCart((data || []).map(mapCartItem));
        return;
      }
      const { data: data2 } = await supabase.from('cart').select('*').eq('userId', uid);
      setCart((data2 || []).map(mapCartItem));
    } catch (err) {
      console.error("[Cart] Refresh error:", err);
    }
  }, [isSupabaseAvailable, mapCartItem]);

  const syncUserData = useCallback(async (userId: string, email: string) => {
    if (!isSupabaseAvailable || !userId) return;

    const defaultUser: User = {
      id: userId,
      email: email,
      name: email.split('@')[0],
      role: ADMIN_EMAILS.includes(email.toLowerCase()) ? 'admin' : 'user',
      joinedDate: new Date().toISOString()
    };

    try {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (!profile) {
        setCurrentUser(defaultUser);
        await supabase.from('profiles').upsert([defaultUser]);
      } else {
        setCurrentUser(profile as any);
      }

      // Helper for robust fetching across different column naming conventions
      const fetchWithFallback = async (table: string, userCol1: string, userCol2: string, id: string, select: string = '*') => {
        console.log(`[Supabase Debug] Fetching from ${table} for user ${id}`);
        // Try first convention
        const { data, error } = await supabase.from(table).select(select).eq(userCol1, id);
        if (!error) {
          console.log(`[Supabase Debug] ${table} fetch success with ${userCol1}:`, data?.length, "items");
          return data;
        }
        
        // If first fails, try second
        console.warn(`[Supabase Debug] ${table} fetch with ${userCol1} failed:`, error, `trying ${userCol2}`);
        const { data: data2, error: error2 } = await supabase.from(table).select(select).eq(userCol2, id);
        if (!error2) {
          console.log(`[Supabase Debug] ${table} fetch success with ${userCol2}:`, data2?.length, "items");
          return data2;
        }
        
        console.error(`[Supabase Debug] ${table} fetch failed for both ${userCol1} and ${userCol2}:`, error2);
        return [];
      };

      const [cartData, favData, addrData] = await Promise.all([
        fetchWithFallback('cart', 'user_id', 'userId', userId),
        fetchWithFallback('favorites', 'user_id', 'userId', userId),
        fetchWithFallback('addresses', 'user_id', 'userId', userId)
      ]);

      setCart((cartData || []).map(mapCartItem));
      setFavorites((favData || []).map((fav: any) => fav.product_id || fav.productId).filter(Boolean));
      setAddresses((addrData || []).map((addr: any) => ({
        id: addr.id,
        userId: addr.user_id || addr.userId,
        label: addr.label,
        fullName: addr.full_name || addr.fullName,
        phone: addr.phone,
        streetAddress: addr.street_address || addr.streetAddress,
        city: addr.city,
        province: addr.province,
        district: addr.district,
        tehsil: addr.tehsil,
        isDefault: addr.is_default || addr.isDefault
      })));
    } catch (err) {
      console.error("[Auth] Sync error:", err);
      setCurrentUser(defaultUser);
    }
  }, [isSupabaseAvailable]);

  const fetchAllData = async (table: string): Promise<{ data: any[] | null, error: any | null }> => {
    try {
      let allData: any[] = [];
      let from = 0;
      const step = 1000;
      let hasMore = true;
      let lastError = null;

      while (hasMore) {
        const res = await supabase.from(table).select('*').range(from, from + step - 1);
        if (res.error) {
          lastError = res.error;
          break;
        }
        if (res.data && res.data.length > 0) {
          allData = [...allData, ...res.data];
          from += step;
          if (res.data.length < step) hasMore = false;
        } else {
          hasMore = false;
        }
        if (from > 100000) break; // Hard limit for safety
      }
      return { data: lastError ? null : allData, error: lastError };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  useEffect(() => {
    const initStore = async () => {
      try {
        if (!isSupabaseAvailable) {
          setProducts(INITIAL_PRODUCTS || []);
          setAds(INITIAL_ADS || []);
          setIsDbLoading(false);
          return;
        }

        const selectWithRetry = async (table: string, tries = 3, delayMs = 600): Promise<{ data: any[] | null, error: any | null }> => {
          let lastErr: any = null;
          for (let i = 0; i < tries; i++) {
            const res = await fetchAllData(table);
            if (!res.error) return res;
            lastErr = res.error;
            await new Promise(r => setTimeout(r, delayMs * (i + 1)));
          }
          return { data: null, error: lastErr };
        };

        // 1. Fetch Session & Public Data First
        const [sRes, pRes, aRes, reviewsRes] = await Promise.all([
          supabase.auth.getSession(),
          selectWithRetry('products'),
          selectWithRetry('ads'),
          selectWithRetry('reviews')
        ]);

        // Process Public Data
        if (pRes.data) {
          const allReviews = (reviewsRes as any).data || [];
          const productsData = (pRes.data as any[]).map(p => {
            const productReviews = allReviews
              .filter((r: any) => r.product_id === p.id)
              .map((r: any) => ({
                id: String(r.id),
                userId: r.user_id,
                userName: r.user_name,
                avatar: r.avatar,
                rating: r.rating,
                comment: r.comment,
                date: r.created_at,
                images: r.images
              }));

            const ratings = productReviews.map((r: any) => r.rating);
            return {
              ...p,
              reviews: productReviews,
              ratings: ratings.length > 0 ? ratings : p.ratings
            };
          });
          setProducts(productsData.length > 0 ? (productsData as Product[]) : INITIAL_PRODUCTS);
        } else {
          setProducts(INITIAL_PRODUCTS || []);
          setIsSupabaseAvailable(false);
        }
        if ((aRes as any).data) setAds(((aRes as any).data.length > 0 ? (aRes as any).data.map(mapAd) : INITIAL_ADS));

        // 2. Fetch User-Specific Data (Orders, Messages, Profile) ONLY if Logged In
        if (sRes.data?.session?.user) {
          const userId = sRes.data.session.user.id;

          await syncUserData(userId, sRes.data.session.user.email || '');

          const [oRes, mRes, uRes] = await Promise.all([
            fetchAllData('orders'),
            fetchAllData('messages'),
            fetchAllData('profiles')
          ]);

          if (oRes.data) setOrders((oRes.data || []).map(mapOrder));
          if (mRes.data) setMessages((mRes.data || []).map(mapMessage));
          if (uRes.data) setUsers(uRes.data as any || []);
        }

      } catch (err) {
        console.error("[Store] Fatal Init Error:", err);
        setProducts(INITIAL_PRODUCTS || []);
        setAds(INITIAL_ADS || []);
      } finally {
        setIsDbLoading(false);
      }
    };

    initStore();

    // Subscriptions for real-time updates
    const productsSub = supabase.channel('products-all').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
      try {
        const { data, error } = await fetchAllData('products');
        if (!error && data) setProducts(data as Product[]);
      } catch (err) {
        console.error("Real-time products refresh failed:", err);
      }
    }).subscribe();

    const ordersSub = supabase.channel('orders-all').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
      try {
        const { data, error } = await fetchAllData('orders');
        if (!error && data) setOrders(data.map(mapOrder));
      } catch (err) {
        console.error("Real-time orders refresh failed:", err);
      }
    }).subscribe();

    const adsSub = supabase.channel('ads-all').on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, async () => {
      try {
        const { data, error } = await fetchAllData('ads');
        if (!error && data) setAds(data.map(mapAd));
      } catch (err) {
        console.error("Real-time ads refresh failed:", err);
      }
    }).subscribe();

    const messagesSub = supabase.channel('messages-all').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, async () => {
      try {
        const { data, error } = await fetchAllData('messages');
        if (!error && data) setMessages(data.map(mapMessage));
      } catch (err) {
        console.error("Real-time messages refresh failed:", err);
      }
    }).subscribe();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        syncUserData(session.user.id, session.user.email || '');
      } else {
        setCurrentUser(null);
        setCart([]);
        setFavorites([]);
      }
    });

    return () => {
      productsSub.unsubscribe();
      ordersSub.unsubscribe();
      adsSub.unsubscribe();
      messagesSub.unsubscribe();
      authSub.unsubscribe();
    };
  }, [isSupabaseAvailable, mapMessage, mapOrder, syncUserData]);

  const login = async (email: string, password: string) => {
    setIsAuthLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      if (data.user) await syncUserData(data.user.id, data.user.email || '');
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || "Login failed." };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsAuthLoading(true);
    try {
      // Use enhanced rate limit handler
      const { canAttempt, cooldownRemaining } = rateLimitHandler.canAttemptSignup();

      if (!canAttempt) {
        return {
          success: false,
          message: `Please wait ${cooldownRemaining} seconds before trying again.`,
          cooldownRemaining
        };
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: { data: { name } }
      });

      if (error) {
        // Use rate limit handler to check and handle rate limit errors
        if (rateLimitHandler.isRateLimitError(error)) {
          const rateLimitResponse = rateLimitHandler.handleRateLimit();
          return {
            success: false,
            message: rateLimitResponse.message,
            cooldownRemaining: rateLimitResponse.cooldownRemaining
          };
        }
        throw error;
      }

      if (data.user) {
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
        await supabase.from('profiles').upsert([{
          id: data.user.id,
          email: email.toLowerCase(),
          name,
          role: isAdmin ? 'admin' : 'user',
          joinedDate: new Date().toISOString()
        }]);

        // Create user object for email notifications using Supabase data
        const newUser = {
          id: data.user?.id || '',
          email: email.toLowerCase(), // Use original user email
          name: data.user?.user_metadata?.name || name, // Use Supabase metadata name first
          role: (isAdmin ? 'admin' : 'user') as 'admin' | 'user',
          joinedDate: new Date().toISOString()
        };

        // Send email notifications with rate limiting and better error handling
        const sendEmailsWithDelay = async () => {
          try {
            // Debug logging to verify email addresses
            console.log('📧 Email Debug - User Data:', {
              supabaseEmail: data.user?.email,
              formEmail: email.toLowerCase(),
              finalEmail: newUser.email,
              userName: newUser.name
            });

            // Send admin notification first using Web3Forms
            await sendNewUserSignupEmail(newUser);
            console.log('✅ New user signup email sent successfully');

            // DISABLED: Welcome email to user (only admin gets notifications)
            // await new Promise(resolve => setTimeout(resolve, 3000));
            // await sendWelcomeEmailToUser(newUser);
            // console.log('✅ Welcome email sent successfully');

          } catch (error: any) {
            console.log('⚠️ Email notification error:', error?.message || 'Unknown error');
            // Don't fail the registration, just log the error
          }
        };

        // Send emails asynchronously without blocking registration
        sendEmailsWithDelay();
      }

      // Show profile setup modal after successful registration
      setShowProfileSetup(true);

      return {
        success: true,
        message: "Account created successfully! Please complete your profile."
      };
    } catch (e: any) {
      // Use rate limit handler for any caught errors
      if (rateLimitHandler.isRateLimitError(e)) {
        const rateLimitResponse = rateLimitHandler.handleRateLimit();
        return {
          success: false,
          message: rateLimitResponse.message,
          cooldownRemaining: rateLimitResponse.cooldownRemaining
        };
      }

      return { success: false, message: e?.message || "Registration failed." };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const loginWithOAuth = async (provider: 'google' | 'microsoft' | 'github' | 'facebook') => {
    setIsAuthLoading(true);
    try {
      // Use Supabase OAuth directly
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('Supabase OAuth error:', error);
        return { success: false, message: error.message || "OAuth login failed." };
      }

      // Supabase handles the redirect automatically
      return { success: true, message: "OAuth login initiated successfully." };
    } catch (e: any) {
      console.error('OAuth login error:', e);
      return { success: false, message: e?.message || "OAuth login failed." };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setCart([]);
    setFavorites([]);
  };

  const addToCart = async (product: Product, variants?: Record<string, string>, variantPrice?: number) => {
    console.log("[Cart Debug] Attempting to add to cart:", product.name);
    if (!currentUser) {
      console.warn("[Cart Debug] No user logged in");
      if (globalShowAlert) globalShowAlert('warning', 'Login Required', 'Please login to add items to cart.');
      return;
    }
    if (!isSupabaseAvailable) {
      console.error("[Cart Debug] Supabase not available");
      return;
    }

    // Use variant price if provided, otherwise base price
    const effectivePrice = variantPrice ?? product.price;

    try {
      const variantHash = variants ? btoa(JSON.stringify(variants)) : 'base';
      const cartId = `${currentUser.id}_${product.id}_${variantHash}`;
      console.log("[Cart Debug] Generated cartId:", cartId);

      // More robust check for existing item - try by ID first, then by user+product combination
      let { data: existing, error: checkError } = await supabase.from('cart').select('*').eq('id', cartId).maybeSingle();
      
      if (checkError) {
        console.warn("[Cart Debug] ID check failed, trying user+product check:", checkError.message);
        // Try user_id + base_product_id
        const { data: existing2, error: checkError2 } = await supabase.from('cart')
          .select('*')
          .or(`user_id.eq.${currentUser.id},userId.eq.${currentUser.id}`)
          .or(`base_product_id.eq.${product.id},baseProductId.eq.${product.id},productId.eq.${product.id}`)
          .maybeSingle();
        
        if (!checkError2) existing = existing2;
        else console.error("[Cart Debug] All existence checks failed:", checkError2);
      }

      if (existing) {
        console.log("[Cart Debug] Item exists, updating quantity:", (existing.quantity || 0) + 1);
        const { error: updateError } = await supabase.from('cart').update({ quantity: (existing.quantity || 0) + 1 }).eq('id', existing.id);
        if (updateError) {
          console.error("[Cart Debug] Update failed:", updateError);
          throw updateError;
        }
        if (globalShowAlert) {
          globalShowAlert('success', 'Cart Updated!', `${product.name} quantity increased to ${(existing.quantity || 0) + 1}`);
        }
      } else {
        console.log("[Cart Debug] New item, inserting...");
        const cartItemBase: any = {
          id: cartId,
          name: product.name,
          price: effectivePrice,
          image: product.image,
          category: product.category,
          quantity: 1,
        };
        
        // Helper to try insert with different column naming combinations
        const tryInsert = async (uid: string) => {
          // List of common variations for user and product foreign keys
          const variations = [
            { user_id: uid, base_product_id: product.id, selected_variants: variants || {} },
            { userId: uid, baseProductId: product.id, selectedVariants: variants || {} },
            { user_id: uid, baseProductId: product.id, selectedVariants: variants || {} },
            { userId: uid, base_product_id: product.id, selected_variants: variants || {} },
            { user_id: uid, productId: product.id, selected_variants: variants || {} },
            { userId: uid, productId: product.id, selectedVariants: variants || {} }
          ];

          // We'll try each variation with 'country' first, then without if it fails
          for (const variation of variations) {
            // 1. Try with country
            const { error: errorWithCountry } = await supabase.from('cart').insert([{ 
              ...cartItemBase, 
              ...variation, 
              country: product.country || 'pakistan' 
            }]);
            
            if (!errorWithCountry) return null;
            
            // If the error is specifically about the 'country' column missing, try without it
            if (errorWithCountry.message?.includes("column \"country\" of relation \"cart\" does not exist") || 
                errorWithCountry.message?.includes("could not find the 'country' column")) {
              console.warn(`[Cart Debug] 'country' column missing, trying without it for variation:`, variation);
              const { error: errorWithoutCountry } = await supabase.from('cart').insert([{ 
                ...cartItemBase, 
                ...variation 
              }]);
              if (!errorWithoutCountry) return null;
              console.error(`[Cart Debug] Variation failed even without country:`, errorWithoutCountry.message);
            } else {
              console.warn(`[Cart Debug] Variation failed (likely column naming):`, errorWithCountry.message);
            }
          }
          return new Error("Could not insert into cart with any known column naming convention.");
        };

        const error = await tryInsert(currentUser.id);
        if (error) throw error;

        if (globalShowAlert) {
          globalShowAlert('success', 'Added to Cart!', `${product.name} has been added to your cart successfully.`);
        }
      }

      await refreshCart(currentUser.id);
    } catch (error: any) {
      console.error('[Cart Debug] Fatal error in addToCart:', error);
      if (globalShowAlert) {
        globalShowAlert('error', 'Failed to Add to Cart', error?.message || 'Please try again later.');
      }
    }
  };

  const removeFromCart = async (id: string) => {
    if (!currentUser || !isSupabaseAvailable) return;
    try {
      await supabase.from('cart').delete().eq('id', id);
      await refreshCart(currentUser.id);
      if (globalShowAlert) {
        globalShowAlert('success', 'Removed from Cart', 'Item has been removed from your cart.');
      }
    } catch (error) {
      console.error('Remove from cart error:', error);
      if (globalShowAlert) {
        globalShowAlert('error', 'Failed to Remove', 'Could not remove item from cart.');
      }
    }
  };

  const updateCartQuantity = async (id: string, delta: number) => {
    if (!currentUser || !isSupabaseAvailable) return;
    try {
      const { data: item } = await supabase.from('cart').select('*').eq('id', id).maybeSingle();
      if (item) {
        const newQty = Math.max(1, (item.quantity || 0) + delta);
        await supabase.from('cart').update({ quantity: newQty }).eq('id', id);
        await refreshCart(currentUser.id);
        if (globalShowAlert) {
          globalShowAlert('success', 'Quantity Updated', `Item quantity updated to ${newQty}.`);
        }
      }
    } catch (error) {
      console.error('Update quantity error:', error);
      if (globalShowAlert) {
        globalShowAlert('error', 'Failed to Update', 'Could not update item quantity.');
      }
    }
  };

  const clearCart = async () => {
    if (!currentUser || !isSupabaseAvailable) return;
    try {
      const { error } = await supabase.from('cart').delete().eq('user_id', currentUser.id);
      if (error) {
        await supabase.from('cart').delete().eq('userId', currentUser.id);
      }
      setCart([]);
      if (globalShowAlert) {
        globalShowAlert('success', 'Cart Cleared', 'All items have been removed from your cart.');
      }
    } catch (error) {
      console.error('Clear cart error:', error);
      if (globalShowAlert) {
        globalShowAlert('error', 'Failed to Clear Cart', 'Could not clear your cart.');
      }
    }
  };

  // Silent version — only deletes from DB, does NOT touch React state.
  // Cart state is cleared by the caller after setting isOrdered=true.
  const clearCartSilent = () => {
    if (!currentUser || !isSupabaseAvailable) return;
    supabase.from('cart').delete().eq('user_id', currentUser.id).then(({ error }) => {
      if (error) {
        supabase.from('cart').delete().eq('userId', currentUser.id).catch(() => {});
      }
    }).catch(() => {});
  };

  const resolveProductIdFromCartItem = (item: any): string | null => {
    const direct = item.baseProductId || item.base_product_id;
    if (direct) return String(direct);

    const byId = products.find(p => String(p.id) === String(item.id));
    if (byId) return String(byId.id);

    const byName = products.find(p => p.name === item.name);
    if (byName) return String(byName.id);

    return null;
  };

  const placeOrder = async (details: any, total: number, paymentMethod: 'cod' | 'easypaisa' | 'jazzcash' = 'cod', paymentReceiptUrl?: string, onSuccess?: () => void) => {
    if (!currentUser || !isSupabaseAvailable) throw new Error('Not available');
    if (!cart.length) throw new Error('Cart is empty');

    const productQuantity: Record<string, number> = {};
    cart.forEach(item => {
      const productId = resolveProductIdFromCartItem(item);
      if (!productId) return;
      const qty = item.quantity || 0;
      if (!qty) return;
      productQuantity[productId] = (productQuantity[productId] || 0) + qty;
    });

    const productIds = Object.keys(productQuantity);
    if (!productIds.length) throw new Error('No valid products');

    const isOnlinePayment = paymentMethod === 'easypaisa' || paymentMethod === 'jazzcash';
    const paymentStatus = isOnlinePayment
      ? (paymentReceiptUrl ? 'awaiting_approval' : 'pending')
      : 'paid';

    try {
      // ── 1. Stock check ────────────────────────────────────
      const { data: productRows, error: productError } = await supabase
        .from('products')
        .select('id, stock, name')
        .in('id', productIds);

      if (productError || !productRows) {
        if (globalShowAlert) globalShowAlert('error', 'Stock Check Failed', 'Unable to verify stock. Please try again.');
        throw new Error('Stock check failed');
      }

      const insufficient: string[] = [];
      productRows.forEach(p => {
        const required = productQuantity[String(p.id)] || 0;
        if (((p as any).stock ?? 0) < required) insufficient.push((p as any).name || p.id);
      });

      if (insufficient.length > 0) {
        if (globalShowAlert) globalShowAlert('warning', 'Insufficient Stock', `Not enough stock for: ${insufficient.join(', ')}`);
        throw new Error('Insufficient stock');
      }

      // ── 2. Decrement stock ──────────────────────────────
      await Promise.all(
        productRows.map(async p => {
          const required = productQuantity[String(p.id)] || 0;
          const { error: rpcError } = await supabase.rpc('decrement_stock', { product_id: p.id, quantity: required });
          if (!rpcError) return;
          const newStock = ((p as any).stock ?? 0) - required;
          await supabase.from('products').update({ stock: newStock }).eq('id', p.id);
        })
      );

      // ── 3. Build order ────────────────────────────────────
      const orderId = `ZS-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      const newOrder: Order = {
        id: orderId,
        userId: currentUser.id,
        items: cart,
        total,
        status: 'pending',
        date: new Date().toISOString(),
        customerName: details.name,
        customerPhone: details.phone,
        customerEmail: details.email,
        shippingAddress: details.address,
        paymentMethod,
        paymentStatus,
        paymentReceiptUrl: paymentReceiptUrl || undefined,
      };

      // ── 4. Insert — camelCase (DB confirmed camelCase) ────
      // Try with new payment columns first, fall back without them
      const base = {
        id: newOrder.id,
        items: newOrder.items,
        total: newOrder.total,
        status: newOrder.status,
        date: newOrder.date,
        userId: newOrder.userId,
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        customerEmail: newOrder.customerEmail,
        shippingAddress: newOrder.shippingAddress,
        paymentMethod: newOrder.paymentMethod,
      };

      let inserted = false;

      // Try 1: camelCase + new payment columns (camelCase names)
      {
        const { error } = await supabase.from('orders').insert([{
          ...base,
          paymentStatus: paymentStatus,
          paymentReceiptUrl: paymentReceiptUrl || null,
        }]);
        if (!error) inserted = true;
        else console.warn('[Order] Try 1 failed:', error.message);
      }

      // Try 2: camelCase + new payment columns (snake_case names)
      if (!inserted) {
        const { error } = await supabase.from('orders').insert([{
          ...base,
          payment_status: paymentStatus,
          payment_receipt_url: paymentReceiptUrl || null,
        }]);
        if (!error) inserted = true;
        else console.warn('[Order] Try 2 failed:', error.message);
      }

      // Try 3: camelCase only (no new columns — works if migration not run)
      if (!inserted) {
        const { error } = await supabase.from('orders').insert([base]);
        if (!error) inserted = true;
        else console.warn('[Order] Try 3 failed:', error.message);
      }

      // Try 4: snake_case + new columns
      if (!inserted) {
        const { error } = await supabase.from('orders').insert([{
          id: newOrder.id, items: newOrder.items, total: newOrder.total,
          status: newOrder.status, date: newOrder.date,
          user_id: newOrder.userId,
          customer_name: newOrder.customerName, customer_phone: newOrder.customerPhone,
          customer_email: newOrder.customerEmail, shipping_address: newOrder.shippingAddress,
          payment_method: newOrder.paymentMethod,
          payment_status: paymentStatus, payment_receipt_url: paymentReceiptUrl || null,
        }]);
        if (!error) inserted = true;
        else console.warn('[Order] Try 4 failed:', error.message);
      }

      // Try 5: snake_case only
      if (!inserted) {
        const { error } = await supabase.from('orders').insert([{
          id: newOrder.id, items: newOrder.items, total: newOrder.total,
          status: newOrder.status, date: newOrder.date,
          user_id: newOrder.userId,
          customer_name: newOrder.customerName, customer_phone: newOrder.customerPhone,
          customer_email: newOrder.customerEmail, shipping_address: newOrder.shippingAddress,
          payment_method: newOrder.paymentMethod,
        }]);
        if (!error) inserted = true;
        else console.warn('[Order] Try 5 failed:', error.message);
      }

      if (!inserted) {
        if (globalShowAlert) globalShowAlert('error', 'Order Failed', 'Could not save order. Check your internet and try again.');
        throw new Error('All insert attempts failed');
      }

      // ── 5. Save receipt URL via UPDATE (safe — non-fatal) ─
      if (paymentReceiptUrl && inserted) {
        const { error: u1 } = await supabase
          .from('orders').update({ paymentStatus, paymentReceiptUrl })
          .eq('id', orderId);
        if (u1) {
          await supabase.from('orders')
            .update({ payment_status: paymentStatus, payment_receipt_url: paymentReceiptUrl })
            .eq('id', orderId);
        }
      }

      // ── 6. Notify ─────────────────────────────────────────
      logOrderForEmail(newOrder);
      sendOrderEmail(newOrder).catch(() => {});
      sendCustomerEmail(newOrder).catch(() => {});

      if (isOnlinePayment) {
        if (paymentReceiptUrl) {
          if (globalShowAlert) globalShowAlert('success', 'Order Placed!', `Order ID: ${newOrder.id}. Receipt submitted — awaiting approval.`);
        } else {
          if (globalShowAlert) globalShowAlert('info', 'Order Pending', `Order ID: ${newOrder.id}. Upload receipt to complete.`);
        }
      } else {
        if (globalShowAlert) globalShowAlert('success', 'Order Placed!', `Order ID: ${newOrder.id}. Confirmation sent shortly.`);
      }

      // ── 7. Update local orders state immediately (no need to wait for realtime) ──
      setOrders(prev => [newOrder, ...prev]);

      // ── 8. Call success callback (navigates to confirmation screen) ──────────
      onSuccess?.();

      // ── 9. Clear cart from DB silently ────────────────────
      clearCartSilent();

    } catch (err) {
      // Re-throw so Cart.tsx catches it and stays on the cart page
      throw err;
    }
  };

  const restockOrderItems = async (order: Order) => {
    if (!isSupabaseAvailable) return;
    if (!order.items || !order.items.length) return;

    const productQuantity: Record<string, number> = {};
    order.items.forEach(item => {
      const productId = resolveProductIdFromCartItem(item);
      if (!productId) return;
      const qty = item.quantity || 0;
      if (!qty) return;
      productQuantity[productId] = (productQuantity[productId] || 0) + qty;
    });

    const productIds = Object.keys(productQuantity);
    if (!productIds.length) return;

    try {
      const { data: productRows, error } = await supabase
        .from('products')
        .select('id, stock')
        .in('id', productIds);

      if (error || !productRows) {
        console.error("Restock load failed:", error);
        return;
      }

      await Promise.all(
        productRows.map(async p => {
          const id = String(p.id);
          const qty = productQuantity[id] || 0;

          // Try RPC first
          const { error: rpcError } = await supabase.rpc('increment_stock', {
            product_id: p.id,
            quantity: qty
          });

          if (!rpcError) return;

          // Fallback to direct update
          console.warn("RPC failed, trying direct update:", rpcError);
          const currentStock = (p as any).stock ?? 0;
          const newStock = currentStock + qty;
          return supabase.from('products').update({ stock: newStock }).eq('id', p.id);
        })
      );
    } catch (err) {
      console.error("Restock failed:", err);
    }
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    if (!isSupabaseAvailable) return;
    const existing = orders.find(o => o.id === id);

    try {
      const deliveredAt = status === 'delivered' ? new Date().toISOString() : null;
      
      // Try both naming conventions for status update
      let { error } = await supabase
        .from('orders')
        .update({ status, delivered_at: deliveredAt })
        .eq('id', id);
        
      if (error) {
        console.warn("[Order Status] Update with delivered_at failed, trying deliveredAt:", error.message);
        const { error: error2 } = await supabase
          .from('orders')
          .update({ status, deliveredAt: deliveredAt })
          .eq('id', id);
        
        if (error2) {
          console.error("[Order Status] All update variations failed:", error2);
          throw error2;
        }
      }

      if (
        existing &&
        (status === 'cancelled' || status === 'returned') &&
        existing.status !== 'cancelled' &&
        existing.status !== 'returned'
      ) {
        await restockOrderItems(existing);
      }
    } catch (err) {
      console.error("Order status update failed:", err);
    }
  };

  const cancelOrder = async (id: string) => {
    await updateOrderStatus(id, 'cancelled');
  };

  const approvePayment = async (orderId: string) => {
    if (!isSupabaseAvailable) return;
    try {
      // Set paymentStatus = 'approved' AND keep order status = 'pending'
      // (order is now active — ready to be processed)
      let { error } = await supabase
        .from('orders')
        .update({ payment_status: 'approved' })
        .eq('id', orderId);

      if (error) {
        const { error: e2 } = await supabase
          .from('orders')
          .update({ paymentStatus: 'approved' })
          .eq('id', orderId);
        if (e2) throw e2;
      }

      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, paymentStatus: 'approved' } : o)
      );

      if (globalShowAlert) {
        globalShowAlert('success', 'Payment Approved', `Order ${orderId} — payment approved. Order is now active.`);
      }
    } catch (err) {
      console.error('Payment approval failed:', err);
      if (globalShowAlert) {
        globalShowAlert('error', 'Approval Failed', 'Could not approve payment. Please try again.');
      }
    }
  };

  const rejectPayment = async (orderId: string) => {
    if (!isSupabaseAvailable) return;
    try {
      let { error } = await supabase
        .from('orders')
        .update({ payment_status: 'rejected' })
        .eq('id', orderId);

      if (error) {
        const { error: e2 } = await supabase
          .from('orders')
          .update({ paymentStatus: 'rejected' })
          .eq('id', orderId);
        if (e2) throw e2;
      }

      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, paymentStatus: 'rejected' } : o)
      );

      if (globalShowAlert) {
        globalShowAlert('warning', 'Payment Rejected', `Order ${orderId} payment has been rejected.`);
      }
    } catch (err) {
      console.error('Payment rejection failed:', err);
      if (globalShowAlert) {
        globalShowAlert('error', 'Rejection Failed', 'Could not reject payment. Please try again.');
      }
    }
  };

  const toggleFavorite = async (productId: string) => {
    if (!currentUser || !isSupabaseAvailable) return;
    try {
      const isFav = favorites.includes(productId);
      const product = products.find(p => String(p.id) === String(productId));
      const productName = product ? product.name : 'Item';

      if (isFav) {
        // Try both naming conventions for delete
        let { error: err1 } = await supabase.from('favorites').delete().eq('user_id', currentUser.id).eq('product_id', productId);
        if (err1) {
          err1 = (await supabase.from('favorites').delete().eq('userId', currentUser.id).eq('productId', productId)).error;
        }
        if (err1) {
          // One more try with mixed convention just in case
          err1 = (await supabase.from('favorites').delete().eq('user_id', currentUser.id).eq('productId', productId)).error;
        }

        setFavorites(prev => prev.filter(id => id !== productId));
        if (globalShowAlert) {
          globalShowAlert('success', 'Removed from Wishlist', `${productName} has been removed from your wishlist.`);
        }
      } else {
        // Try to insert with both to be safe
        const { error } = await supabase.from('favorites').insert([{ user_id: currentUser.id, product_id: productId }]);

        if (error) {
          // Fallback for userId/productId
          const { error: error2 } = await supabase.from('favorites').insert([{ userId: currentUser.id, productId }]);
          if (error2) {
            // Mixed fallback
            await supabase.from('favorites').insert([{ user_id: currentUser.id, productId }]);
          }
        }

        setFavorites(prev => [...prev, productId]);
        if (globalShowAlert) {
          globalShowAlert('success', 'Added to Wishlist!', `${productName} has been added to your wishlist successfully.`);
        }
      }
    } catch (error) {
      console.error('Toggle favorite error:', error);
      if (globalShowAlert) {
        globalShowAlert('error', 'Failed to Update Wishlist', 'Please try again later.');
      }
    }
  };

  const addAd = async (ad: Ad) => {
    if (isSupabaseAvailable) {
      // Schema Adaptation: Map frontend fields to DB columns
      // DB columns: id (uuid), title, image, active, created_at
      // Frontend: imageUrl, link, videoUrl (ignore if not in DB)

      const payload = {
        id: generateUUID(),
        title: ad.title,
        image: (ad as any).imageUrl || (ad as any).image, // Map imageUrl to image, cast to any to avoid TS error
        active: ad.active !== undefined ? ad.active : true,
        // link: ad.link, // Remove if DB doesn't have it
        // videoUrl: ad.videoUrl // Remove if DB doesn't have it
      };

      const { error } = await supabase.from('ads').insert([payload]);
      if (error) {
        console.error("Failed to add banner:", error);
        alert("Failed to add banner. Permission denied or System Error.");
      }
    }
  };

  const updateAd = async (ad: Ad) => {
    if (isSupabaseAvailable) {
      const payload = {
        title: ad.title,
        image: (ad as any).imageUrl || (ad as any).image,
        active: ad.active
      };
      await supabase.from('ads').update(payload).eq('id', ad.id);
    }
  };

  const removeAd = async (id: string) => {
    if (isSupabaseAvailable) {
      console.log('Deleting ad:', id);
      const { error } = await supabase.from('ads').delete().eq('id', id);
      if (error) {
        console.error('Failed to delete ad from Supabase:', error);
        throw error;
      }
      // Refresh ads from database
      const { data: updatedAds } = await supabase.from('ads').select('*');
      if (updatedAds) {
        setAds(updatedAds.map(mapAd));
      }
    } else {
      // Fallback for local state
      setAds(prev => prev.filter(ad => ad.id !== id));
    }
  };

  const addMessage = async (msg: any) => {
    const payload = {
      id: generateUUID(),
      user_id: currentUser?.id || null,
      name: msg.name,
      email: msg.email,
      subject: msg.subject,
      message: msg.message,
      date: new Date().toISOString(),
      read: false,
      reply_read_by_user: true
    };
    if (isSupabaseAvailable) await supabase.from('messages').insert([payload]);
    else setMessages(prev => [mapMessage(payload), ...prev]);

    // Send email notification to admin
    sendContactFormEmail(payload).catch(() => {
      console.log('Contact form email not sent, but message saved');
    });
  };

  const replyToMessage = async (id: string, reply: string) => {
    if (isSupabaseAvailable) {
      // 1. Fetch message details to get user_id and subject
      const { data: messageData } = await supabase
        .from('messages')
        .select('user_id, subject')
        .eq('id', id)
        .single();

      // 2. Update message with reply
      const { error } = await supabase.from('messages').update({
        reply,
        replied_at: new Date().toISOString(),
        read: true,
        reply_read_by_user: false
      }).eq('id', id);

      if (error) {
        console.error("Failed to reply to message:", error);
        alert("Failed to send reply. Please check console.");
        return;
      }

      // 3. Send Push Notification to user
      if (messageData?.user_id) {
        // Fetch push token from profiles
        const { data: profileData } = await supabase
          .from('profiles')
          .select('push_token')
          .eq('id', messageData.user_id)
          .single();

        if (profileData?.push_token) {
          await sendPushNotification(
            profileData.push_token,
            "Zaman Mall Support Reply 📧",
            `Admin replied to: "${messageData.subject}"`,
            { messageId: id, type: 'support_reply' }
          );
        }
      }
    }
  };

  const markMessageAsRead = async (id: string) => {
    if (isSupabaseAvailable) await supabase.from('messages').update({ read: true }).eq('id', id);
  };

  const markReplyAsRead = async (id: string) => {
    if (isSupabaseAvailable) await supabase.from('messages').update({ reply_read_by_user: true }).eq('id', id);
  };

  const removeMessage = async (id: string) => {
    if (isSupabaseAvailable) await supabase.from('messages').delete().eq('id', id);
  };

  const updateProfile = async (data: Partial<User>) => {
    if (currentUser && isSupabaseAvailable) {
      await supabase.from('profiles').update(data).eq('id', currentUser.id);
      setCurrentUser({ ...currentUser, ...data });
    }
  };

  const addProduct = async (p: Product) => {
    if (isSupabaseAvailable) {
      const { reviews, ratings, ...dbPayload } = p;
      const { error } = await supabase.from('products').insert([dbPayload]);
      if (error) {
        console.error('Failed to add product:', error);
        throw error;
      }
      // Refresh products from database using pagination for unlimited scaling
      const { data: updatedProducts } = await fetchAllData('products');
      if (updatedProducts) {
        setProducts(updatedProducts as Product[]);
      }
    }
  };

  const updateProduct = async (p: Product) => {
    if (isSupabaseAvailable) {
      const { reviews, ratings, ...dbPayload } = p;
      console.log('Updating product:', p.id, dbPayload);
      const { error } = await supabase.from('products').update(dbPayload).eq('id', p.id);
      if (error) {
        console.error('Failed to update product:', error);
        throw error;
      }
      // Refresh products from database using pagination for unlimited scaling
      const { data: updatedProducts } = await fetchAllData('products');
      if (updatedProducts) {
        setProducts(updatedProducts as Product[]);
      }
    }
  };

  const removeProduct = async (id: string) => {
    if (isSupabaseAvailable) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) {
        console.error('Failed to remove product:', error);
        throw error;
      }
      // Refresh products from database using pagination for unlimited scaling
      const { data: updatedProducts } = await fetchAllData('products');
      if (updatedProducts) {
        setProducts(updatedProducts as Product[]);
      }
    }
  };

  const addAddress = async (addr: Omit<Address, 'id' | 'userId'>) => {
    if (!currentUser || !isSupabaseAvailable) {
      console.warn("[Store] Cannot add address: User not logged in or Supabase not available");
      if (globalShowAlert) globalShowAlert('error', 'Action Denied', 'Please log in to save addresses.');
      return;
    }

    const addressId = Math.random().toString(36).substr(2, 9);

    // Using strict snake_case to match standard Postgres/Supabase tables
    const payload = {
      id: addressId,
      user_id: currentUser.id,
      label: addr.label,
      full_name: addr.fullName,
      phone: addr.phone,
      street_address: addr.streetAddress,
      city: addr.city,
      province: addr.province,
      district: addr.district,
      tehsil: addr.tehsil,
      is_default: addr.isDefault
    };

    try {
      if (addr.isDefault) {
        // Reset other defaults using snake_case
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', currentUser.id);
      }

      const { error } = await supabase.from('addresses').insert([payload]);

      if (error) {
        console.error("[Store] Supabase Address Save Error:", error);
        if (globalShowAlert) globalShowAlert('error', 'Save Failed', error.message);
        throw error;
      }

      const { data: addrs, error: fetchError } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', currentUser.id);

      if (!fetchError && addrs) {
        setAddresses(addrs.map(a => ({
          id: String(a.id),
          userId: a.user_id,
          label: a.label,
          fullName: a.full_name,
          phone: a.phone,
          streetAddress: a.street_address,
          city: a.city,
          province: a.province,
          district: a.district,
          tehsil: a.tehsil,
          isDefault: a.is_default || false
        })));

        if (globalShowAlert) globalShowAlert('success', 'Node Provisioned', 'Shipping coordinate saved successfully.');
      }
    } catch (err: any) {
      console.error("[Store] Fatal Address Error:", err);
    }
  };

  const removeAddress = async (id: string) => {
    if (!currentUser || !isSupabaseAvailable) return;
    await supabase.from('addresses').delete().eq('id', id);
    const { data: addrs } = await supabase.from('addresses').select('*').eq('user_id', currentUser.id);
    setAddresses((addrs || []).map(a => ({
      id: a.id,
      userId: a.user_id,
      label: a.label,
      fullName: a.full_name,
      phone: a.phone,
      streetAddress: a.street_address,
      city: a.city,
      province: a.province,
      district: a.district,
      tehsil: a.tehsil,
      isDefault: a.is_default
    })));
  };

  const setDefaultAddress = async (id: string) => {
    if (!currentUser || !isSupabaseAvailable) return;
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', currentUser.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    const { data: addrs } = await supabase.from('addresses').select('*').eq('user_id', currentUser.id);
    setAddresses((addrs || []).map(a => ({
      id: a.id,
      userId: a.user_id,
      label: a.label,
      fullName: a.full_name,
      phone: a.phone,
      streetAddress: a.street_address,
      city: a.city,
      province: a.province,
      district: a.district,
      tehsil: a.tehsil,
      isDefault: a.is_default
    })));
  };

  const addReview = async (productId: string, review: Omit<Review, 'id' | 'date'>) => {
    if (!isSupabaseAvailable || !currentUser) return;
    const localReview = { ...review, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), userId: currentUser.id, userName: review.userName || currentUser.name, avatar: currentUser.avatar || '', images: review.images || [] };
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, reviews: [...(p.reviews || []), localReview], ratings: [...(p.ratings || []), review.rating] } : p));
    await supabase.from('reviews').insert([{ product_id: productId, user_id: currentUser.id, user_name: localReview.userName, avatar: localReview.avatar, rating: review.rating, comment: review.comment, images: review.images || [], created_at: localReview.date }]);
  };

  const requestReturn = async (orderId: string, reason: string) => {
    if (!isSupabaseAvailable || !currentUser) {
      console.error("Cannot request return: Supabase not available or user not logged in");
      return;
    }

    const returnReq = { reason, status: 'pending', requestedAt: new Date().toISOString() };
    console.log("🔵 Requesting return - Order ID:", orderId, "Return Request:", returnReq);

    try {
      // First, verify the order exists and belongs to the current user
      const { data: existingOrder, error: checkError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      console.log("🔵 Order check - exists:", existingOrder, "error:", checkError);

      if (checkError || !existingOrder) {
        console.error("❌ Order not found:", checkError);
        throw new Error("Order not found");
      }

      // Verify the order belongs to the current user (for RLS policy compatibility)
      const orderUserId = existingOrder.userId || existingOrder.user_id;
      if (orderUserId !== currentUser.id) {
        console.error("❌ Order does not belong to current user");
        throw new Error("Unauthorized: Order does not belong to you");
      }

      console.log("🔵 Updating order with returnRequest:", returnReq);

      const performReturnUpdate = async () => {
        // Direct update to specific column to minimize RLS friction
        const { data, error } = await supabase
          .from('orders')
          .update({ returnRequest: returnReq } as any) // Match camelCase DB column
          .eq('id', orderId)
          .select();

        return { data, error };
      };

      const { data: updateData, error: updateError } = await performReturnUpdate();

      if (updateError) {
        console.error("Return update failed:", updateError);
        alert("Failed to submit return request. Please try again.");
        throw updateError;
      }

      console.log("🔵 Update response - data:", updateData, "data length:", updateData?.length, "error:", updateError);

      if (updateError) {
        console.error("❌ Failed to update order return request:", updateError);
        console.error("❌ Error details:", JSON.stringify(updateError, null, 2));
        throw updateError;
      }

      // Check if update actually affected any rows (RLS policy might have blocked it)
      if (!updateData || updateData.length === 0) {
        console.error("❌ Update did not affect any rows - possible RLS policy issue");
        console.error("❌ This usually means Row Level Security (RLS) policies are blocking the update");
        console.error("❌ Please check RLS policies for the 'orders' table in Supabase dashboard");
        throw new Error("Update failed: No rows were updated. Please check RLS policies.");
      }

      console.log("✅ Update completed successfully, affected rows:", updateData.length);
      console.log("✅ Updated order data:", updateData[0]);

      // Refresh all orders from database to ensure consistency
      const { data: updatedOrders, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .order('date', { ascending: false });

      console.log("🔵 Refresh - orders count:", updatedOrders?.length, "error:", fetchError);

      if (fetchError) {
        console.error("❌ Failed to fetch updated orders:", fetchError);
        // Fallback to local state update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, returnRequest: returnReq } as Order : o));
      } else if (updatedOrders) {
        console.log("✅ Orders refreshed successfully");
        const updatedOrder = updatedOrders.find(o => o.id === orderId);
        console.log("🔵 Updated order after refresh:", updatedOrder);
        setOrders(updatedOrders.map(mapOrder));
      } else {
        console.warn("⚠️ No orders returned, using fallback");
        // Fallback to local state update
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, returnRequest: returnReq } as Order : o));
      }
    } catch (error) {
      console.error("❌ Return request failed:", error);
      throw error;
    }
  };

  const updateReturnStatus = async (orderId: string, status: 'approved' | 'rejected') => {
    if (!isSupabaseAvailable) return;
    const order = orders.find(o => o.id === orderId);
    if (order?.returnRequest) {
      const updatedReturn = { ...order.returnRequest, status };

      try {
        const performStatusUpdate = async () => {
          const primary = await supabase
            .from('orders')
            .update({ returnRequest: updatedReturn, status: status === 'approved' ? 'returned' : order.status })
            .eq('id', orderId)
            .select();

          const message = primary.error?.message?.toLowerCase() || '';
          if (primary.error && message.includes('returnrequest')) {
            const fallback = await supabase
              .from('orders')
              .update({ return_request: updatedReturn, status: status === 'approved' ? 'returned' : order.status })
              .eq('id', orderId)
              .select();
            return fallback;
          }

          return primary;
        };

        const { data: updateData, error: updateError } = await performStatusUpdate();

        if (updateError) {
          console.error("Failed to update return status:", updateError);
          throw updateError;
        }

        try {
          const messageContent = status === 'approved'
            ? `Your return request for Order #${orderId} has been APPROVED. Please prepare the package for pickup.`
            : `Your return request for Order #${orderId} has been REJECTED. Reason: Does not meet return policy criteria.`;

          const notification = {
            id: crypto.randomUUID(),
            user_id: order.userId,
            name: "System Admin",
            email: "admin@zamansons.com", // System sender
            subject: `Return Request ${status.toUpperCase()} - Order #${orderId}`,
            message: messageContent,
            date: new Date().toISOString(),
            read: false,
            reply_read_by_user: false // Force user to see it as new
          };

          await supabase.from('messages').insert([notification]);
        } catch (msgError) {
          console.error("Failed to send return notification:", msgError);
        }

        if (status === 'approved') {
          await restockOrderItems(order as Order);
        }

        const { data: updatedOrders, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .order('date', { ascending: false });

        if (fetchError) {
          console.error("Failed to fetch updated orders:", fetchError);
          // Fallback to local state update
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, returnRequest: updatedReturn, status: status === 'approved' ? 'returned' : o.status } : o));
        } else if (updatedOrders) {
          setOrders(updatedOrders.map(mapOrder));
        } else {
          // Fallback to local state update
          setOrders(prev => prev.map(o => o.id === orderId ? { ...o, returnRequest: updatedReturn, status: status === 'approved' ? 'returned' : o.status } : o));
        }
      } catch (error) {
        console.error("Return status update failed:", error);
        throw error;
      }
    }
  };

  const totalCartPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <StoreContext.Provider value={{
      products: products, // Provide ALL products to the context
      filteredProducts, // Keep this for existing consumers if needed, though we can just rename the provided products
      cart, orders, messages, ads, favorites, currentUser, users,
      isDbLoading, isAuthLoading, isAiOpen, setIsAiOpen, setCurrentUser, addresses,
      addToCart, removeFromCart, updateCartQuantity, clearCart,
      toggleFavorite, addProduct, updateProduct, removeProduct, addAd, updateAd, removeAd,
      addRating: async () => { }, addReview, addMessage, replyToMessage, markMessageAsRead, markReplyAsRead, removeMessage, placeOrder,
      addAddress, removeAddress, setDefaultAddress,
      updateOrderStatus, requestReturn, updateReturnStatus, cancelOrder, approvePayment, rejectPayment,
      login, register, loginWithOAuth, logout, updateProfile, totalCartPrice, showProfileSetup, setShowProfileSetup,
      formatPrice
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within a StoreProvider");
  return context;
};
