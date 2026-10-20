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
import { Category } from '../types';

import { uploadImageToCloudinary } from '../lib/cloudinary';

const emptyForm = {
  name: '', name_urdu: '', description: '',
  image_url: '', icon_url: '', is_active: true, sort_order: 0,
};

export default function CategoriesScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Categories fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      const url = await uploadImageToCloudinary(result.assets[0].uri);
      setForm(prev => ({ ...prev, image_url: url }));
    } catch (err: any) {
      console.error('[Upload Error]', err);
      Alert.alert('Error', err?.message || 'Image upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (cat: Category) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name,
      name_urdu: cat.name_urdu || '',
      description: cat.description || '',
      image_url: cat.image_url,
      icon_url: cat.icon_url || '',
      is_active: cat.is_active,
      sort_order: cat.sort_order,
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.image_url) {
      Alert.alert('Error', 'Name and image are required.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const { error } = await supabase.from('categories').update(form).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([form]);
        if (error) throw error;
      }
      setModalVisible(false);
      fetchCategories();
      Alert.alert('Success', editingId ? 'Category updated!' : 'Category added!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Category', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) Alert.alert('Error', 'Failed to delete category.');
          else fetchCategories();
        },
      },
    ]);
  };

  const toggleActive = async (cat: Category) => {
    const { error } = await supabase.from('categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    if (!error) setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.catCard}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.catImage} resizeMode="cover" />
      ) : (
        <View style={[styles.catImage, styles.catImagePlaceholder]}>
          <Ionicons name="grid-outline" size={24} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.catInfo}>
        <Text style={styles.catName}>{item.name}</Text>
        {item.name_urdu && <Text style={styles.catUrdu}>{item.name_urdu}</Text>}
        <Text style={styles.catOrder}>Sort: {item.sort_order}</Text>
        <View style={styles.catActions}>
          <View style={styles.catToggle}>
            <Text style={[styles.catStatus, { color: item.is_active ? colors.success : colors.textMuted }]}>
              {item.is_active ? 'Active' : 'Inactive'}
            </Text>
            <Switch
              value={item.is_active}
              onValueChange={() => toggleActive(item)}
              trackColor={{ false: colors.border, true: `${colors.success}60` }}
              thumbColor={item.is_active ? colors.success : colors.textMuted}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
            />
          </View>
          <View style={styles.catBtns}>
            <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
              <Ionicons name="pencil" size={15} color={colors.info} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
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
          <Text style={styles.title}>Categories</Text>
          <Text style={styles.subtitle}>{categories.length} categories</Text>
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
          data={categories}
          keyExtractor={item => item.id}
          renderItem={renderCategory}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCategories(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="grid-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No categories yet</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Category' : 'Add Category'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Category Image *</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
              {form.image_url ? (
                <Image source={{ uri: form.image_url }} style={styles.pickedImage} resizeMode="cover" />
              ) : (
                <View style={styles.imagePickerEmpty}>
                  {uploading ? <ActivityIndicator color={colors.primary} /> : (
                    <>
                      <Ionicons name="image-outline" size={32} color={colors.textMuted} />
                      <Text style={styles.imagePickerText}>Tap to select image</Text>
                    </>
                  )}
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.fieldLabel}>Name (English) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Category name"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))}
            />

            <Text style={styles.fieldLabel}>Name (Urdu)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="اردو نام"
              placeholderTextColor={colors.textMuted}
              value={form.name_urdu}
              onChangeText={v => setForm(p => ({ ...p, name_urdu: v }))}
            />

            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Category description..."
              placeholderTextColor={colors.textMuted}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <Text style={styles.fieldLabel}>Sort Order</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              value={String(form.sort_order)}
              onChangeText={v => setForm(p => ({ ...p, sort_order: parseInt(v) || 0 }))}
              keyboardType="numeric"
            />

            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Active</Text>
              <Switch
                value={form.is_active}
                onValueChange={v => setForm(p => ({ ...p, is_active: v }))}
                trackColor={{ false: colors.border, true: `${colors.success}60` }}
                thumbColor={form.is_active ? colors.success : colors.textMuted}
              />
            </View>

            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.saveBtnGrad}>
                {saving ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#000" />
                    <Text style={styles.saveBtnText}>{editingId ? 'Update Category' : 'Add Category'}</Text>
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
  catCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  catImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
  },
  catImagePlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: { flex: 1, gap: 2 },
  catName: { fontSize: 15, fontWeight: '700', color: colors.text },
  catUrdu: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  catOrder: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  catActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
  catToggle: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  catStatus: { fontSize: 11, fontWeight: '700' },
  catBtns: { flexDirection: 'row', gap: 6 },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${colors.info}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
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
  textArea: { height: 80, paddingTop: 12 },
  imagePicker: {
    height: 140,
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
