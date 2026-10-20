import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView,
  RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { User } from '../types';
import { ADMIN_EMAILS } from '../lib/supabase';

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<User | null>(null);
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const mapUser = (p: any): User => ({
    id: p.id,
    email: p.email || '',
    name: p.full_name || p.name || p.email?.split('@')[0] || 'Unknown',
    role: ADMIN_EMAILS.includes((p.email || '').toLowerCase()) ? 'admin' : (p.role || 'user'),
    avatar: p.avatar_url || p.avatar || '',
    bio: p.bio || '',
    location: p.location || '',
    joinedDate: p.created_at || p.joinedDate || new Date().toISOString(),
    phone: p.number || p.phone || '',
    verified: p.verified || false,
  });

  const openUser = async (user: User) => {
    setSelected(user);
    setUserOrders([]);
    setOrdersLoading(true);
    try {
      // Debug: first fetch all orders and filter client-side
      const { data: allOrders, error } = await supabase
        .from('orders')
        .select('*')
        .order('date', { ascending: false });

      console.log('[UserOrders] Total orders in DB:', allOrders?.length, 'Error:', error);
      console.log('[UserOrders] Looking for user:', user.id, user.email);

      if (allOrders && allOrders.length > 0) {
        // Log first order keys to see actual column names
        console.log('[UserOrders] First order keys:', Object.keys(allOrders[0]));
        console.log('[UserOrders] First order sample:', JSON.stringify(allOrders[0]).slice(0, 300));

        // Filter by any possible user identifier
        const userOrders = allOrders.filter(o =>
          o.userId === user.id ||
          o.user_id === user.id ||
          o.customerEmail === user.email ||
          o.customer_email === user.email ||
          o.email === user.email
        );

        console.log('[UserOrders] Matched orders:', userOrders.length);
        setUserOrders(userOrders);
      } else {
        setUserOrders([]);
      }
    } catch (err) {
      console.error('User orders fetch error:', err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      if (error) throw error;
      setUsers((data || []).map(mapUser));
    } catch (err) {
      console.error('Users fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity onPress={() => openUser(item)} style={styles.userCard} activeOpacity={0.8}>
      <View style={styles.userAvatarWrapper}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.userAvatarImg} resizeMode="cover" />
        ) : (
          <View style={[styles.userAvatarImg, styles.userAvatarFallback, { backgroundColor: item.role === 'admin' ? `${colors.primary}20` : `${colors.info}20` }]}>
            <Text style={[styles.userAvatarText, { color: item.role === 'admin' ? colors.primary : colors.info }]}>
              {item.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {item.role === 'admin' && (
          <View style={styles.adminDot}>
            <Ionicons name="shield-checkmark" size={10} color="#000" />
          </View>
        )}
      </View>
      <View style={styles.userInfo}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
          {item.role === 'admin' && (
            <View style={styles.adminBadge}>
              <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
              <Text style={styles.adminBadgeText}>ADMIN</Text>
            </View>
          )}
        </View>
        <Text style={styles.userEmail} numberOfLines={1}>{item.email}</Text>
        <Text style={styles.userJoined}>
          Joined {new Date(item.joinedDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Customers</Text>
          <Text style={styles.subtitle}>{users.length} total users</Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statChip, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
          <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
          <Text style={[styles.statChipText, { color: colors.primary }]}>{adminCount} Admins</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: `${colors.info}15`, borderColor: `${colors.info}30` }]}>
          <Ionicons name="people" size={14} color={colors.info} />
          <Text style={[styles.statChipText, { color: colors.info }]}>{userCount} Users</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderUser}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchUsers(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No users found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* User Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>User Profile</Text>
              <View style={{ width: 24 }} />
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Avatar */}
              <View style={styles.profileHeader}>
                <View style={styles.profileAvatarWrapper}>
                  {selected.avatar ? (
                    <Image source={{ uri: selected.avatar }} style={styles.profileAvatarImg} resizeMode="cover" />
                  ) : (
                    <View style={[styles.profileAvatarImg, styles.profileAvatarFallback, { backgroundColor: selected.role === 'admin' ? `${colors.primary}20` : `${colors.info}20` }]}>
                      <Text style={[styles.profileAvatarText, { color: selected.role === 'admin' ? colors.primary : colors.info }]}>
                        {selected.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={styles.profileName}>{selected.name}</Text>
                <View style={[styles.roleBadge, { backgroundColor: selected.role === 'admin' ? `${colors.primary}20` : `${colors.info}20` }]}>
                  <Ionicons
                    name={selected.role === 'admin' ? 'shield-checkmark' : 'person'}
                    size={12}
                    color={selected.role === 'admin' ? colors.primary : colors.info}
                  />
                  <Text style={[styles.roleBadgeText, { color: selected.role === 'admin' ? colors.primary : colors.info }]}>
                    {selected.role.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailCard}>
                {[
                  { label: 'Email', value: selected.email, icon: 'mail-outline' },
                  { label: 'Phone', value: selected.phone || 'Not provided', icon: 'call-outline' },
                  { label: 'Location', value: selected.location || 'Not provided', icon: 'location-outline' },
                  { label: 'Joined', value: new Date(selected.joinedDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' }), icon: 'calendar-outline' },
                ].map((item, i) => (
                  <View key={i} style={[styles.detailRow, i < 3 && styles.detailRowBorder]}>
                    <View style={styles.detailLeft}>
                      <Ionicons name={item.icon as any} size={16} color={colors.textMuted} />
                      <Text style={styles.detailLabel}>{item.label}</Text>
                    </View>
                    <Text style={styles.detailValue} numberOfLines={1}>{item.value}</Text>
                  </View>
                ))}
              </View>

              {selected.bio && (
                <View style={styles.bioCard}>
                  <Text style={styles.bioLabel}>Bio</Text>
                  <Text style={styles.bioText}>{selected.bio}</Text>
                </View>
              )}

              {/* Order History */}
              <View style={styles.ordersCard}>
                <Text style={styles.bioLabel}>Order History</Text>
                {ordersLoading ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
                ) : userOrders.length === 0 ? (
                  <Text style={styles.noOrdersText}>No orders yet</Text>
                ) : (
                  userOrders.map((o, i) => {
                    const statusColors: Record<string, string> = {
                      pending: colors.warning, shipped: colors.info,
                      delivered: colors.success, cancelled: colors.error, returned: colors.returned,
                    };
                    const sc = statusColors[o.status] || colors.textMuted;
                    const items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
                    const orderDate = o.date || o.created_at;
                    return (
                      <View key={o.id}>
                        <View style={styles.orderHistoryRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.orderHistoryId}>#{String(o.id).slice(-8).toUpperCase()}</Text>
                            <Text style={styles.orderHistoryDate}>
                              {orderDate ? new Date(orderDate).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                            </Text>
                            <Text style={styles.orderHistoryItems}>{items.length} item{items.length !== 1 ? 's' : ''}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end', gap: 4 }}>
                            <Text style={styles.orderHistoryTotal}>Rs. {(o.total || 0).toLocaleString()}</Text>
                            <View style={[styles.orderStatusPill, { backgroundColor: `${sc}20` }]}>
                              <Text style={[styles.orderStatusText, { color: sc }]}>{o.status?.toUpperCase()}</Text>
                            </View>
                          </View>
                        </View>
                        {i < userOrders.length - 1 && <View style={styles.divider} />}
                      </View>
                    );
                  })
                )}
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
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  statChipText: { fontSize: 12, fontWeight: '700' },
  searchRow: { paddingHorizontal: 16, marginBottom: 12 },
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
  list: { padding: 16, gap: 8, paddingBottom: 32 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  userAvatarWrapper: {
    position: 'relative',
    width: 46,
    height: 46,
  },
  userAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  userAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: { fontSize: 20, fontWeight: '800' },
  adminDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  userInfo: { flex: 1 },
  userNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  userName: { fontSize: 15, fontWeight: '700', color: colors.text, flex: 1 },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  adminBadgeText: { fontSize: 8, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  userEmail: { fontSize: 12, color: colors.textMuted },
  userJoined: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
  // Modal
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
  profileHeader: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  profileAvatarWrapper: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.border,
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 45,
  },
  profileAvatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: { fontSize: 36, fontWeight: '900' },
  profileName: { fontSize: 22, fontWeight: '800', color: colors.text },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  detailCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  detailRowBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { fontSize: 13, color: colors.textMuted },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: '600', maxWidth: '60%' },
  bioCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bioLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  bioText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  ordersCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noOrdersText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', paddingVertical: 16 },
  orderHistoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  orderHistoryId: { fontSize: 13, fontWeight: '700', color: colors.text },
  orderHistoryDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  orderHistoryItems: { fontSize: 11, color: colors.textMuted },
  orderHistoryTotal: { fontSize: 14, fontWeight: '800', color: colors.primary },
  orderStatusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  orderStatusText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: 1, backgroundColor: colors.border },
});
