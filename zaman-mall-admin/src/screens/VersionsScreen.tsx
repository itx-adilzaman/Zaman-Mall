import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView,
  RefreshControl, Alert, Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { AppVersion } from '../types';

const emptyForm = {
  version_code: '',
  download_url: 'https://zamanmall.netlify.app/Zaman%20Mall.apk',
  is_critical: false,
  release_notes: '',
};

export default function VersionsScreen() {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchVersions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_versions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVersions(data || []);
    } catch (err) {
      console.error('Versions fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchVersions(); }, [fetchVersions]);

  const handleSave = async () => {
    if (!form.version_code.trim()) {
      Alert.alert('Error', 'Version code is required.');
      return;
    }
    setSaving(true);
    try {
      // Check if version exists
      const { data: existing } = await supabase
        .from('app_versions')
        .select('*')
        .eq('version_code', form.version_code)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('app_versions')
          .update(form)
          .eq('version_code', form.version_code);
        if (error) throw error;
        Alert.alert('Success', 'Version updated!');
      } else {
        const { error } = await supabase.from('app_versions').insert([form]);
        if (error) throw error;
        Alert.alert('Success', 'Version added!');
      }
      setModalVisible(false);
      setForm(emptyForm);
      fetchVersions();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save version.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string, code: string) => {
    Alert.alert('Delete Version', `Delete version "${code}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('app_versions').delete().eq('id', id);
          if (error) Alert.alert('Error', `Failed to delete: ${error.message}`);
          else fetchVersions();
        },
      },
    ]);
  };

  const renderVersion = ({ item, index }: { item: AppVersion; index: number }) => (
    <View style={[styles.versionCard, index === 0 && styles.latestCard]}>
      <View style={styles.versionTop}>
        <View style={styles.versionLeft}>
          <View style={styles.versionIconBg}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
          </View>
          <View>
            <View style={styles.versionNameRow}>
              <Text style={styles.versionCode}>v{item.version_code}</Text>
              {index === 0 && (
                <View style={styles.latestBadge}>
                  <Text style={styles.latestBadgeText}>LATEST</Text>
                </View>
              )}
              {item.is_critical && (
                <View style={styles.criticalBadge}>
                  <Ionicons name="warning" size={10} color={colors.error} />
                  <Text style={styles.criticalBadgeText}>CRITICAL</Text>
                </View>
              )}
            </View>
            <Text style={styles.versionDate}>
              {item.created_at
                ? new Date(item.created_at).toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' })
                : 'Unknown date'}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id, item.version_code)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={colors.error} />
        </TouchableOpacity>
      </View>

      {item.release_notes && (
        <View style={styles.notesBox}>
          <Text style={styles.notesLabel}>Release Notes</Text>
          <Text style={styles.notesText}>{item.release_notes}</Text>
        </View>
      )}

      <View style={styles.downloadRow}>
        <Ionicons name="download-outline" size={12} color={colors.textMuted} />
        <Text style={styles.downloadUrl} numberOfLines={1}>{item.download_url}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>App Versions</Text>
          <Text style={styles.subtitle}>{versions.length} versions</Text>
        </View>
        <TouchableOpacity onPress={() => { setForm(emptyForm); setModalVisible(true); }} style={styles.addBtn}>
          <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.addBtnGrad}>
            <Ionicons name="add" size={22} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={16} color={colors.info} />
        <Text style={styles.infoText}>
          Add new app versions here. The mobile app checks this to prompt users for updates.
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={versions}
          keyExtractor={item => item.id}
          renderItem={renderVersion}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVersions(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="phone-portrait-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No versions added yet</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add App Version</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.fieldLabel}>Version Code *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 1.2.0"
              placeholderTextColor={colors.textMuted}
              value={form.version_code}
              onChangeText={v => setForm(p => ({ ...p, version_code: v }))}
            />

            <Text style={styles.fieldLabel}>Download URL</Text>
            <TextInput
              style={styles.textInput}
              placeholder="https://..."
              placeholderTextColor={colors.textMuted}
              value={form.download_url}
              onChangeText={v => setForm(p => ({ ...p, download_url: v }))}
              autoCapitalize="none"
            />

            <Text style={styles.fieldLabel}>Release Notes</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="What's new in this version..."
              placeholderTextColor={colors.textMuted}
              value={form.release_notes}
              onChangeText={v => setForm(p => ({ ...p, release_notes: v }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.switchRow}>
              <View>
                <Text style={styles.fieldLabel}>Critical Update</Text>
                <Text style={styles.switchSubtext}>Force users to update immediately</Text>
              </View>
              <Switch
                value={form.is_critical}
                onValueChange={v => setForm(p => ({ ...p, is_critical: v }))}
                trackColor={{ false: colors.border, true: `${colors.error}60` }}
                thumbColor={form.is_critical ? colors.error : colors.textMuted}
              />
            </View>

            <TouchableOpacity onPress={handleSave} disabled={saving} style={styles.saveBtn}>
              <LinearGradient colors={[colors.primary, colors.primaryDark]} style={styles.saveBtnGrad}>
                {saving ? <ActivityIndicator color="#000" /> : (
                  <>
                    <Ionicons name="checkmark" size={20} color="#000" />
                    <Text style={styles.saveBtnText}>Publish Version</Text>
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
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: `${colors.info}10`,
    borderWidth: 1,
    borderColor: `${colors.info}30`,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  infoText: { flex: 1, fontSize: 12, color: colors.info, lineHeight: 18 },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  versionCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  latestCard: { borderColor: `${colors.primary}40`, backgroundColor: `${colors.primary}05` },
  versionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  versionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  versionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  versionNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  versionCode: { fontSize: 18, fontWeight: '900', color: colors.text },
  latestBadge: {
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  latestBadgeText: { fontSize: 9, fontWeight: '800', color: colors.primary, letterSpacing: 0.5 },
  criticalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: `${colors.error}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  criticalBadgeText: { fontSize: 9, fontWeight: '800', color: colors.error, letterSpacing: 0.5 },
  versionDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  deleteBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: `${colors.error}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  notesText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  downloadRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  downloadUrl: { fontSize: 11, color: colors.textMuted, flex: 1 },
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
  textArea: { height: 100, paddingTop: 12 },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  switchSubtext: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
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
