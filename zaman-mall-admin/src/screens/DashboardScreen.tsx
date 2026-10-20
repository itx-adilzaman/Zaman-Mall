import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, PieChart } from 'react-native-gifted-charts';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { Order, Product, User, ContactMessage } from '../types';

const { width } = Dimensions.get('window');

interface Stats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  pendingOrders: number;
  pendingMessages: number;
  pendingReturns: number;
  deliveredOrders: number;
  cancelledOrders: number;
  shippedOrders: number;
  returnedOrders: number;
  avgOrderValue: number;
  deliveryRate: number;
  returnRate: number;
  categoryCounts: { label: string; value: number; frontColor: string }[];
}

const StatCard = ({ label, value, icon, color, gradient }: any) => (
  <LinearGradient colors={gradient || [colors.card, colors.surface]} style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </LinearGradient>
);

const MetricRow = ({ label, value, color }: any) => (
  <View style={styles.metricRow}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={[styles.metricValue, { color }]}>{value}</Text>
  </View>
);

export default function DashboardScreen() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });
  const toastAnim = useRef(new Animated.Value(-80)).current;

  const fetchStats = useCallback(async () => {
    try {
      const [ordersRes, productsRes, usersRes, messagesRes, lowStockRes] = await Promise.all([
        supabase.from('orders').select('*'),
        supabase.from('products').select('id, category'),
        supabase.from('profiles').select('id'),
        supabase.from('messages').select('id, read'),
        supabase.from('products').select('id, name, stock, image').lt('stock', 5).order('stock', { ascending: true }),
      ]);

      const orders: Order[] = (ordersRes.data || []).map((o: any) => ({
        ...o,
        items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
        returnRequest: typeof o.return_request === 'string'
          ? JSON.parse(o.return_request)
          : o.return_request,
        customerName: o.customer_name || o.customerName || '',
        customerPhone: o.customer_phone || o.customerPhone || '',
        customerEmail: o.customer_email || o.customerEmail || '',
        shippingAddress: o.shipping_address || o.shippingAddress || '',
        paymentMethod: o.payment_method || o.paymentMethod || 'cod',
      }));

      const validOrders = orders.filter(o => o.status !== 'cancelled');
      const totalRevenue = validOrders.reduce((acc, o) => acc + (o.total || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'pending').length;
      const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
      const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
      const returnedOrders = orders.filter(o => o.status === 'returned').length;
      const shippedOrders = orders.filter(o => o.status === 'shipped').length;
      const pendingReturns = orders.filter(o => o.returnRequest?.status === 'pending').length;
      const pendingMessages = (messagesRes.data || []).filter((m: any) => !m.read).length;
      const totalOrders = orders.length;
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const deliveryRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;
      const returnRate = totalOrders > 0 ? (returnedOrders / totalOrders) * 100 : 0;

      // Category breakdown from products
      const catColors = [colors.primary, colors.info, colors.success, colors.returned, colors.warning, colors.error, '#ec4899', '#14b8a6'];
      const catMap: Record<string, number> = {};
      (productsRes.data || []).forEach((p: any) => {
        const cat = p.category || 'Other';
        catMap[cat] = (catMap[cat] || 0) + 1;
      });
      const categoryCounts = Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .map(([label, value], i) => ({
          label: label.length > 9 ? label.slice(0, 8) + '…' : label,
          value,
          frontColor: catColors[i % catColors.length],
        }));

      setStats({
        totalRevenue,
        totalOrders,
        totalProducts: (productsRes.data || []).length,
        totalUsers: (usersRes.data || []).length,
        pendingOrders,
        pendingMessages,
        pendingReturns,
        deliveredOrders,
        cancelledOrders,
        shippedOrders,
        returnedOrders,
        avgOrderValue,
        deliveryRate,
        returnRate,
        categoryCounts,
      });

      setLowStockProducts(lowStockRes.data || []);

      // Recent 5 orders
      const sorted = [...orders].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRecentOrders(sorted.slice(0, 5));
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Show toast helper
  const showToast = useCallback((message: string) => {
    setToast({ visible: true, message });
    Animated.sequence([
      Animated.spring(toastAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
      Animated.delay(3000),
      Animated.timing(toastAnim, { toValue: -80, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast({ visible: false, message: '' }));
  }, [toastAnim]);

  // Realtime — new order toast
  useEffect(() => {
    const sub = supabase
      .channel('dashboard-orders')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const name = payload.new?.customer_name || 'Someone';
        const total = payload.new?.total || 0;
        showToast(`🛒 New order from ${name} — Rs. ${total.toLocaleString()}`);
        fetchStats();
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchStats, showToast]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return colors.warning;
      case 'shipped': return colors.info;
      case 'delivered': return colors.success;
      case 'cancelled': return colors.error;
      case 'returned': return colors.returned;
      default: return colors.textMuted;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading Dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* In-App Toast */}
      <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}
        pointerEvents="none">
        <Ionicons name="cart" size={16} color="#000" />
        <Text style={styles.toastText} numberOfLines={1}>{toast.message}</Text>
      </Animated.View>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSub}>Zaman Mall Command Center</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Alert Badges */}
      {((stats?.pendingOrders || 0) > 0 || (stats?.pendingMessages || 0) > 0) && (
        <View style={styles.alertRow}>
          {(stats?.pendingOrders || 0) > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: `${colors.warning}20`, borderColor: `${colors.warning}40` }]}>
              <Ionicons name="time-outline" size={12} color={colors.warning} />
              <Text style={[styles.alertText, { color: colors.warning }]}>
                {stats?.pendingOrders} Pending Orders
              </Text>
            </View>
          )}
          {(stats?.pendingMessages || 0) > 0 && (
            <View style={[styles.alertBadge, { backgroundColor: `${colors.info}20`, borderColor: `${colors.info}40` }]}>
              <Ionicons name="mail-unread-outline" size={12} color={colors.info} />
              <Text style={[styles.alertText, { color: colors.info }]}>
                {stats?.pendingMessages} Unread Messages
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Main Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          label="Total Revenue"
          value={`Rs. ${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon="cash-outline"
          color={colors.primary}
          gradient={['#1a1200', '#0f0a00']}
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders || 0}
          icon="cart-outline"
          color={colors.info}
          gradient={['#0a1628', '#060e1a']}
        />
        <StatCard
          label="Products"
          value={stats?.totalProducts || 0}
          icon="cube-outline"
          color={colors.success}
          gradient={['#0a1a0f', '#060f08']}
        />
        <StatCard
          label="Customers"
          value={stats?.totalUsers || 0}
          icon="people-outline"
          color="#a855f7"
          gradient={['#150a28', '#0d0618']}
        />
      </View>

      {/* Metrics Card */}
      <View style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Performance Metrics</Text>
        <MetricRow
          label="Avg Order Value"
          value={`Rs. ${(stats?.avgOrderValue || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          color={colors.primary}
        />
        <View style={styles.divider} />
        <MetricRow
          label="Delivery Rate"
          value={`${(stats?.deliveryRate || 0).toFixed(1)}%`}
          color={colors.success}
        />
        <View style={styles.divider} />
        <MetricRow
          label="Return Rate"
          value={`${(stats?.returnRate || 0).toFixed(1)}%`}
          color={colors.error}
        />
        <View style={styles.divider} />
        <MetricRow
          label="Pending Returns"
          value={stats?.pendingReturns || 0}
          color={colors.returned}
        />
        <View style={styles.divider} />
        <MetricRow
          label="Cancelled Orders"
          value={stats?.cancelledOrders || 0}
          color={colors.error}
        />
      </View>

      {/* Order Status Summary */}
      <View style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Order Status Overview</Text>
        {[
          { label: 'Pending', value: stats?.pendingOrders || 0, color: colors.warning },
          { label: 'Delivered', value: stats?.deliveredOrders || 0, color: colors.success },
          { label: 'Cancelled', value: stats?.cancelledOrders || 0, color: colors.error },
        ].map((item, i) => (
          <View key={i}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: item.color }]} />
              <Text style={styles.statusLabel}>{item.label}</Text>
              <Text style={[styles.statusValue, { color: item.color }]}>{item.value}</Text>
              <View style={styles.statusBarBg}>
                <View
                  style={[
                    styles.statusBarFill,
                    {
                      backgroundColor: item.color,
                      width: `${stats?.totalOrders ? (item.value / stats.totalOrders) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>
            {i < 2 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* Charts */}
      <View style={styles.chartsCol}>
        {/* Pie Chart — Order Status */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Order Status</Text>
          <View style={styles.pieWrapper}>
            <PieChart
              data={[
                { value: stats?.pendingOrders || 0,   color: colors.warning,  text: '' },
                { value: stats?.shippedOrders || 0,   color: colors.info,     text: '' },
                { value: stats?.deliveredOrders || 0, color: colors.success,  text: '' },
                { value: stats?.cancelledOrders || 0, color: colors.error,    text: '' },
                { value: stats?.returnedOrders || 0,  color: colors.returned, text: '' },
              ]}
              donut
              radius={70}
              innerRadius={44}
              innerCircleColor={colors.card}
              centerLabelComponent={() => (
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: '900' }}>
                    {stats?.totalOrders || 0}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 9 }}>ORDERS</Text>
                </View>
              )}
              animationDuration={800}
            />
          </View>
          <View style={styles.pieLegend}>
            {[
              { label: 'Pending',   color: colors.warning,  value: stats?.pendingOrders || 0 },
              { label: 'Shipped',   color: colors.info,     value: stats?.shippedOrders || 0 },
              { label: 'Delivered', color: colors.success,  value: stats?.deliveredOrders || 0 },
              { label: 'Cancelled', color: colors.error,    value: stats?.cancelledOrders || 0 },
              { label: 'Returned',  color: colors.returned, value: stats?.returnedOrders || 0 },
            ].map((l, i) => (
              <View key={i} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
                <Text style={[styles.legendText, { color: l.color, fontWeight: '800' }]}> {l.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bar Chart — Products by Category */}
        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Products by Category</Text>
          {(stats?.categoryCounts?.length || 0) > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              <BarChart
                data={stats!.categoryCounts}
                barWidth={36}
                spacing={18}
                roundedTop
                hideRules
                hideAxesAndRules
                noOfSections={4}
                maxValue={Math.max(...(stats?.categoryCounts?.map(c => c.value) || [1]))}
                height={140}
                width={Math.max(width - 80, (stats?.categoryCounts?.length || 1) * 56)}
                animationDuration={900}
                labelWidth={54}
                xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 9 }}
                yAxisTextStyle={{ color: colors.textMuted, fontSize: 9 }}
              />
            </ScrollView>
          ) : (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Text style={{ color: colors.textMuted, fontSize: 13 }}>No products yet</Text>
            </View>
          )}
        </View>
      </View>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <View style={styles.lowStockCard}>
          <View style={styles.lowStockHeader}>
            <View style={styles.lowStockTitleRow}>
              <Ionicons name="warning" size={16} color={colors.warning} />
              <Text style={styles.lowStockTitle}>Low Stock Alert</Text>
            </View>
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockBadgeText}>{lowStockProducts.length} items</Text>
            </View>
          </View>
          {lowStockProducts.map((p: any, i: number) => (
            <View key={p.id}>
              <View style={styles.lowStockRow}>
                <View style={[styles.stockDot, { backgroundColor: p.stock === 0 ? colors.error : colors.warning }]} />
                <Text style={styles.lowStockName} numberOfLines={1}>{p.name}</Text>
                <View style={[styles.stockPill, { backgroundColor: p.stock === 0 ? `${colors.error}20` : `${colors.warning}20` }]}>
                  <Text style={[styles.stockPillText, { color: p.stock === 0 ? colors.error : colors.warning }]}>
                    {p.stock === 0 ? 'Out of stock' : `${p.stock} left`}
                  </Text>
                </View>
              </View>
              {i < lowStockProducts.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      )}

      {/* Recent Orders */}
      <View style={styles.metricsCard}>
        <Text style={styles.sectionTitle}>Recent Orders</Text>
        {recentOrders.length === 0 ? (
          <Text style={styles.emptyText}>No orders yet</Text>
        ) : (
          recentOrders.map((order, i) => (
            <View key={order.id}>
              <View style={styles.orderRow}>
                <View style={styles.orderLeft}>
                  <Text style={styles.orderName} numberOfLines={1}>{order.customerName}</Text>
                  <Text style={styles.orderDate}>
                    {new Date(order.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.orderRight}>
                  <Text style={styles.orderAmount}>Rs. {(order.total || 0).toLocaleString()}</Text>
                  <View style={[styles.statusPill, { backgroundColor: `${getStatusColor(order.status)}20` }]}>
                    <Text style={[styles.statusPillText, { color: getStatusColor(order.status) }]}>
                      {order.status.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
              {i < recentOrders.length - 1 && <View style={styles.divider} />}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 32 },
  toast: {
    position: 'absolute',
    top: 8,
    left: 16,
    right: 16,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
  },
  toastText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  lowStockCard: {
    backgroundColor: `${colors.warning}10`,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: `${colors.warning}30`,
  },
  lowStockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  lowStockTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lowStockTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.warning,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lowStockBadge: {
    backgroundColor: `${colors.warning}25`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  lowStockBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.warning,
  },
  lowStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  lowStockName: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '600',
  },
  stockPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  stockPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertRow: { flexDirection: 'row', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  alertText: { fontSize: 11, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 44) / 2,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  statLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  metricsCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  metricLabel: { fontSize: 13, color: colors.textSecondary },
  metricValue: { fontSize: 15, fontWeight: '800' },
  divider: { height: 1, backgroundColor: colors.border },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  statusValue: { fontSize: 14, fontWeight: '800', minWidth: 30, textAlign: 'right' },
  statusBarBg: {
    flex: 2,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  statusBarFill: { height: '100%', borderRadius: 2 },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  orderLeft: { flex: 1 },
  orderName: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 3 },
  orderDate: { fontSize: 11, color: colors.textMuted },
  orderRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount: { fontSize: 14, fontWeight: '800', color: colors.primary },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  chartsCol: {
    gap: 16,
    marginBottom: 16,
  },
  chartCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  pieWrapper: {
    marginVertical: 12,
    alignItems: 'center',
  },
  pieLegend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginTop: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  emptyText: { color: colors.textMuted, textAlign: 'center', paddingVertical: 20 },
});
