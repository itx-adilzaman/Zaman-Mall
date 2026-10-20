import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ActivityIndicator, Modal, ScrollView,
  RefreshControl, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import { colors } from '../theme/colors';
import { ContactMessage } from '../types';

export default function MessagesScreen() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const mapMessage = (m: any): ContactMessage => ({
    id: String(m.id),
    userId: m.user_id || m.userId,
    name: m.name || '',
    email: m.email || '',
    subject: m.subject || '',
    message: m.message || '',
    date: m.date || m.created_at || new Date().toISOString(),
    read: m.read || false,
    reply: m.reply || null,
    repliedAt: m.replied_at || m.repliedAt,
    replyReadByUser: m.reply_read_by_user || m.replyReadByUser,
  });

  const fetchMessages = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*');
      if (error) throw error;
      setMessages((data || []).map(mapMessage));
    } catch (err) {
      console.error('Messages fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const filtered = messages.filter(m => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()) ||
      m.subject.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === 'all' ||
      (filter === 'unread' && !m.read) ||
      (filter === 'read' && m.read);
    return matchSearch && matchFilter;
  });

  const markRead = async (id: string) => {
    await supabase.from('messages').update({ read: true }).eq('id', id);
    setMessages(prev => prev.map(m => m.id === id ? { ...m, read: true } : m));
  };

  const openMessage = async (msg: ContactMessage) => {
    setSelected(msg);
    setReplyText('');
    if (!msg.read) await markRead(msg.id);
  };

  const sendReply = async () => {
    if (!replyText.trim() || !selected) return;
    setSending(true);
    try {
      const { error } = await supabase.from('messages').update({
        reply: replyText.trim(),
        replied_at: new Date().toISOString(),
        read: true,
      }).eq('id', selected.id);
      if (error) throw error;
      const updated = { ...selected, reply: replyText.trim(), repliedAt: new Date().toISOString() };
      setSelected(updated);
      setMessages(prev => prev.map(m => m.id === selected.id ? updated : m));
      setReplyText('');
      Alert.alert('Sent', 'Reply sent successfully!');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = (id: string) => {
    Alert.alert('Delete Message', 'Permanently delete this message?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('messages').delete().eq('id', id);
          if (error) Alert.alert('Error', 'Failed to delete message');
          else {
            setMessages(prev => prev.filter(m => m.id !== id));
            setSelected(null);
          }
        },
      },
    ]);
  };

  const unreadCount = messages.filter(m => !m.read).length;

  const renderMessage = ({ item }: { item: ContactMessage }) => (
    <TouchableOpacity
      onPress={() => openMessage(item)}
      style={[styles.messageCard, !item.read && styles.messageCardUnread]}
      activeOpacity={0.8}
    >
      <View style={styles.messageLeft}>
        <View style={[styles.avatar, { backgroundColor: !item.read ? `${colors.primary}20` : colors.surface }]}>
          <Text style={[styles.avatarText, { color: !item.read ? colors.primary : colors.textMuted }]}>
            {item.name.charAt(0).toUpperCase()}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <View style={styles.messageContent}>
        <View style={styles.messageTop}>
          <Text style={[styles.messageName, !item.read && { color: colors.text }]}>{item.name}</Text>
          <Text style={styles.messageDate}>
            {new Date(item.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
        <Text style={styles.messageSubject} numberOfLines={1}>{item.subject}</Text>
        <Text style={styles.messagePreview} numberOfLines={1}>{item.message}</Text>
        {item.reply && (
          <View style={styles.repliedBadge}>
            <Ionicons name="checkmark-done" size={10} color={colors.success} />
            <Text style={styles.repliedText}>Replied</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Messages</Text>
          <Text style={styles.subtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : 'All read'}
          </Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={16} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(['all', 'unread', 'read'] as const).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
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
          renderItem={renderMessage}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchMessages(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="mail-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No messages found</Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Message Detail Modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        {selected && (
          <KeyboardAvoidingView
            style={styles.modal}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </TouchableOpacity>
              <Text style={styles.modalTitle} numberOfLines={1}>{selected.subject}</Text>
              <TouchableOpacity onPress={() => deleteMessage(selected.id)}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Sender Info */}
              <View style={styles.senderCard}>
                <View style={styles.senderAvatar}>
                  <Text style={styles.senderAvatarText}>{selected.name.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.senderInfo}>
                  <Text style={styles.senderName}>{selected.name}</Text>
                  <Text style={styles.senderEmail}>{selected.email}</Text>
                  <Text style={styles.senderDate}>
                    {new Date(selected.date).toLocaleString('en-PK', {
                      day: '2-digit', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>

              {/* Message */}
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{selected.message}</Text>
              </View>

              {/* Existing Reply */}
              {selected.reply && (
                <View style={styles.replyBox}>
                  <View style={styles.replyHeader}>
                    <Ionicons name="return-up-forward" size={14} color={colors.success} />
                    <Text style={styles.replyHeaderText}>Your Reply</Text>
                    {selected.repliedAt && (
                      <Text style={styles.replyDate}>
                        {new Date(selected.repliedAt).toLocaleDateString('en-PK', { day: '2-digit', month: 'short' })}
                      </Text>
                    )}
                  </View>
                  <Text style={styles.replyText}>{selected.reply}</Text>
                </View>
              )}
            </ScrollView>

            {/* Reply Input */}
            <View style={styles.replyInputContainer}>
              <TextInput
                style={styles.replyInput}
                placeholder="Type your reply..."
                placeholderTextColor={colors.textMuted}
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={1000}
              />
              <TouchableOpacity onPress={sendReply} disabled={sending || !replyText.trim()} style={styles.sendBtn}>
                <LinearGradient
                  colors={replyText.trim() ? [colors.primary, colors.primaryDark] : [colors.surface, colors.surface]}
                  style={styles.sendBtnGrad}
                >
                  {sending ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Ionicons name="send" size={18} color={replyText.trim() ? '#000' : colors.textMuted} />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
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
  list: { padding: 16, gap: 8, paddingBottom: 32 },
  messageCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  messageCardUnread: { borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}05` },
  messageLeft: { position: 'relative' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '800' },
  unreadDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  messageContent: { flex: 1 },
  messageTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  messageName: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  messageDate: { fontSize: 11, color: colors.textMuted },
  messageSubject: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 2 },
  messagePreview: { fontSize: 12, color: colors.textMuted },
  repliedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  repliedText: { fontSize: 10, color: colors.success, fontWeight: '700' },
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
  modalTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: colors.text },
  modalBody: { flex: 1, padding: 16 },
  senderCard: {
    flexDirection: 'row',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  senderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: `${colors.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderAvatarText: { fontSize: 22, fontWeight: '800', color: colors.primary },
  senderInfo: { flex: 1 },
  senderName: { fontSize: 16, fontWeight: '800', color: colors.text },
  senderEmail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  senderDate: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  messageBox: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  replyBox: {
    backgroundColor: `${colors.success}10`,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: `${colors.success}30`,
  },
  replyHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  replyHeaderText: { fontSize: 12, fontWeight: '700', color: colors.success, flex: 1 },
  replyDate: { fontSize: 11, color: colors.textMuted },
  replyText: { fontSize: 14, color: colors.text, lineHeight: 20 },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  replyInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendBtn: { borderRadius: 14, overflow: 'hidden' },
  sendBtnGrad: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
