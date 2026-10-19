import SafeScreen from "@/components/SafeScreen";
import { useNotifications, DBNotification } from "@/hooks/useNotifications";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View, RefreshControl } from "react-native";
import { useTheme } from "@/context/ThemeContext";

type TabType = 'all' | 'support' | 'orders' | 'promotional';

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { notifications, isLoading, refetch, markAsRead } = useNotifications();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Removed automatic markAsRead to allow manual marking

  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'all') return true;
    if (activeTab === 'support') return n.type === 'support_reply';
    if (activeTab === 'orders') return n.type === 'order_status';
    if (activeTab === 'promotional') return n.type === 'promotional';
    return true;
  });

  const getNotificationConfig = (type: DBNotification['type']) => {
    switch (type) {
      case 'support_reply':
        return {
          icon: 'chatbubble-ellipses' as const,
          color: '#A060FF', // purple
          bgColor: 'rgba(160, 96, 255, 0.1)',
          label: 'Support Reply',
          actionText: 'Reply Back',
          defaultUrl: '/(profile)/contact',
        };
      case 'order_status':
        return {
          icon: 'cube' as const,
          color: '#10B981', // green
          bgColor: 'rgba(16, 185, 129, 0.1)',
          label: 'Order Update',
          actionText: 'Track Order',
          defaultUrl: '/(profile)/orders',
        };
      case 'promotional':
        return {
          icon: 'gift' as const,
          color: '#FF8020', // orange
          bgColor: 'rgba(255, 128, 32, 0.1)',
          label: 'Promo Offer',
          actionText: 'Shop Now',
          defaultUrl: '/(tabs)/',
        };
      default:
        return {
          icon: 'notifications' as const,
          color: '#3B82F6', // blue
          bgColor: 'rgba(59, 130, 246, 0.1)',
          label: 'Alert',
          actionText: 'View Details',
          defaultUrl: '/(tabs)/',
        };
    }
  };

  const renderItem = ({ item }: { item: DBNotification }) => {
    const config = getNotificationConfig(item.type);
    const hasLink = !!item.data?.url;

    return (
      <View 
        className="rounded-2xl p-5 mb-4 border shadow-sm relative overflow-hidden"
        style={{ 
          backgroundColor: colors.surface,
          borderColor: colors.border
        }}
      >
        {/* Unread Indicator Bar */}
        {!item.read && (
          <View 
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              bottom: 0,
              width: 4,
              backgroundColor: config.color,
            }}
          />
        )}

        {/* Card Header */}
        <View className="flex-row justify-between items-start mb-3">
          <View 
            className="flex-row items-center px-3 py-1 rounded-full"
            style={{ backgroundColor: config.bgColor }}
          >
            <Ionicons name={config.icon} size={13} color={config.color} />
            <Text 
              className="text-[10px] font-extrabold ml-1.5 uppercase tracking-wider"
              style={{ color: config.color }}
            >
              {config.label}
            </Text>
          </View>
          <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">
            {new Date(item.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        
        {/* Card Content */}
        <Text style={{ color: colors.text }} className="text-base font-extrabold mb-1.5 leading-tight">
          {item.title}
        </Text>
        
        <Text style={{ color: colors.textSecondary }} className="text-sm leading-relaxed mb-4">
          {item.body}
        </Text>

        {/* Action Button */}
        <View className="flex-row items-center justify-between pt-2 border-t" style={{ borderTopColor: colors.border + '30' }}>
          <View className="flex-row items-center">
            {!item.read && (
              <View 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: config.color }}
              />
            )}
            <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">
              {item.read ? 'Opened' : 'New'}
            </Text>
          </View>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => {
              const targetUrl = item.data?.url || config.defaultUrl;
              router.push(targetUrl as any);
            }}
            className="flex-row items-center px-4 py-2 rounded-xl"
            style={{ backgroundColor: config.bgColor }}
          >
            <Text style={{ color: config.color, fontSize: 12, fontWeight: '800' }} className="mr-1.5">
              {config.actionText}
            </Text>
            <Ionicons name="arrow-forward" size={12} color={config.color} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeScreen>
        <View 
          className="px-6 pt-4 pb-4 flex-row items-center border-b"
          style={{ 
            backgroundColor: colors.background,
            borderBottomColor: colors.border
          }}
        >
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 items-center justify-center rounded-full mr-4"
            style={{ backgroundColor: colors.surface }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text }} className="text-xl font-bold tracking-tight">Notifications</Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeScreen>
    );
  }

  // Count unreads per category
  const getUnreadCountByType = (type: DBNotification['type']) => {
    return notifications.filter(n => n.type === type && !n.read).length;
  };

  const tabs: { type: TabType; label: string; icon: any }[] = [
    { type: 'all', label: 'All', icon: 'apps-outline' },
    { type: 'support', label: 'Support', icon: 'chatbubble-ellipses-outline' },
    { type: 'orders', label: 'Orders', icon: 'cube-outline' },
    { type: 'promotional', label: 'Offers', icon: 'gift-outline' },
  ];

  return (
    <SafeScreen>
      <View className="flex-1" style={{ backgroundColor: colors.background }}>
        {/* Header */}
        <View 
          className="px-6 pt-4 pb-4 flex-row items-center border-b z-10"
          style={{ 
            backgroundColor: colors.background,
            borderBottomColor: colors.border
          }}
        >
          <TouchableOpacity 
            onPress={() => router.back()} 
            className="w-10 h-10 items-center justify-center rounded-full mr-4 shadow-sm"
            style={{ backgroundColor: colors.surface }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={{ color: colors.text }} className="text-xl font-bold tracking-tight flex-1">Notifications</Text>
          
          {notifications.some(n => !n.read) && (
            <TouchableOpacity 
              onPress={() => markAsRead()}
              className="mr-3 bg-primary/10 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: colors.primary + '15' }}
            >
              <Text style={{ color: colors.primary }} className="text-xs font-bold">Mark all read</Text>
            </TouchableOpacity>
          )}
          <View 
            className="ml-auto px-3 py-1 rounded-full border"
            style={{ 
              backgroundColor: colors.surface,
              borderColor: colors.border
            }}
          >
            <Text style={{ color: colors.textSecondary }} className="text-xs font-semibold">
              {filteredNotifications.length} Total
            </Text>
          </View>
        </View>

        {/* Tab Filters */}
        <View className="px-4 py-3 flex-row justify-between border-b" style={{ borderBottomColor: colors.border + '20', backgroundColor: colors.surface }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.type;
            const unread = tab.type === 'all' 
              ? notifications.filter(n => !n.read).length 
              : getUnreadCountByType(
                  tab.type === 'support' ? 'support_reply' : 
                  tab.type === 'orders' ? 'order_status' : 'promotional'
                );

            return (
              <TouchableOpacity
                key={tab.type}
                onPress={() => setActiveTab(tab.type)}
                className="items-center py-2 px-3 rounded-xl relative flex-1 mx-0.5"
                style={{ 
                  backgroundColor: isActive ? colors.background : 'transparent',
                  borderWidth: 1,
                  borderColor: isActive ? colors.border : 'transparent',
                }}
              >
                <Ionicons 
                  name={tab.icon} 
                  size={18} 
                  color={isActive ? colors.primary : colors.textSecondary} 
                />
                <Text 
                  style={{ 
                    color: isActive ? colors.text : colors.textSecondary,
                    fontSize: 10,
                    fontWeight: isActive ? '800' : '600',
                    marginTop: 4
                  }}
                >
                  {tab.label}
                </Text>
                {unread > 0 && (
                  <View 
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center border"
                    style={{ 
                      backgroundColor: '#EF4444', 
                      borderColor: colors.surface,
                    }}
                  >
                    <Text className="color-white font-bold text-[9px]">{unread}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notifications List */}
        <FlatList
          data={filteredNotifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View 
                className="w-24 h-24 rounded-full items-center justify-center mb-6 shadow-lg shadow-black/20"
                style={{ backgroundColor: colors.surface }}
              >
                <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
              </View>
              <Text style={{ color: colors.text }} className="font-bold text-xl mb-2">No Notifications</Text>
              <Text style={{ color: colors.textSecondary }} className="text-center max-w-[250px] leading-6">
                {activeTab === 'all' 
                  ? "You're all caught up! Check back later for updates." 
                  : `No ${activeTab} notifications found.`}
              </Text>
            </View>
          }
          refreshControl={
            <RefreshControl 
              refreshing={isLoading} 
              onRefresh={refetch} 
              tintColor={colors.primary} 
              colors={[colors.primary]}
            />
          }
        />
      </View>
    </SafeScreen>
  );
}
