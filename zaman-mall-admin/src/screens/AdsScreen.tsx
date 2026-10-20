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
import { Ad } from '../types';

import { uploadImageToCloudinary, uploadVideoToCloudinary } from '../lib/cloudinary';

const emptyAd: Partial<Ad> = { title: '', imageUrl: '', videoUrl: '', link: '#/shop', active: true };

export default function AdsScreen() {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<Ad>>(emptyAd);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const mapAd = (a: any): Ad => ({
    id: String(a.id),
    title: a.title || '',
    imageUrl: a.image || a.imageUrl || '',
    videoUrl: a.videoUrl || a.video_url || '',
    link: a.link || '#/shop',
    active: a.active !== undefined ? a.active : true,
  });

  const fetchAds = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('ads').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setAds((data || []).map(mapAd));
    } catch (err) {
      console.error('Ads fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAds(); }, [fetchAds]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(result.assets[0].uri);
      setForm(prev => ({ ...prev, imageUrl: url, videoUrl: '' }));
    } catch (err: any) {
      console.error('[Upload Error]', err);
      Alert.alert('Error', err?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyAd);
    setModalVisible(true);
  };

  const openEdit = (ad: Ad) => {
    setEditingId(ad.id);
    setForm({ ...ad });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.title?.trim() || !form.imageUrl) {
      Alert.alert('Error', 'Title and image are required.');
      return;
    }
    setSaving(true);
    try {
      const adData = {
        title: form.title.trim(),
        image: form.imageUrl,
        active: form.active !== undefined ? form.active : true,
      };
      if (editingId) {
        const { error } = await supabase.from('ads').update(adData).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ads').insert([adData]);
        if (error) throw error;
      }
      setModalVisible(false);
      fetchAds();
      Alert.alert('Success', editingId ? 'Banner updated!' : 'Banner added!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save banner.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (ad: Ad) => {
    const { error } = await supabase.from('ads').update({ active: !ad.active }).eq('id', ad.id);
    if (!error) setAds(prev => prev.map(a => a.id === ad.id ? { ...a, active: !a.active } : a));
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert('Delete Banner', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('ads').delete().eq('id', id);
          if (error) Alert.alert('Error', 'Failed to delete banner.');
          else fetchAds();
        },
      },
    ]);
  };

  const renderAd = ({ item }: { item: Ad }) => (
    <View style={styles.adCard}>
      {item.imageUrl ? (
        <Image source={{ uri: item.imageUrl }} style={styles.adImage} resizeMode="cover" />
      ) : (
        <View style={[styles.adImage, styles.adImagePlaceholder]}>
          <Ionicons name="image-outline" size={32} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.adInfo}>
        <Text style={styles.adTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.adLink} numberOfLines={1}>{item.link}</Text>
        <View style={styles.adActions}>
          <View style={styles.adToggle}>
            <Text style={[styles.adStatus, { color: item.active ? colors.success : colors.textMuted }]}>
              {item.active ? 'Active' : 'Inactive'}
            </Text>
            <Switch
              value={item.active}
              onValueChange={() => toggleActive(item)}
              trackColor={{ false: colors.border, true: `${colors.success}60` }}
              thumbColor={item.active ? colors.success : colors.textMuted}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <View style={styles.adBtns}>
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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Banners & Ads</Text>
          <Text style={styles.subtitle}>{ads.length} banners</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.addBtnGrad}>
            <Ionicons name="add" size={22} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={ads}
          keyExtractor={item => item.id}
          renderItem={renderAd}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAds(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="image-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No banners yet</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Banner' : 'Add Banner'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Image */}
            <Text style={styles.fieldLabel}>Banner Image *</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {form.imageUrl ? (
                <Image source={{ uri: form.imageUrl }} style={styles.pickedImage} resizeMode="cover" />
              ) : (
                <View style={styles.imagePickerEmpty}>
                  {uploading ? <ActivityIndicator color={colors.primary} /> : (
                    <>
                      <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                      <Text style={styles.imagePickerText}>Tap to select banner image</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Banner title"
              placeholderTextColor={colors.textMuted}
              value={form.title}
              onChangeText={v => setForm(p => ({ ...p, title: v }))}
            />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Active</Text>
              <Switch
                value={form.active}
                onValueChange={v => setForm(p => ({ ...p, active: v }))}
                trackColor={{ false: colors.border, true: `${colors.success}60` }}
                thumbColor={form.active ? colors.success : colors.textMuted}
              />
            </View>

            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.saveBtnGrad}>
                {saving ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#000" />
                    <Text style={styles.saveBtnText}>{editingId ? 'Update Banner' : 'Add Banner'}</Text>
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
  addBtn: { borderRadius: 14, overflow: 'hidden' },
  addBtnGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  adCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  adImage: { width: '100%', height: 140 },
  adImagePlaceholder: { backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  adInfo: { padding: 14 },
  adTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  adLink: { fontSize: 12, color: colors.textMuted, marginBottom: 10 },
  adActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adToggle: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adStatus: { fontSize: 12, fontWeight: '700' },
  adBtns: { flexDirection: 'row', gap: 8 },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${colors.info}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
  },
  imagePicker: {
    height: 160,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  pickedImage: { width: '100%', height: '100%' },
  imagePickerEmpty: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePickerText: { color: colors.textMuted, fontSize: 13 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  saveBtn: { marginTop: 24, marginBottom: 40, borderRadius: 16, overflow: 'hidden' },
  saveBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 54,
  },
  saveBtnText: { fontSize: 16, fontWeight: '800', color: '#000' },
});
