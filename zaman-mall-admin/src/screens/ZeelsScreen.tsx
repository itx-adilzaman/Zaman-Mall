import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView,
  RefreshControl, Alert, Image, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { uploadImageToCloudinary, uploadVideoToCloudinary } from '../lib/cloudinary';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ZeelProduct {
  id: string; name: string; price: number;
  image: string; country?: string; category?: string;
}
interface Zeel {
  id: string; title: string; description?: string;
  video_url: string; thumbnail_url?: string;
  product_id?: string | null;
  likes_count: number; views_count: number;
  is_active: boolean; sort_order: number; created_at: string;
  product?: ZeelProduct | null;
}

const emptyForm = {
  title: '', description: '',
  video_url: '', thumbnail_url: '', product_id: '',
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function ZeelsScreen() {
  const [zeels, setZeels] = useState<Zeel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Upload states
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadingThumb, setUploadingThumb] = useState(false);
  const [saving, setSaving] = useState(false);

  // Product search
  const [products, setProducts] = useState<ZeelProduct[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  // ── Fetch zeels ──────────────────────────────────────────────────────────
  const fetchZeels = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('zeels').select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;

      const productIds = (data || []).filter((z: any) => z.product_id).map((z: any) => z.product_id as string);
      let productsMap: Record<string, ZeelProduct> = {};
      if (productIds.length > 0) {
        const { data: prodData } = await supabase
          .from('products')
          .select('id, name, price, image, country, category')
          .in('id', productIds);
        if (prodData) productsMap = Object.fromEntries(prodData.map((p: any) => [p.id, p]));
      }

      setZeels((data || []).map((z: any) => ({
        ...z,
        product: z.product_id ? (productsMap[z.product_id] ?? null) : null,
      })));
    } catch (err) {
      console.error('Zeels fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // ── Fetch products for picker ────────────────────────────────────────────
  const fetchProducts = useCallback(async () => {
    const { data } = await supabase
      .from('products')
      .select('id, name, price, image, country, category')
      .order('name', { ascending: true });
    setProducts(data || []);
  }, []);

  useEffect(() => { fetchZeels(); fetchProducts(); }, [fetchZeels, fetchProducts]);

  // ── Pick & upload video ──────────────────────────────────────────────────
  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos' as const,
      videoMaxDuration: 300,
    });
    if (result.canceled) return;
    setUploadingVideo(true);
    try {
      const url = await uploadVideoToCloudinary(result.assets[0].uri);
      setForm(p => ({ ...p, video_url: url }));
      Alert.alert('Uploaded', 'Video uploaded successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Video upload failed.');
    } finally {
      setUploadingVideo(false);
    }
  };

  // ── Pick & upload thumbnail ──────────────────────────────────────────────
  const pickThumbnail = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploadingThumb(true);
    try {
      const url = await uploadImageToCloudinary(result.assets[0].uri);
      setForm(p => ({ ...p, thumbnail_url: url }));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Thumbnail upload failed.');
    } finally {
      setUploadingThumb(false);
    }
  };

  // ── Open add modal ────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setProductSearch('');
    setModalVisible(true);
  };

  // ── Open edit modal ───────────────────────────────────────────────────────
  const openEdit = (z: Zeel) => {
    setEditingId(z.id);
    setForm({
      title: z.title,
      description: z.description || '',
      video_url: z.video_url,
      thumbnail_url: z.thumbnail_url || '',
      product_id: z.product_id || '',
    });
    setProductSearch('');
    setModalVisible(true);
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim()) { Alert.alert('Error', 'Title is required.'); return; }
    if (!form.video_url) { Alert.alert('Error', 'Please upload a video first.'); return; }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        video_url: form.video_url,
        thumbnail_url: form.thumbnail_url || null,
        product_id: form.product_id || null,
        is_active: true,
      };
      if (editingId) {
        const { error } = await supabase.from('zeels').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('zeels').insert([{
          ...payload,
          likes_count: 0, views_count: 0, sort_order: zeels.length,
        }]);
        if (error) throw error;
      }
      setModalVisible(false);
      fetchZeels();
      Alert.alert('Success', editingId ? 'Zeel updated!' : 'Zeel published!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save zeel.');
    } finally {
      setSaving(false);
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────────
  const toggleActive = async (z: Zeel) => {
    const { error } = await supabase.from('zeels').update({ is_active: !z.is_active }).eq('id', z.id);
    if (!error) setZeels(prev => prev.map(item => item.id === z.id ? { ...item, is_active: !item.is_active } : item));
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Zeel', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('zeels').delete().eq('id', id);
          if (error) Alert.alert('Error', 'Failed to delete zeel.');
          else fetchZeels();
        },
      },
    ]);
  };

  // ── Product picker ────────────────────────────────────────────────────────
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const selectedProduct = form.product_id ? products.find(p => p.id === form.product_id) : null;

  // ── Render zeel card ──────────────────────────────────────────────────────
  const renderZeel = ({ item }: { item: Zeel }) => (
    <View style={[styles.zeelCard, !item.is_active && styles.zeelCardInactive]}>
      {/* Thumbnail */}
      {item.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={styles.zeelThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.zeelThumb, styles.zeelThumbPlaceholder]}>
          <Ionicons name="play-circle-outline" size={32} color={colors.textMuted} />
        </View>
      )}

      {/* Info */}
      <View style={styles.zeelInfo}>
        <View style={styles.zeelTopRow}>
          <Text style={styles.zeelTitle} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.activeDot, { backgroundColor: item.is_active ? colors.success : colors.border }]} />
        </View>

        {item.description && (
          <Text style={styles.zeelDesc} numberOfLines={1}>{item.description}</Text>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Ionicons name="heart" size={11} color="#f472b6" />
            <Text style={styles.statText}>{item.likes_count}</Text>
          </View>
          <View style={styles.statChip}>
            <Ionicons name="eye" size={11} color="#60a5fa" />
            <Text style={styles.statText}>{item.views_count}</Text>
          </View>
          {item.product && (
            <View style={[styles.statChip, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="bag-handle" size={11} color={colors.primary} />
              <Text style={[styles.statText, { color: colors.primary }]} numberOfLines={1}>
                {item.product.name}
              </Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.adActions}>
          <View style={styles.toggleRow}>
            <Text style={[styles.statusText, { color: item.is_active ? colors.success : colors.textMuted }]}>
              {item.is_active ? 'Active' : 'Hidden'}
            </Text>
            <Switch
              value={item.is_active}
              onValueChange={() => toggleActive(item)}
              trackColor={{ false: colors.border, true: `${colors.success}60` }}
              thumbColor={item.is_active ? colors.success : colors.textMuted}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
              <Ionicons name="pencil" size={15} color={colors.info} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.title)} style={styles.deleteBtn}>
              <Ionicons name="trash" size={15} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  // ── Stats header ──────────────────────────────────────────────────────────
  const totalLikes = zeels.reduce((a, z) => a + z.likes_count, 0);
  const totalViews = zeels.reduce((a, z) => a + z.views_count, 0);
  const activeCount = zeels.filter(z => z.is_active).length;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Zeels</Text>
          <Text style={styles.subtitle}>{zeels.length} reels</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.addBtnGrad}>
            <Ionicons name="add" size={22} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Stats row */}
      <View style={styles.statsHeader}>
        {[
          { label: 'Active', value: activeCount, icon: 'play-circle' as const, color: '#4ade80' },
          { label: 'Likes', value: totalLikes >= 1000 ? `${(totalLikes / 1000).toFixed(1)}k` : totalLikes, icon: 'heart' as const, color: '#f472b6' },
          { label: 'Views', value: totalViews >= 1000 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews, icon: 'eye' as const, color: '#60a5fa' },
        ].map(s => (
          <View key={s.label} style={styles.statCard}>
            <Ionicons name={s.icon} size={18} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* List */}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={zeels}
          keyExtractor={item => item.id}
          renderItem={renderZeel}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchZeels(); }} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="play-circle-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No zeels yet</Text>
              <Text style={styles.emptySubtext}>Tap + to upload your first reel</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ── Add/Edit Modal ── */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Zeel' : 'New Zeel'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

            {/* ── Video Upload ── */}
            <Text style={styles.fieldLabel}>Video *</Text>
            <TouchableOpacity
              onPress={pickVideo}
              style={[styles.uploadBtn, form.video_url ? styles.uploadBtnDone : null]}
              disabled={uploadingVideo}
            >
              {uploadingVideo ? (
                <ActivityIndicator color={colors.primary} />
              ) : form.video_url ? (
                <View style={styles.uploadedRow}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  <Text style={[styles.uploadBtnText, { color: colors.success }]}>Video Uploaded ✓</Text>
                  <TouchableOpacity onPress={() => setForm(p => ({ ...p, video_url: '' }))} style={styles.clearBtn}>
                    <Ionicons name="close-circle" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadedRow}>
                  <Ionicons name="videocam-outline" size={24} color={colors.textMuted} />
                  <Text style={styles.uploadBtnText}>Tap to select video</Text>
                </View>
              )}
            </TouchableOpacity>
            <Text style={styles.fieldHint}>MP4, MOV — max ~150 MB</Text>

            {/* ── Thumbnail ── */}
            <Text style={styles.fieldLabel}>Thumbnail (optional)</Text>
            <TouchableOpacity onPress={pickThumbnail} style={styles.thumbPicker} disabled={uploadingThumb}>
              {form.thumbnail_url ? (
                <>
                  <Image source={{ uri: form.thumbnail_url }} style={styles.thumbPreview} resizeMode="cover" />
                  <TouchableOpacity
                    onPress={() => setForm(p => ({ ...p, thumbnail_url: '' }))}
                    style={styles.thumbClear}
                  >
                    <Ionicons name="close-circle" size={22} color="#fff" />
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.thumbEmpty}>
                  {uploadingThumb
                    ? <ActivityIndicator color={colors.primary} />
                    : (
                      <>
                        <Ionicons name="image-outline" size={28} color={colors.textMuted} />
                        <Text style={styles.thumbEmptyText}>Add thumbnail</Text>
                      </>
                    )
                  }
                </View>
              )}
            </TouchableOpacity>

            {/* ── Title ── */}
            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. New Arrivals from China 🔥"
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
            />

            {/* ── Description ── */}
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Short caption..."
              placeholderTextColor={colors.textMuted}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              multiline
              numberOfLines={3}
            />

            {/* ── Product Link ── */}
            <Text style={styles.fieldLabel}>Link Product (optional)</Text>

            {/* Selected product preview */}
            {selectedProduct && (
              <View style={styles.selectedProduct}>
                <Image source={{ uri: selectedProduct.image }} style={styles.selectedProductImg} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.selectedProductName} numberOfLines={1}>{selectedProduct.name}</Text>
                  <Text style={styles.selectedProductPrice}>Rs. {selectedProduct.price.toLocaleString()}</Text>
                </View>
                <TouchableOpacity onPress={() => setForm(p => ({ ...p, product_id: '' }))} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            )}

            {/* Search + picker toggle */}
            <TouchableOpacity
              onPress={() => setShowProductPicker(v => !v)}
              style={styles.productPickerToggle}
            >
              <Ionicons name={showProductPicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.primary} />
              <Text style={styles.productPickerToggleText}>
                {showProductPicker ? 'Hide products' : (selectedProduct ? 'Change product' : 'Select product')}
              </Text>
            </TouchableOpacity>

            {showProductPicker && (
              <View style={styles.productPickerContainer}>
                {/* Search */}
                <View style={styles.productSearchRow}>
                  <Ionicons name="search" size={15} color={colors.textMuted} />
                  <TextInput
                    style={styles.productSearch}
                    placeholder="Search products..."
                    placeholderTextColor={colors.textMuted}
                    value={productSearch}
                    onChangeText={setProductSearch}
                  />
                  {productSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setProductSearch('')}>
                      <Ionicons name="close" size={15} color={colors.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Scrollable product list */}
                <ScrollView
                  style={{ maxHeight: 340 }}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator
                  keyboardShouldPersistTaps="handled"
                >
                  {/* None option */}
                  <TouchableOpacity
                    onPress={() => { setForm(p => ({ ...p, product_id: '' })); setShowProductPicker(false); }}
                    style={[styles.productOption, !form.product_id && styles.productOptionActive]}
                  >
                    <View style={styles.productOptionNone}>
                      <Ionicons name="close" size={14} color={colors.textMuted} />
                    </View>
                    <Text style={[styles.productOptionName, { color: colors.textMuted }]}>No product</Text>
                    {!form.product_id && <Ionicons name="checkmark" size={16} color={colors.primary} />}
                  </TouchableOpacity>

                  {/* Product list */}
                  {filteredProducts.map(p => {
                    const isSelected = form.product_id === p.id;
                    return (
                      <TouchableOpacity
                        key={p.id}
                        onPress={() => { setForm(prev => ({ ...prev, product_id: p.id })); setShowProductPicker(false); }}
                        style={[styles.productOption, isSelected && styles.productOptionActive]}
                      >
                        <Image source={{ uri: p.image }} style={styles.productOptionImg} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.productOptionName, isSelected && { color: colors.primary }]} numberOfLines={1}>
                              {p.name}
                            </Text>
                            {p.country && (
                              <View style={[styles.countryBadge, { backgroundColor: p.country === 'china' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)' }]}>
                                <Text style={[styles.countryBadgeText, { color: p.country === 'china' ? '#f87171' : '#4ade80' }]}>
                                  {p.country}
                                </Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.productOptionPrice}>Rs. {p.price.toLocaleString()}</Text>
                        </View>
                        {isSelected && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}

                  {filteredProducts.length === 0 && (
                    <View style={{ padding: 20, alignItems: 'center' }}>
                      <Ionicons name="search-outline" size={24} color={colors.textMuted} />
                      <Text style={[styles.moreProductsText, { marginTop: 8 }]}>No products found</Text>
                    </View>
                  )}
                </ScrollView>

                {filteredProducts.length > 0 && (
                  <Text style={styles.moreProductsText}>
                    {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}
                  </Text>
                )}
              </View>
            )}

            {/* ── Save ── */}
            <TouchableOpacity onPress={handleSave} disabled={saving || !form.video_url} style={[styles.saveBtn, (!form.video_url) && styles.saveBtnDisabled]}>
              <LinearGradient
                colors={form.video_url ? [colors.primary, colors.primaryDark] : [colors.surface, colors.surface]}
                style={styles.saveBtnGrad}
              >
                {saving ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Ionicons name="checkmark" size={20} color={form.video_url ? '#000' : colors.textMuted} />
                    <Text style={[styles.saveBtnText, { color: form.video_url ? '#000' : colors.textMuted }]}>
                      {editingId ? 'Update Zeel' : 'Publish Zeel'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 16, paddingTop: 8,
  },
  title: { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  addBtn: { borderRadius: 14, overflow: 'hidden' },
  addBtnGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  // Stats header
  statsHeader: {
    flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12,
  },
  statCard: {
    flex: 1, backgroundColor: colors.card, borderRadius: 14,
    padding: 12, alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  statValue: { fontSize: 18, fontWeight: '900' },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', textTransform: 'uppercase' },

  // List
  list: { padding: 16, gap: 12, paddingBottom: 32 },

  // Zeel card
  zeelCard: {
    backgroundColor: colors.card, borderRadius: 18,
    overflow: 'hidden', borderWidth: 1, borderColor: colors.border,
    flexDirection: 'row',
  },
  zeelCardInactive: { opacity: 0.6 },
  zeelThumb: { width: 100, height: 140 },
  zeelThumbPlaceholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  zeelInfo: { flex: 1, padding: 12, justifyContent: 'space-between' },
  zeelTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  zeelTitle: { fontSize: 14, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  zeelDesc: { fontSize: 11, color: colors.textMuted, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  statChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surface, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 999, borderWidth: 1, borderColor: colors.border,
  },
  statText: { fontSize: 11, color: colors.textSecondary, fontWeight: '700', maxWidth: 80 },
  adActions: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginTop: 10,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  actionBtns: { flexDirection: 'row', gap: 8 },
  editBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: `${colors.info}15`, alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: `${colors.error}15`, alignItems: 'center', justifyContent: 'center',
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyText: { color: colors.textMuted, fontSize: 15, fontWeight: '700' },
  emptySubtext: { color: colors.textMuted, fontSize: 12 },

  // Modal
  modal: { flex: 1, backgroundColor: colors.bg },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  modalBody: { flex: 1, padding: 16 },
  fieldLabel: {
    fontSize: 11, fontWeight: '700', color: colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginTop: 20,
  },
  fieldHint: { fontSize: 11, color: colors.textMuted, marginTop: 4 },

  // Upload button
  uploadBtn: {
    borderWidth: 2, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: 16, padding: 20, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', minHeight: 80,
  },
  uploadBtnDone: { borderColor: colors.success, borderStyle: 'solid', backgroundColor: `${colors.success}08` },
  uploadedRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  uploadBtnText: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
  clearBtn: { marginLeft: 'auto' },

  // Thumbnail
  thumbPicker: {
    height: 120, borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.border,
  },
  thumbPreview: { width: '100%', height: '100%' },
  thumbClear: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 12,
  },
  thumbEmpty: {
    flex: 1, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  thumbEmptyText: { color: colors.textMuted, fontSize: 13 },

  // Text inputs
  textInput: {
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    color: colors.text, fontSize: 14,
  },
  textArea: { height: 80, textAlignVertical: 'top' },

  // Selected product
  selectedProduct: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: `${colors.primary}10`, borderRadius: 14,
    padding: 12, borderWidth: 1, borderColor: `${colors.primary}25`, marginBottom: 8,
  },
  selectedProductImg: { width: 44, height: 44, borderRadius: 10 },
  selectedProductName: { fontSize: 13, fontWeight: '700', color: colors.text },
  selectedProductPrice: { fontSize: 12, fontWeight: '800', color: colors.primary, marginTop: 2 },

  // Product picker
  productPickerToggle: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 10, marginBottom: 4,
  },
  productPickerToggleText: { fontSize: 13, color: colors.primary, fontWeight: '700' },
  productPickerContainer: {
    backgroundColor: colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden',
  },
  productSearchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  productSearch: { flex: 1, color: colors.text, fontSize: 13 },
  productOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  productOptionActive: { backgroundColor: `${colors.primary}10` },
  productOptionNone: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center',
  },
  productOptionImg: { width: 36, height: 36, borderRadius: 10 },
  productOptionName: { fontSize: 12, fontWeight: '700', color: colors.text },
  productOptionPrice: { fontSize: 11, color: colors.primary, fontWeight: '800', marginTop: 2 },
  countryBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  countryBadgeText: { fontSize: 8, fontWeight: '900', textTransform: 'uppercase' },
  moreProductsText: {
    padding: 10, textAlign: 'center',
    color: colors.textMuted, fontSize: 11,
  },

  // Save
  saveBtn: { marginTop: 28, marginBottom: 50, borderRadius: 16, overflow: 'hidden' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnGrad: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, height: 54,
  },
  saveBtnText: { fontSize: 16, fontWeight: '800' },
});
