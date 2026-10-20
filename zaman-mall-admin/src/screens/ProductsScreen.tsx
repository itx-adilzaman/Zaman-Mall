import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Modal,
  ScrollView, Switch, RefreshControl, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { Product, ProductVariant } from '../types';

const { width } = Dimensions.get('window');

const CATEGORY_SUGGESTIONS = [
  'Electronics', 'Clothing', 'Shoes', 'Accessories', 'Home & Kitchen',
  'Beauty', 'Sports', 'Toys', 'Books', 'Food', 'Jewelry', 'Other',
];

import { uploadImageToCloudinary, uploadVideoToCloudinary } from '../lib/cloudinary';
import * as Crypto from 'expo-crypto';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  image: string;
  images: string[];
  videos: { videoUrl: string; title: string; sortOrder: number }[];
  featured: boolean;
  country: 'pakistan' | 'china';
  variants: ProductVariant[];
}

const emptyForm: ProductFormData = {
  name: '', description: '', price: '', stock: '',
  category: 'Electronics', image: '', images: [],
  videos: [], featured: false, country: 'pakistan', variants: [],
};

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'pakistan' | 'china'>('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [variantType, setVariantType] = useState('');
  // Each option row: { value, price }
  const [variantOptionRows, setVariantOptionRows] = useState<{ value: string; price: string }[]>([
    { value: '', price: '' },
  ]);
  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase.from('products').select('*');
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error('Products fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.country === filter;
    return matchSearch && matchFilter;
  });

  const pickImage = async (isGallery = false) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as const,
      allowsMultipleSelection: isGallery,
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploading(true);
    try {
      if (isGallery) {
        const urls = await Promise.all(result.assets.map(a => uploadImageToCloudinary(a.uri)));
        setForm(prev => ({ ...prev, images: [...prev.images, ...urls] }));
      } else {
        const url = await uploadImageToCloudinary(result.assets[0].uri);
        setForm(prev => ({ ...prev, image: url }));
      }
    } catch (err: any) {
      console.error('[Upload Error]', err);
      Alert.alert('Error', err?.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'videos' as const,
      quality: 0.8,
    });
    if (result.canceled) return;
    setUploadingVideo(true);
    try {
      const url = await uploadVideoToCloudinary(result.assets[0].uri);
      setForm(prev => ({
        ...prev,
        videos: [...(prev.videos || []), { videoUrl: url, title: '', sortOrder: (prev.videos || []).length }],
      }));
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Video upload failed.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const addVariant = () => {
    if (!variantType.trim()) return;
    const validRows = variantOptionRows.filter(r => r.value.trim());
    if (validRows.length === 0) return;

    const options = validRows.map(r => {
      const price = parseFloat(r.price);
      if (!isNaN(price) && price > 0) {
        return { value: r.value.trim(), price };
      }
      return r.value.trim(); // no custom price → plain string
    });

    setForm(prev => ({
      ...prev,
      variants: [...prev.variants, { type: variantType.trim(), options }],
    }));
    setVariantType('');
    setVariantOptionRows([{ value: '', price: '' }]);
  };

  const removeVariant = (i: number) => {
    setForm(prev => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== i) }));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setVariantType('');
    setVariantOptionRows([{ value: '', price: '' }]);
    setModalVisible(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setForm({
      name: p.name,
      description: p.description,
      price: String(p.price),
      stock: String(p.stock),
      category: p.category,
      image: p.image,
      images: p.images || [],
      videos: (p.videos || []).map((v: any) => ({ videoUrl: v.videoUrl || v.video_url || '', title: v.title || '', sortOrder: v.sortOrder || 0 })),
      featured: p.featured || false,
      country: p.country || 'pakistan',
      variants: p.variants || [],
    });
    setVariantType('');
    setVariantOptionRows([{ value: '', price: '' }]);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price || !form.image) {
      Alert.alert('Error', 'Name, price, and main image are required.');
      return;
    }
    setSaving(true);
    try {
      const productData = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
        category: form.category,
        image: form.image,
        images: form.images,
        videos: form.videos,
        featured: form.featured,
        country: form.country,
        variants: form.variants,
      };

      if (editingId) {
        const { error } = await supabase.from('products').update(productData).eq('id', editingId);
        if (error) throw error;
      } else {
        const id = Crypto.randomUUID();
        const { error } = await supabase.from('products').insert([{ id, ...productData }]);
        if (error) throw error;
      }
      setModalVisible(false);
      fetchProducts();
      Alert.alert('Success', editingId ? 'Product updated!' : 'Product added!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const saveStock = async (id: string) => {
    const newStock = parseInt(stockValue);
    if (isNaN(newStock) || newStock < 0) { setEditingStockId(null); return; }
    const { error } = await supabase.from('products').update({ stock: newStock }).eq('id', id);
    if (!error) setProducts(prev => prev.map(p => p.id === id ? { ...p, stock: newStock } : p));
    setEditingStockId(null);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Product', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('products').delete().eq('id', id);
          if (error) Alert.alert('Error', 'Failed to delete product.');
          else fetchProducts();
        },
      },
    ]);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={styles.productCard}>
      <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
      <View style={styles.productInfo}>
        <View style={styles.productHeader}>
          <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
          {item.featured && (
            <View style={styles.featuredBadge}>
              <Ionicons name="star" size={10} color={colors.primary} />
            </View>
          )}
        </View>
        <Text style={styles.productCategory}>{item.category}</Text>
        <View style={styles.productMeta}>
          <Text style={styles.productPrice}>Rs. {(item.price || 0).toLocaleString()}</Text>
          {/* Inline stock edit */}
          {editingStockId === item.id ? (
            <View style={styles.stockEditRow}>
              <TextInput
                style={styles.stockInput}
                value={stockValue}
                onChangeText={setStockValue}
                keyboardType="numeric"
                autoFocus
                onBlur={() => saveStock(item.id)}
                onSubmitEditing={() => saveStock(item.id)}
              />
              <TouchableOpacity onPress={() => saveStock(item.id)} style={styles.stockSaveBtn}>
                <Ionicons name="checkmark" size={14} color={colors.success} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => { setEditingStockId(item.id); setStockValue(String(item.stock)); }}
              style={[styles.stockBadge, { backgroundColor: item.stock === 0 ? colors.errorBg : item.stock < 5 ? `${colors.warning}20` : colors.successBg }]}
            >
              <Ionicons name="pencil" size={9} color={item.stock === 0 ? colors.error : item.stock < 5 ? colors.warning : colors.success} />
              <Text style={[styles.stockText, { color: item.stock === 0 ? colors.error : item.stock < 5 ? colors.warning : colors.success }]}>
                {item.stock === 0 ? 'Out' : `${item.stock}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.countryBadge, { backgroundColor: item.country === 'china' ? `${colors.info}20` : `${colors.success}20` }]}>
          <Text style={[styles.countryText, { color: item.country === 'china' ? colors.info : colors.success }]}>
            {item.country === 'china' ? '🇨🇳 China' : '🇵🇰 Pakistan'}
          </Text>
        </View>
      </View>
      <View style={styles.productActions}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.editBtn}>
          <Ionicons name="pencil" size={16} color={colors.info} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.name)} style={styles.deleteBtn}>
          <Ionicons name="trash" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Products</Text>
          <Text style={styles.subtitle}>{filtered.length} items</Text>
        </View>
        <TouchableOpacity onPress={openAdd} style={styles.addBtn}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.addBtnGrad}>
            <Ionicons name="add" size={22} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['all', 'pakistan', 'china'] as const).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'pakistan' ? '🇵🇰 Pakistan' : '🇨🇳 China'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProducts(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="cube-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Product' : 'Add Product'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Main Image */}
            <Text style={styles.fieldLabel}>Main Image *</Text>
            <TouchableOpacity onPress={() => pickImage(false)} style={styles.imagePicker}>
              {form.image ? (
                <Image source={{ uri: form.image }} style={styles.pickedImage} resizeMode="cover" />
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

            {/* Name */}
            <Text style={styles.fieldLabel}>Product Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Enter product name"
              placeholderTextColor={colors.textMuted}
              value={form.name}
              onChangeText={v => setForm(p => ({ ...p, name: v }))}
            />

            {/* Price & Stock */}
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Price (Rs.) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={form.price}
                  onChangeText={v => setForm(p => ({ ...p, price: v }))}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Stock</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={form.stock}
                  onChangeText={v => setForm(p => ({ ...p, stock: v }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Category */}
            <Text style={styles.fieldLabel}>Category</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Type or select a category"
              placeholderTextColor={colors.textMuted}
              value={form.category}
              onChangeText={v => setForm(p => ({ ...p, category: v }))}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORY_SUGGESTIONS.filter(s =>
                s.toLowerCase().includes(form.category.toLowerCase()) || form.category === ''
              ).map(cat => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setForm(p => ({ ...p, category: cat }))}
                  style={[styles.categoryChip, form.category === cat && styles.categoryChipActive]}
                >
                  <Text style={[styles.categoryChipText, form.category === cat && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Country */}
            <Text style={styles.fieldLabel}>Country</Text>
            <View style={styles.row}>
              {(['pakistan', 'china'] as const).map(c => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setForm(p => ({ ...p, country: c }))}
                  style={[styles.countryBtn, form.country === c && styles.countryBtnActive]}
                >
                  <Text style={[styles.countryBtnText, form.country === c && styles.countryBtnTextActive]}>
                    {c === 'pakistan' ? '🇵🇰 Pakistan' : '🇨🇳 China'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Description */}
            <Text style={styles.fieldLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Product description..."
              placeholderTextColor={colors.textMuted}
              value={form.description}
              onChangeText={v => setForm(p => ({ ...p, description: v }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Featured */}
            <View style={styles.switchRow}>
              <Text style={styles.fieldLabel}>Featured Product</Text>
              <Switch
                value={form.featured}
                onValueChange={v => setForm(p => ({ ...p, featured: v }))}
                trackColor={{ false: colors.border, true: `${colors.primary}60` }}
                thumbColor={form.featured ? colors.primary : colors.textMuted}
              />
            </View>

            {/* Gallery Images */}
            <Text style={styles.fieldLabel}>Gallery Images</Text>
            <TouchableOpacity onPress={() => pickImage(true)} style={styles.galleryBtn}>
              <Ionicons name="images-outline" size={18} color={colors.primary} />
              <Text style={styles.galleryBtnText}>Add Gallery Images</Text>
            </TouchableOpacity>
            {form.images.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                {form.images.map((img, i) => (
                  <View key={i} style={styles.galleryThumb}>
                    <Image source={{ uri: img }} style={styles.galleryThumbImg} />
                    <TouchableOpacity
                      onPress={() => setForm(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }))}
                      style={styles.galleryRemove}
                    >
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Product Videos */}
            <Text style={styles.fieldLabel}>Product Videos</Text>
            <TouchableOpacity onPress={pickVideo} disabled={uploadingVideo} style={styles.galleryBtn}>
              {uploadingVideo ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="videocam-outline" size={18} color={colors.primary} />
              )}
              <Text style={styles.galleryBtnText}>
                {uploadingVideo ? 'Uploading video...' : 'Add Video'}
              </Text>
            </TouchableOpacity>
            {form.videos.length > 0 && (
              <View style={{ gap: 8, marginTop: 10 }}>
                {form.videos.map((v, i) => (
                  <View key={i} style={styles.videoChip}>
                    <Ionicons name="play-circle" size={20} color={colors.info} />
                    <Text style={styles.videoChipText} numberOfLines={1}>
                      {v.title || `Video ${i + 1}`}
                    </Text>
                    <TouchableOpacity onPress={() => setForm(p => ({ ...p, videos: p.videos.filter((_, idx) => idx !== i) }))}>
                      <Ionicons name="close-circle" size={18} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Variants */}
            <Text style={styles.fieldLabel}>Product Variants</Text>
            <Text style={[styles.fieldHint]}>Add options with optional custom price. Leave price blank to use product base price.</Text>

            {/* Type suggestions */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {['Size', 'Color', 'Material', 'Weight', 'Style'].map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setVariantType(t)}
                  style={[styles.variantSuggestion, variantType === t && styles.variantSuggestionActive]}
                >
                  <Text style={[styles.variantSuggestionText, variantType === t && styles.variantSuggestionTextActive]}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Type input */}
            <View style={styles.variantInputBox}>
              <Ionicons name="pricetag-outline" size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.variantInlineInput}
                placeholder="Variant type (e.g. Size, Color)"
                placeholderTextColor={colors.textMuted}
                value={variantType}
                onChangeText={setVariantType}
              />
              {variantType.length > 0 && (
                <TouchableOpacity onPress={() => setVariantType('')}>
                  <Ionicons name="close-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Per-option rows */}
            <View style={{ marginTop: 10, gap: 8 }}>
              {variantOptionRows.map((row, ri) => (
                <View key={ri} style={styles.optionRow}>
                  {/* Value input */}
                  <View style={[styles.variantInputBox, { flex: 2, marginTop: 0 }]}>
                    <Ionicons name="ellipse-outline" size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.variantInlineInput}
                      placeholder={`Option ${ri + 1} (e.g. Red)`}
                      placeholderTextColor={colors.textMuted}
                      value={row.value}
                      onChangeText={v => {
                        const next = [...variantOptionRows];
                        next[ri] = { ...next[ri], value: v };
                        setVariantOptionRows(next);
                      }}
                    />
                  </View>

                  {/* Price input */}
                  <View style={[styles.variantInputBox, { flex: 1, marginTop: 0 }]}>
                    <Text style={{ color: colors.textMuted, fontSize: 11, marginRight: 4 }}>Rs.</Text>
                    <TextInput
                      style={styles.variantInlineInput}
                      placeholder="Price"
                      placeholderTextColor={colors.textMuted}
                      value={row.price}
                      onChangeText={v => {
                        const next = [...variantOptionRows];
                        next[ri] = { ...next[ri], price: v };
                        setVariantOptionRows(next);
                      }}
                      keyboardType="numeric"
                    />
                  </View>

                  {/* Remove row */}
                  {variantOptionRows.length > 1 && (
                    <TouchableOpacity
                      onPress={() => setVariantOptionRows(variantOptionRows.filter((_, idx) => idx !== ri))}
                      style={{ paddingLeft: 6 }}
                    >
                      <Ionicons name="remove-circle-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>

            {/* Add another option row */}
            <TouchableOpacity
              onPress={() => setVariantOptionRows(prev => [...prev, { value: '', price: '' }])}
              style={styles.addOptionRowBtn}
            >
              <Ionicons name="add" size={15} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '700' }}>Add Option</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={addVariant}
              disabled={!variantType.trim() || variantOptionRows.every(r => !r.value.trim())}
              style={[styles.variantAddBtn, (!variantType.trim() || variantOptionRows.every(r => !r.value.trim())) && { opacity: 0.35 }]}
            >
              <Ionicons name="add-circle-outline" size={18} color="#000" />
              <Text style={styles.variantAddBtnText}>Add Variant Group</Text>
            </TouchableOpacity>

            {/* Added variants */}
            {form.variants.length > 0 && (
              <View style={styles.variantList}>
                {form.variants.map((v, i) => (
                  <View key={i} style={styles.variantChip}>
                    <View style={styles.variantChipLeft}>
                      <View style={styles.variantTypeBadge}>
                        <Ionicons name="pricetag" size={10} color={colors.primary} />
                        <Text style={styles.variantTypeText}>{v.type}</Text>
                      </View>
                      <View style={styles.variantOptions}>
                        {v.options.map((opt, oi) => {
                          const isObj = typeof opt === 'object' && opt !== null;
                          const val = isObj ? (opt as any).value : opt;
                          const price = isObj ? (opt as any).price : undefined;
                          return (
                            <View key={oi} style={[styles.variantOptPill, price ? { borderColor: colors.primary + '60', backgroundColor: colors.primary + '12' } : null]}>
                              <Text style={styles.variantOptText}>{val}</Text>
                              {price ? (
                                <Text style={{ fontSize: 10, color: colors.primary, fontWeight: '800', marginLeft: 3 }}>
                                  Rs.{price.toLocaleString()}
                                </Text>
                              ) : null}
                            </View>
                          );
                        })}
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeVariant(i)} style={styles.variantRemoveBtn}>
                      <Ionicons name="trash-outline" size={15} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Save Button */}
            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.saveBtnGrad}>
                {saving ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#000" />
                    <Text style={styles.saveBtnText}>{editingId ? 'Update Product' : 'Add Product'}</Text>
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
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterBtnActive: { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}50` },
  filterText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  filterTextActive: { color: colors.primary },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  productCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  productImage: { width: 90, height: 90 },
  productInfo: { flex: 1, padding: 10, gap: 3 },
  productHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  productName: { fontSize: 14, fontWeight: '700', color: colors.text, flex: 1 },
  featuredBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productCategory: { fontSize: 11, color: colors.textMuted },
  productMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  productPrice: { fontSize: 14, fontWeight: '800', color: colors.primary },
  stockBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  stockText: { fontSize: 10, fontWeight: '700' },
  stockEditRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockInput: {
    width: 48,
    height: 26,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 6,
    color: colors.text,
    fontSize: 12,
  },
  stockSaveBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: `${colors.success}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginTop: 2 },
  countryText: { fontSize: 10, fontWeight: '600' },
  productActions: {
    padding: 10,
    gap: 8,
    justifyContent: 'center',
  },
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
  textArea: { height: 100, paddingTop: 12 },
  row: { flexDirection: 'row', gap: 10 },
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
  categoryScroll: { marginTop: 8, marginBottom: 4 },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}50` },
  categoryChipText: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  categoryChipTextActive: { color: colors.primary },
  countryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  countryBtnActive: { backgroundColor: `${colors.primary}20`, borderColor: `${colors.primary}50` },
  countryBtnText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  countryBtnTextActive: { color: colors.primary },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.primary}15`,
    borderWidth: 1,
    borderColor: `${colors.primary}30`,
    borderRadius: 12,
    padding: 12,
  },
  galleryBtnText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  galleryScroll: { marginTop: 10 },
  galleryThumb: { marginRight: 10, position: 'relative' },
  galleryThumbImg: { width: 70, height: 70, borderRadius: 10 },
  galleryRemove: { position: 'absolute', top: -6, right: -6 },
  videoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: `${colors.info}15`,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: `${colors.info}30`,
  },
  videoChipText: { flex: 1, color: colors.textSecondary, fontSize: 12 },
  variantAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginTop: 10, height: 48, borderRadius: 14,
    backgroundColor: colors.primary,
  },
  variantAddBtnText: { fontSize: 14, fontWeight: '800', color: '#000' },
  variantInputRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  variantInputBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, paddingHorizontal: 14, height: 50,
  },
  variantInlineInput: { flex: 1, color: colors.text, fontSize: 14 },
  optionRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addOptionRowBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, marginTop: 4,
  },
  fieldHint: { fontSize: 11, color: colors.textMuted, marginBottom: 10, marginTop: -4 },
  variantSuggestion: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  variantSuggestionActive: {
    backgroundColor: `${colors.primary}20`,
    borderColor: `${colors.primary}50`,
  },
  variantSuggestionText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '600',
  },
  variantSuggestionTextActive: { color: colors.primary },
  variantList: { gap: 8, marginTop: 12 },
  variantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variantChipLeft: { flex: 1, gap: 8 },
  variantTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: `${colors.primary}20`,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: `${colors.primary}40`,
  },
  variantTypeText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  variantOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  variantOptPill: {
    backgroundColor: colors.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  variantOptText: { fontSize: 12, color: colors.text, fontWeight: '600' },
  variantRemoveBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
