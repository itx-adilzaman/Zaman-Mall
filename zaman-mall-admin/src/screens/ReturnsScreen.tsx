import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Modal, ScrollView, RefreshControl, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { Order } from '../types';

export default function ReturnsScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);

  const mapOrder = (o: any): Order => ({
    id: String(o.id),
    userId: o.user_id || o.userId,
    items: typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []),
    total: o.total || 0,
    status: o.status || 'pending',
    date: o.date || o.created_at || new Date().toISOString(),
    customerName: o.customer_name || o.customerName || '',
    customerPhone: o.customer_phone || o.customerPhone || '',
    customerEmail: o.customer_email || o.customerEmail || '',
    shippingAddress: o.shipping_address || o.shippingAddress || '',
    paymentMethod: o.payment_method || o.paymentMethod || 'cod',
    returnRequest: typeof o.returnRequest === 'string'
      ? JSON.parse(o.returnRequest)
      : o.returnRequest,
  });

  const fetchReturns = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .not('returnRequest', 'is', null);
      if (error) throw error;
      const withReturns = (data || []).map(mapOrder).filter(o => o.returnRequest);
      setOrders(withReturns);
    } catch (err) {
      console.error('Returns fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const updateReturnStatus = async (orderId: string, status: 'approved' | 'rejected') => {
    setUpdating(true);
    try {
      const order = orders.find(o => o.id === orderId);
      if (!order?.returnRequest) return;

      const updatedReturn = { ...order.returnRequest, status };
      const { error } = await supabase
        .from('orders')
        .update({
          returnRequest: updatedReturn,
          status: status === 'approved' ? 'returned' : order.status,
        })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(o =>
        o.id === orderId
          ? { ...o, returnRequest: updatedReturn, status: status === 'approved' ? 'returned' : o.status }
          : o
      ));
      if (selected?.id === orderId) {
        setSelected(prev => prev ? {
          ...prev,
          returnRequest: updatedReturn,
          status: status === 'approved' ? 'returned' : prev.status,
        } : null);
      }
      Alert.alert('Success', `Return request ${status}!`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update return status');
    } finally {
      setUpdating(false);
    }
  };

  const returnStatusColor = (s: string) => {
    switch (s) {
      case 'pending': return colors.warning;
      case 'approved': return colors.success;
      case 'rejected': return colors.error;
      default: return colors.textMuted;
    }
  };

  const pendingCount = orders.filter(o => o.returnRequest?.status === 'pending').length;

  const renderReturn = ({ item }: { item: Order }) => (
    <TouchableOpacity onPress={() => setSelected(item)} style={styles.returnCard} activeOpacity={0.8}>
      <View style={styles.returnTop}>
        <View style={styles.returnLeft}>
          <Text style={styles.returnCustomer}>{item.customerName}</Text>
          <Text style={styles.returnId}>#{item.id.slice(-8).toUpperCase()}</Text>
        </View>
        <View style={[styles.returnStatusBadge, { backgroundColor: `${returnStatusColor(item.returnRequest?.status || '')}20` }]}>
          <Text style={[styles.returnStatusText, { color: returnStatusColor(item.returnRequest?.status || '') }]}>
            {(item.returnRequest?.status || '').toUpperCase()}
          </Text>
        </View>
      </View>
      <Text style={styles.returnReason} numberOfLines={2}>
        Reason: {item.returnRequest?.reason || 'No reason provided'}
      </Text>
      <View style={styles.returnMeta}>
        <Text style={styles.returnAmount}>Rs. {(item.total || 0).toLocaleString()}</Text>
        <Text style={styles.returnDate}>
          {new Date(item.returnRequest?.requestedAt || item.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Returns</Text>
          <Text style={styles.subtitle}>
            {pendingCount > 0 ? `${pendingCount} pending` : `${orders.length} total`}
          </Text>
        </View>
        {pendingCount > 0 && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>{pendingCount} Pending</Text>
          </View>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id}
          renderItem={renderReturn}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReturns(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="return-down-back-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No return requests</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Return Request</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Status */}
              <View style={[styles.statusCard, { borderColor: `${returnStatusColor(selected.returnRequest?.status || '')}40` }]}>
                <Text style={styles.statusCardLabel}>Return Status</Text>
                <Text style={[styles.statusCardValue, { color: returnStatusColor(selected.returnRequest?.status || '') }]}>
                  {(selected.returnRequest?.status || '').toUpperCase()}
                </Text>
              </View>

              {/* Customer */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Customer Info</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Name</Text>
                  <Text style={styles.detailValue}>{selected.customerName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{selected.customerPhone}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email</Text>
                  <Text style={styles.detailValue} numberOfLines={1}>{selected.customerEmail}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Address</Text>
                  <Text style={[styles.detailValue, { flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {selected.shippingAddress}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Payment</Text>
                  <Text style={styles.detailValue}>{selected.paymentMethod?.toUpperCase()}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Order Date</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selected.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </Text>
                </View>
                <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.detailLabel}>Order Total</Text>
                  <Text style={[styles.detailValue, { color: colors.primary, fontWeight: '800' }]}>
                    Rs. {(selected.total || 0).toLocaleString()}
                  </Text>
                </View>
              </View>

              {/* Return Reason */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Return Reason</Text>
                <Text style={styles.reasonText}>{selected.returnRequest?.reason || 'No reason provided'}</Text>
                {selected.returnRequest?.requestedAt && (
                  <Text style={styles.requestedAt}>
                    Requested: {new Date(selected.returnRequest.requestedAt).toLocaleDateString('en-PK', {
                      day: '2-digit', month: 'long', year: 'numeric',
                    })}
                  </Text>
                )}
              </View>

              {/* Items */}
              <View style={styles.detailSection}>
                <Text style={styles.sectionTitle}>Order Items ({selected.items?.length || 0})</Text>
                {(selected.items || []).map((item, i) => (
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
                  <Text style={styles.itemsSummaryValue}>Rs. {(selected.total || 0).toLocaleString()}</Text>
                </View>
              </View>

              {/* Actions */}
              {selected.returnRequest?.status === 'pending' && (
                <View style={styles.actionSection}>
                  <Text style={styles.sectionTitle}>Take Action</Text>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity
                      onPress={() => updateReturnStatus(selected.id, 'approved')}
                      disabled={updating}
                      style={styles.approveBtn}
                    >
                      <LinearGradient colors={[colors.success, '#16a34a']} style={styles.actionBtnGrad}>
                        <Ionicons name="checkmark-circle" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Approve Return</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => updateReturnStatus(selected.id, 'rejected')}
                      disabled={updating}
                      style={styles.rejectBtn}
                    >
                      <LinearGradient colors={[colors.error, '#dc2626']} style={styles.actionBtnGrad}>
                        <Ionicons name="close-circle" size={18} color="#fff" />
                        <Text style={styles.actionBtnText}>Reject Return</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                  {updating && <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />}
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pendingBadge: {
    backgroundColor: `${colors.warning}20`,
    borderWidth: 1,
    borderColor: `${colors.warning}40`,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingBadgeText: { fontSize: 12, fontWeight: '700', color: colors.warning },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  returnCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  returnTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  returnLeft: {},
  returnCustomer: { fontSize: 15, fontWeight: '700', color: colors.text },
  returnId: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  returnStatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  returnStatusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  returnReason: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  returnMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  returnAmount: { fontSize: 14, fontWeight: '800', color: colors.primary },
  returnDate: { fontSize: 12, color: colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  modalTitle: { flex: 1, fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  modalBody: { flex: 1, padding: 16 },
  statusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  statusCardLabel: { fontSize: 13, color: colors.textMuted },
  statusCardValue: { fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },
  detailSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
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
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: { fontSize: 13, color: colors.textMuted },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: '600' },
  reasonText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  requestedAt: { fontSize: 11, color: colors.textMuted, marginTop: 8 },
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
  actionSection: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionBtns: { gap: 10 },
  approveBtn: { borderRadius: 14, overflow: 'hidden' },
  rejectBtn: { borderRadius: 14, overflow: 'hidden' },
  actionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
  },
  actionBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
