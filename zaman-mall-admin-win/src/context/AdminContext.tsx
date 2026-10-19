import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, ADMIN_EMAILS } from '../services/supabase';
import { User, Product, Order, ContactMessage, Ad } from '../types';

interface AdminContextType {
  currentUser: User | null;
  isAuthLoading: boolean;
  products: Product[];
  orders: Order[];
  messages: ContactMessage[];
  ads: Ad[];
  users: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  // Products
  addProduct: (p: Product) => Promise<void>;
  updateProduct: (p: Product) => Promise<void>;
  removeProduct: (id: string) => Promise<void>;
  // Orders
  updateOrderStatus: (id: string, status: Order['status']) => Promise<void>;
  approvePayment: (orderId: string) => Promise<void>;
  rejectPayment: (orderId: string) => Promise<void>;
  updateReturnStatus: (orderId: string, status: 'approved' | 'rejected') => Promise<void>;
  // Messages
  replyToMessage: (id: string, reply: string) => Promise<void>;
  markMessageAsRead: (id: string) => Promise<void>;
  removeMessage: (id: string) => Promise<void>;
  // Ads
  addAd: (ad: Ad) => Promise<void>;
  updateAd: (ad: Ad) => Promise<void>;
  removeAd: (id: string) => Promise<void>;
  // Tracking
  updateOrderTracking: (orderId: string, trackingNumber: string, courier: string) => Promise<void>;
  // Push to single user
  sendPushToUser: (userId: string, title: string, body: string, url?: string) => Promise<void>;
  // Refresh
  refreshAll: () => Promise<void>;
  formatPrice: (price: number) => string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

const mapOrder = (order: any): Order => {
  let items = order.items;
  if (typeof items === 'string') {
    try { items = JSON.parse(items); } catch { items = []; }
  }
  let returnRequest = order.returnRequest || order.return_request;
  if (typeof returnRequest === 'string') {
    try { returnRequest = JSON.parse(returnRequest); } catch { returnRequest = undefined; }
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
    returnRequest,
  };
};

const mapMessage = (msg: any): ContactMessage => ({
  ...msg,
  id: String(msg.id),
  userId: msg.user_id || msg.userId,
  repliedAt: msg.replied_at || msg.repliedAt,
  replyReadByUser: msg.reply_read_by_user !== undefined ? msg.reply_read_by_user : msg.replyReadByUser,
  reply: msg.reply || null,
  date: msg.date || msg.created_at,
});

const mapAd = (ad: any): Ad => ({
  id: String(ad.id),
  title: ad.title || '',
  imageUrl: ad.image || ad.imageUrl || '',
  link: ad.link || '#',
  videoUrl: ad.videoUrl || '',
  active: ad.active !== undefined ? ad.active : true,
});

const mapUser = (profile: any): User => ({
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
  verified: profile.verified,
  push_token: profile.push_token || profile.pushToken,
});

const fetchAll = async (table: string): Promise<any[]> => {
  try {
    let all: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;
    while (hasMore) {
      const res = await supabase
        .from(table)
        .select('*')
        .range(from, from + step - 1)
        .limit(step);
      if (res.error) {
        hasMore = false;
        break;
      }
      if (!res.data?.length) { hasMore = false; break; }
      all = [...all, ...res.data];
      from += step;
      if (res.data.length < step) hasMore = false;
    }
    return all;
  } catch (e) {
    return [];
  }
};

const fetchAllProducts = async (): Promise<any[]> => {
  try {
    let all: any[] = [];
    let from = 0;
    const step = 1000;
    let hasMore = true;
    while (hasMore) {
      const res = await supabase
        .from('products')
        .select('*')
        .range(from, from + step - 1);
      if (res.error) {
        hasMore = false;
        break;
      }
      if (!res.data?.length) { hasMore = false; break; }
      all = [...all, ...res.data];
      from += step;
      if (res.data.length < step) hasMore = false;
    }
    return all;
  } catch (e) {
    return [];
  }
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const formatPrice = (price: number) => `Rs. ${price.toLocaleString()}`;

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [productsData, ordersData, messagesData, adsData, usersData, reviewsData] =
        await Promise.all([
          fetchAllProducts(),
          fetchAll('orders'),
          fetchAll('messages'),
          fetchAll('ads'),
          fetchAll('profiles'),
          fetchAll('reviews'),
        ]);

      const productsWithReviews = productsData.map((p) => {
        const productReviews = reviewsData
          .filter((r: any) => r.product_id === p.id)
          .map((r: any) => ({
            id: String(r.id),
            userId: r.user_id,
            userName: r.user_name,
            avatar: r.avatar,
            rating: r.rating,
            comment: r.comment,
            date: r.created_at,
            images: r.images,
          }));
        return { ...p, reviews: productReviews, ratings: productReviews.map((r: any) => r.rating) };
      });

      setProducts(productsWithReviews as Product[]);
      setOrders(ordersData.map(mapOrder).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setMessages(messagesData.map(mapMessage).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAds(adsData.map(mapAd));
      setUsers(usersData.map(mapUser));
    } catch (err) {
      // Silent fail
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setIsAuthLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        if (profile) {
          const user = mapUser({ ...profile, email: session.user.email });
          if (ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.role === 'admin') {
            setCurrentUser({ ...user, role: 'admin' });
            await loadData();
          }
        }
      }
      setIsAuthLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!session?.user) {
        setCurrentUser(null);
        return;
      }
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      if (profile) {
        const user = mapUser({ ...profile, email: session.user.email });
        if (ADMIN_EMAILS.includes(user.email.toLowerCase()) || user.role === 'admin') {
          setCurrentUser({ ...user, role: 'admin' });
          await loadData();
        } else {
          setCurrentUser(null);
        }
      }
    });

    // Real-time subscriptions
    const sub = supabase.channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ads' }, loadData)
      .subscribe();

    return () => {
      subscription.unsubscribe();
      sub.unsubscribe();
    };
  }, [loadData]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
      if (error) throw error;
      if (!data.user) return { success: false, message: 'Login failed.' };

      const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
      const userEmail = data.user.email?.toLowerCase() || '';
      const isAdmin = ADMIN_EMAILS.includes(userEmail) || profile?.role === 'admin';

      if (!isAdmin) {
        await supabase.auth.signOut();
        return { success: false, message: 'Access denied. Admin accounts only.' };
      }

      const user = mapUser({ ...profile, email: data.user.email, role: 'admin' });
      setCurrentUser({ ...user, role: 'admin' });
      await loadData();
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e?.message || 'Login failed.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setProducts([]);
    setOrders([]);
    setMessages([]);
    setAds([]);
    setUsers([]);
  };

  const addProduct = async (p: Product) => {
    const { reviews, ratings, ...dbPayload } = p;
    const { error } = await supabase.from('products').insert([dbPayload]);
    if (error) throw error;
    await loadData();
  };

  const updateProduct = async (p: Product) => {
    const { reviews, ratings, ...dbPayload } = p;
    const { error } = await supabase.from('products').update(dbPayload).eq('id', p.id);
    if (error) throw error;
    await loadData();
  };

  const removeProduct = async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    await loadData();
  };

  const updateOrderStatus = async (id: string, status: Order['status']) => {
    const deliveredAt = status === 'delivered' ? new Date().toISOString() : null;
    let { error } = await supabase.from('orders').update({ status, delivered_at: deliveredAt }).eq('id', id);
    if (error) {
      const { error: e2 } = await supabase.from('orders').update({ status, deliveredAt }).eq('id', id);
      if (e2) throw e2;
    }

    // Send push notification to user on order status change
    try {
      const order = orders.find(o => o.id === id);
      if (order && order.userId) {
        let title = '';
        let body = '';
        const shortId = id.slice(-8).toUpperCase();

        if (status === 'shipped') {
          title = '🚚 Order Shipped!';
          body = `Good news! Your order #${shortId} has been shipped and is on its way.`;
        } else if (status === 'delivered') {
          title = '📦 Order Delivered!';
          body = `Your order #${shortId} has been successfully delivered. Thank you for shopping!`;
        } else if (status === 'cancelled') {
          title = '❌ Order Cancelled';
          body = `Your order #${shortId} has been cancelled.`;
        }

        if (title) {
          // Save to Database notifications history
          await supabase.from('notifications').insert({
            user_id: order.userId,
            title,
            body,
            type: 'order_status',
            data: { url: '/(profile)/orders' }
          });

          // Send push notification if user has token
          const user = users.find(u => u.id === order.userId);
          if (user && user.push_token) {
            const pushPayload = [{
              to: user.push_token,
              sound: 'default',
              title,
              body,
              channelId: 'zaman-mall-alerts',
              priority: 'high',
              badge: 1,
              data: { url: '/(profile)/orders' }
            }];

            await fetch('/api/expo-push', {
              method: 'POST',
              headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
              body: JSON.stringify(pushPayload),
            });
          }
        }
      }
    } catch (e) {
      // Silent fail
    }

    await loadData();
  };

  const updateReturnStatus = async (orderId: string, status: 'approved' | 'rejected') => {
    const order = orders.find((o) => o.id === orderId);
    if (!order?.returnRequest) return;
    const updatedReturn = { ...order.returnRequest, status };
    const { error } = await supabase
      .from('orders')
      .update({ returnRequest: updatedReturn, status: status === 'approved' ? 'returned' : order.status })
      .eq('id', orderId);
    if (error) throw error;
    await loadData();
  };

  const approvePayment = async (orderId: string) => {
    // Try snake_case first, then camelCase
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

    // Send push notification to user on payment approval
    try {
      const order = orders.find(o => o.id === orderId);
      if (order && order.userId) {
        const shortId = orderId.slice(-8).toUpperCase();
        const title = '🎉 Payment Approved! — Zaman Mall';
        const body = `Your payment for order #${shortId} has been successfully verified.`;

        await supabase.from('notifications').insert({
          user_id: order.userId,
          title,
          body,
          type: 'order_status',
          data: { url: '/(profile)/orders' }
        });

        const user = users.find(u => u.id === order.userId);
        if (user && user.push_token) {
          const pushPayload = [{
            to: user.push_token,
            sound: 'default',
            title,
            body,
            channelId: 'zaman-mall-alerts',
            priority: 'high',
            badge: 1,
            data: { url: '/(profile)/orders' }
          }];

          await fetch('/api/expo-push', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
            body: JSON.stringify(pushPayload),
          });
        }
      }
    } catch (e) {
      // Silent fail
    }

    await loadData();
  };

  const rejectPayment = async (orderId: string) => {
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

    // Send push notification to user on payment rejection
    try {
      const order = orders.find(o => o.id === orderId);
      if (order && order.userId) {
        const shortId = orderId.slice(-8).toUpperCase();
        const title = '❌ Payment Rejected';
        const body = `Your payment verification for order #${shortId} failed. Please re-submit or contact support.`;

        await supabase.from('notifications').insert({
          user_id: order.userId,
          title,
          body,
          type: 'order_status',
          data: { url: '/(profile)/orders' }
        });

        const user = users.find(u => u.id === order.userId);
        if (user && user.push_token) {
          const pushPayload = [{
            to: user.push_token,
            sound: 'default',
            title,
            body,
            channelId: 'zaman-mall-alerts',
            priority: 'high',
            badge: 1,
            data: { url: '/(profile)/orders' }
          }];

          await fetch('/api/expo-push', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
            body: JSON.stringify(pushPayload),
          });
        }
      }
    } catch (e) {
      // Silent fail
    }

    await loadData();
  };

  const replyToMessage = async (id: string, reply: string) => {
    const { error } = await supabase.from('messages').update({
      reply,
      replied_at: new Date().toISOString(),
      read: true,
      reply_read_by_user: false,
    }).eq('id', id);
    if (error) throw error;

    // Send push notification to user on message reply
    try {
      const msg = messages.find(m => m.id === id);
      if (msg && msg.userId) {
        const title = 'Support Reply — Zaman Mall';
        const body = `Admin: ${reply.length > 60 ? reply.substring(0, 60) + '...' : reply}`;

        await supabase.from('notifications').insert({
          user_id: msg.userId,
          title,
          body,
          type: 'support_reply',
          data: { url: '/notifications', messageId: id }
        });

        const user = users.find(u => u.id === msg.userId);
        if (user && user.push_token) {
          const pushPayload = [{
            to: user.push_token,
            sound: 'default',
            title,
            body,
            channelId: 'zaman-mall-alerts',
            priority: 'high',
            badge: 1,
            data: { source: 'support_reply', messageId: id, url: '/notifications' }
          }];

          await fetch('/api/expo-push', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Accept-Encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(pushPayload),
          });
        }
      }
    } catch (e) {
      // Silent fail
    }

    await loadData();
  };

  const markMessageAsRead = async (id: string) => {
    await supabase.from('messages').update({ read: true }).eq('id', id);
    await loadData();
  };

  const removeMessage = async (id: string) => {
    await supabase.from('messages').delete().eq('id', id);
    await loadData();
  };

  const addAd = async (ad: Ad) => {
    const payload = {
      id: crypto.randomUUID(),
      title: ad.title,
      image: ad.imageUrl,
      active: ad.active !== undefined ? ad.active : true,
    };
    const { error } = await supabase.from('ads').insert([payload]);
    if (error) throw error;

    // Send push and db notifications to all users when a new banner is added
    try {
      const activeUsers = users.filter(u => u.id);
      if (activeUsers.length > 0) {
        const notifTitle = "🔥 New Promotion Added!";
        const notifBody = `Check out our new offer: "${ad.title}"! Tap to explore.`;

        const dbInserts = activeUsers.map(u => ({
          user_id: u.id,
          title: notifTitle,
          body: notifBody,
          type: 'promotional',
          data: { url: '/(tabs)/' }
        }));

        await supabase.from('notifications').insert(dbInserts);

        const tokens = activeUsers.map(u => u.push_token || (u as any).pushToken).filter(Boolean) as string[];
        if (tokens.length > 0) {
          const chunkSize = 100;
          for (let i = 0; i < tokens.length; i += chunkSize) {
            const chunk = tokens.slice(i, i + chunkSize);
            const pushPayload = chunk.map(token => ({
              to: token,
              sound: 'default',
              title: notifTitle,
              body: notifBody,
              channelId: 'zaman-mall-alerts',
              priority: 'high',
              badge: 1,
              data: { url: '/(tabs)/', source: 'new_banner' }
            }));

            await fetch('/api/expo-push', {
              method: 'POST',
              headers: { 'Accept': 'application/json', 'Accept-Encoding': 'gzip, deflate', 'Content-Type': 'application/json' },
              body: JSON.stringify(pushPayload),
            });
          }
        }
      }
    } catch (pushErr) {
      // Silent fail
    }

    await loadData();
  };

  const updateAd = async (ad: Ad) => {
    await supabase.from('ads').update({ title: ad.title, image: ad.imageUrl, active: ad.active }).eq('id', ad.id);
    await loadData();
  };

  const removeAd = async (id: string) => {
    const { error } = await supabase.from('ads').delete().eq('id', id);
    if (error) throw error;
    await loadData();
  };

  // ── Tracking Number ────────────────────────────────────────────────────────
  const updateOrderTracking = async (orderId: string, trackingNumber: string, courier: string) => {
    // Try snake_case columns first, fall back to camelCase
    let { error } = await supabase
      .from('orders')
      .update({ tracking_number: trackingNumber, courier_name: courier })
      .eq('id', orderId);
    if (error) {
      const { error: e2 } = await supabase
        .from('orders')
        .update({ trackingNumber, courierName: courier })
        .eq('id', orderId);
      if (e2) throw e2;
    }

    // Push notification to user
    try {
      const order = orders.find(o => o.id === orderId);
      if (order?.userId && trackingNumber) {
        const shortId = orderId.slice(-8).toUpperCase();
        const title = '🚚 Tracking Update — Zaman Mall';
        const body = `Your order #${shortId} is on the way! ${courier ? courier + ' — ' : ''}Tracking: ${trackingNumber}`;

        await supabase.from('notifications').insert({
          user_id: order.userId,
          title,
          body,
          type: 'order_status',
          data: { url: '/(profile)/orders', trackingNumber, courier },
        });

        const user = users.find(u => u.id === order.userId);
        if (user?.push_token) {
          await fetch('/api/expo-push', {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify([{
              to: user.push_token,
              sound: 'default',
              title,
              body,
              channelId: 'zaman-mall-alerts',
              priority: 'high',
              badge: 1,
              data: { url: '/(profile)/orders', trackingNumber, courier },
            }]),
          });
        }
      }
    } catch { /* silent */ }

    await loadData();
  };

  // ── Send push to a single user from admin ─────────────────────────────────
  const sendPushToUser = async (userId: string, title: string, body: string, url?: string) => {
    const deepUrl = url || '/(tabs)/';

    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      body,
      type: 'promotional',
      data: { url: deepUrl },
    });

    const user = users.find(u => u.id === userId);
    if (user?.push_token) {
      await fetch('/api/expo-push', {
        method: 'POST',
        headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          to: user.push_token,
          sound: 'default',
          title,
          body,
          channelId: 'zaman-mall-alerts',
          priority: 'high',
          badge: 1,
          data: { url: deepUrl, source: 'admin_direct' },
        }]),
      });
    }
  };

  return (
    <AdminContext.Provider value={{
      currentUser, isAuthLoading, products, orders, messages, ads, users, isLoading,
      login, logout, addProduct, updateProduct, removeProduct,
      updateOrderStatus, approvePayment, rejectPayment, updateReturnStatus,
      replyToMessage, markMessageAsRead, removeMessage,
      addAd, updateAd, removeAd,
      updateOrderTracking, sendPushToUser,
      refreshAll: loadData, formatPrice,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
};


