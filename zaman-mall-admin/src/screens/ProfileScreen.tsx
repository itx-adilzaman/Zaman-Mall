import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const menuItems = [
    { icon: 'person-outline', label: 'Account Info', sub: user?.email || '' },
    { icon: 'shield-checkmark-outline', label: 'Admin Access', sub: 'Full permissions granted' },
    { icon: 'server-outline', label: 'Database', sub: 'Supabase connected' },
    { icon: 'cloud-outline', label: 'Storage', sub: 'Cloudinary connected' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <LinearGradient colors={['#1a1200', '#0f0a00']} style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} resizeMode="cover" />
          ) : (
            <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </Text>
            </LinearGradient>
          )}
          <View style={styles.onlineDot} />
        </View>
        <Text style={styles.userName}>{user?.name || 'Admin'}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
        <View style={styles.adminBadge}>
          <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
          <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
        </View>
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Role', value: 'Admin', icon: 'shield-outline', color: colors.primary },
          { label: 'Status', value: 'Active', icon: 'checkmark-circle-outline', color: colors.success },
          { label: 'Access', value: 'Full', icon: 'key-outline', color: colors.info },
        ].map((s, i) => (
          <View key={i} style={styles.statCard}>
            <Ionicons name={s.icon as any} size={18} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Menu Items */}
      <View style={styles.menuCard}>
        {menuItems.map((item, i) => (
          <View key={i}>
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={styles.menuIconBg}>
                  <Ionicons name={item.icon as any} size={18} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.menuLabel}>{item.label}</Text>
                  <Text style={styles.menuSub} numberOfLines={1}>{item.sub}</Text>
                </View>
              </View>
              <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            </View>
            {i < menuItems.length - 1 && <View style={styles.divider} />}
          </View>
        ))}
      </View>

      {/* App Info */}
      <View style={styles.appInfoCard}>
        <Text style={styles.appInfoTitle}>Zaman Mall Admin</Text>
        <Text style={styles.appInfoSub}>Version 1.0.0</Text>
        <Text style={styles.appInfoDesc}>
          Admin panel for Zaman Sons Super Mall. Manage products, orders, customers, and more.
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
        <View style={styles.logoutInner}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </View>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { paddingBottom: 40 },
  profileHeader: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 20,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: { position: 'relative', marginBottom: 4 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarText: { fontSize: 36, fontWeight: '900', color: '#000' },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  userName: { fontSize: 22, fontWeight: '900', color: colors.text },
  userEmail: { fontSize: 13, color: colors.textMuted },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  adminBadgeText: { fontSize: 10, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 14, fontWeight: '800' },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '600' },
  menuCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  menuIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  menuSub: { fontSize: 11, color: colors.textMuted, marginTop: 1, maxWidth: 200 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 68 },
  appInfoCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 4,
  },
  appInfoTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
  appInfoSub: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  appInfoDesc: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18, marginTop: 4 },
  logoutBtn: {
    marginHorizontal: 16,
    backgroundColor: `${colors.error}15`,
    borderWidth: 1,
    borderColor: `${colors.error}30`,
    borderRadius: 16,
    overflow: 'hidden',
  },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
  },
  logoutText: { fontSize: 16, fontWeight: '800', color: colors.error },
});
