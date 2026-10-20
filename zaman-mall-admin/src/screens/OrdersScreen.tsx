import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView,
  RefreshControl, Alert, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { Order, OrderStatus } from '../types';

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'shipped', 'delivered', 'cancelled', 'returned'];

const statusColor = (s: string) => {
  switch (s) {
    case 'pending': return colors.warning;
    case 'shipped': return colors.info;
    case 'delivered': return colors.success;
    case 'cancelled': return colors.error;
    case 'returned': return colors.returned;
    default: return colors.textMuted;
  }
};

const statusIcon = (s: string) => {
  switch (s) {
    case 'pending': return 'time-outline';
    case 'shipped': return 'car-outline';
    case 'delivered': return 'checkmark-circle-outline';
    case 'cancelled': return 'close-circle-outline';
    case 'returned': return 'return-down-back-outline';
    default: return 'help-circle-outline';
  }
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const mapOrder = (o: any): Order => ({
    id: String(o.id),
    userId: o.user_id || o.userId,
    items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
    total: o.total || 0,
    status: o.status || 'pending',
    date: o.date || o.created_at || new Date().toISOString(),
    deliveredAt: o.delivered_at || o.deliveredAt,
    customerName: o.customer_name || o.customerName || '',
    customerPhone: o.customer_phone || o.customerPhone || '',
    customerEmail: o.customer_email || o.customerEmail || '',
    shippingAddress: o.shipping_address || o.shippingAddress || '',
    paymentMethod: o.payment_method || o.paymentMethod || 'cod',
    returnRequest: typeof o.returnRequest === 'string'
      ? JSON.parse(o.returnRequest)
      : o.returnRequest,
  });

  const fetchOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*');
      if (error) throw error;
      setOrders((data || []).map(mapOrder));
    } catch (err) {
      console.error('Orders fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const filtered = orders.filter(o => {
    const matchSearch =
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    setUpdatingStatus(true);
    try {
      const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status } : null);
      }
      Alert.alert('Success', `Order status updated to ${status}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => setSelectedOrder(item)} style={styles.orderCard} activeOpacity={0.8}>
      <View style={styles.orderCardTop}>
        <View style={styles.orderCardLeft}>
          <Text style={styles.orderCustomer} numberOfLines={1}>{item.customerName}</Text>
          <Text style={styles.orderId} numberOfLines={1}>#{item.id.slice(-8).toUpperCase()}</Text>
        </View>
        <View style={styles.orderCardRight}>
          <Text style={styles.orderAmount}>Rs. {(item.total || 0).toLocaleString()}</Text>
          <View style={[styles.statusPill, { backgroundColor: `${statusColor(item.status)}20` }]}>
            <Ionicons name={statusIcon(item.status) as any} size={10} color={statusColor(item.status)} />
            <Text style={[styles.statusPillText, { color: statusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.orderCardBottom}>
        <Ionicons name="call-outline" size={12} color={colors.textMuted} />
        <Text style={styles.orderPhone}>{item.customerPhone}</Text>
        <Text style={styles.orderDot}>•</Text>
        <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
        <Text style={styles.orderDate}>
          {new Date(item.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
        </Text>
        <Text style={styles.orderDot}>•</Text>
        <Text style={styles.orderItems}>{item.items?.length || 0} items</Text>
      </View>
      {item.returnRequest && (
        <View style={styles.returnBadge}>
          <Ionicons name="return-down-back-outline" size={10} color={colors.returned} />
          <Text style={styles.returnBadgeText}>Return: {item.returnRequest.status}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Orders</Text>
          <Text style={styles.subtitle}>{filtered.length} orders</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, phone, ID..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        {(['all', ...STATUS_OPTIONS] as const).map(s => {
          const active = statusFilter === s;
          const chipColor = s === 'all' ? colors.primary : statusColor(s);
          return (
            <TouchableOpacity
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[styles.filterChip, active && { backgroundColor: `${chipColor}20`, borderColor: `${chipColor}50` }]}
            >
              <Text style={[styles.filterChipText, active && { color: chipColor }]} numberOfLines={1}>
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchOrders(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cart-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No orders found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Order Detail Modal */}
      <Modal visible={!!selectedOrder} animationType="slide" presentationStyle="pageSheet">
        {selectedOrder && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setSelectedOrder(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Order ID & Status */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Order Info</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order ID</Text>
                  <Text style={styles.detailValue}>#{selectedOrder.id.slice(-12).toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedOrder.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment</Text>
                  <Text style={styles.detailValue}>{selectedOrder.paymentMethod?.toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Total</Text>
                  <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '800' }]}>
                    Rs. {(selectedOrder.total || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Customer Info */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Customer</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selectedOrder.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{selectedOrder.customerPhone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{selectedOrder.customerEmail}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {selectedOrder.shippingAddress}
                  </Text>
                </View>
              </View>

              {/* Items */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Items ({selectedOrder.items?.length || 0})</Text>
                {(selectedOrder.items || []).map((item, i) => (
                  <View key={i} style={styles.itemCard}>
                    {item.image ? (
                      <Image source={{ uri: item.image }} style={styles.itemImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.itemImage, styles.itemImagePlaceholder]}>
                        <Ionicons name="cube-outline" size={20} color={colors.textMuted} />
                      </View>
                    )}
                    <View style={styles.itemDetails}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      {item.category && (
                        <Text style={styles.itemMeta}>Category: {item.category}</Text>
                      )}
                      {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                        <Text style={styles.itemMeta}>
                          {Object.entries(item.selectedVariants).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                        </Text>
                      )}
                      <View style={styles.itemPriceRow}>
                        <Text style={styles.itemUnitPrice}>Rs. {(item.price || 0).toLocaleString()} × {item.quantity}</Text>
                        <Text style={styles.itemTotal}>Rs. {((item.price || 0) * item.quantity).toLocaleString()}</Text>
                      </View>
                    </View>
                  </View>
                ))}
                <View style={styles.itemsSummary}>
                  <Text style={styles.itemsSummaryLabel}>Order Total</Text>
                  <Text style={styles.itemsSummaryValue}>Rs. {(selectedOrder.total || 0).toLocaleString()}</Text>
                </View>
              </View>

              {/* Return Request */}
              {selectedOrder.returnRequest && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Return Request</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <Text style={[styles.detailValue, { color: statusColor(selectedOrder.returnRequest.status) }]}>
                      {selectedOrder.returnRequest.status.toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Reason</Text>
                    <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]}>
                      {selectedOrder.returnRequest.reason}
                    </Text>
                  </View>
                </View>
              )}

              {/* Update Status */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Update Status</Text>
                <View style={styles.statusGrid}>
                  {STATUS_OPTIONS.map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => updateStatus(selectedOrder.id, s)}
                      disabled={updatingStatus || selectedOrder.status === s}
                      style={[
                        styles.statusBtn,
                        { borderColor: `${statusColor(s)}50` },
                        selectedOrder.status === s && { backgroundColor: `${statusColor(s)}20` },
                      ]}
                    >
                      <Ionicons name={statusIcon(s) as any} size={14} color={statusColor(s)} />
                      <Text style={[styles.statusBtnText, { color: statusColor(s) }]}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </Text>
                      {selectedOrder.status === s && (
                        <Ionicons name="checkmark" size={12} color={statusColor(s)} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                {updatingStatus && <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { padding: 16, paddingTop: 8 },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  searchRow: { paddingHorizontal: 16, marginBottom: 10 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontSize: 14 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 6,
  },
  filterChip: {
    flex: 1,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipText: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  orderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  orderCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderCardLeft: { flex: 1 },
  orderCustomer: { fontSize: 15, fontWeight: '700', color: colors.text },
  orderId: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  orderCardRight: { alignItems: 'flex-end', gap: 4 },
  orderAmount: { fontSize: 15, fontWeight: '800', color: colors.primary },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  orderCardBottom: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  orderPhone: { fontSize: 11, color: colors.textMuted },
  orderDot: { color: colors.textMuted, fontSize: 10 },
  orderDate: { fontSize: 11, color: colors.textMuted },
  orderItems: { fontSize: 11, color: colors.textMuted },
  returnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${colors.returned}15`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  returnBadgeText: { fontSize: 10, color: colors.returned, fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  // Modal
  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalBody: { flex: 1, padding: 16 },
  detailSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 13, color: colors.textMuted },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: '600' },
  itemCard: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  itemImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    gap: 3,
  },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.text },
  itemMeta: { fontSize: 11, color: colors.textSecondary },
  itemPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemUnitPrice: { fontSize: 12, color: colors.text },
  itemTotal: { fontSize: 14, fontWeight: '800', color: colors.primary },
  itemsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    marginTop: 4,
  },
  itemsSummaryLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  itemsSummaryValue: { fontSize: 16, fontWeight: '900', color: colors.primary },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: colors.surface,
  },
  statusBtnText: { fontSize: 12, fontWeight: '700' },
});
