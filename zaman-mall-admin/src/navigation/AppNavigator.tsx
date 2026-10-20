import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
  Pressable, Dimensions, Alert, BackHandler,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../context/AuthContext';
import { useBadges } from '../context/BadgeContext';
import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProductsScreen from '../screens/ProductsScreen';
import OrdersScreen from '../screens/OrdersScreen';
import MessagesScreen from '../screens/MessagesScreen';
import UsersScreen from '../screens/UsersScreen';
import AdsScreen from '../screens/AdsScreen';
import ReturnsScreen from '../screens/ReturnsScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import VersionsScreen from '../screens/VersionsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ZeelsScreen from '../screens/ZeelsScreen';
import { colors } from '../theme/colors';
import { ActivityIndicator } from 'react-native';

const { width, height } = Dimensions.get('window');
const Stack = createStackNavigator();

const TABS = [
  { name: 'Dashboard',  icon: 'grid',              iconOff: 'grid-outline'              },
  { name: 'Products',   icon: 'cube',              iconOff: 'cube-outline'              },
  { name: 'Orders',     icon: 'cart',              iconOff: 'cart-outline'              },
  { name: 'Returns',    icon: 'return-down-back',  iconOff: 'return-down-back-outline'  },
  { name: 'Messages',   icon: 'mail',              iconOff: 'mail-outline'              },
  { name: 'Users',      icon: 'people',            iconOff: 'people-outline'            },
  { name: 'Ads',        icon: 'image',             iconOff: 'image-outline'             },
  { name: 'Zeels',     icon: 'play-circle',       iconOff: 'play-circle-outline'       },
  { name: 'Categories', icon: 'layers',            iconOff: 'layers-outline'            },
  { name: 'Versions',   icon: 'phone-portrait',    iconOff: 'phone-portrait-outline'    },
  { name: 'Profile',    icon: 'person',            iconOff: 'person-outline'            },
];

const SCREENS: Record<string, React.ComponentType<any>> = {
  Dashboard:  DashboardScreen,
  Products:   ProductsScreen,
  Orders:     OrdersScreen,
  Returns:    ReturnsScreen,
  Messages:   MessagesScreen,
  Users:      UsersScreen,
  Ads:        AdsScreen,
  Zeels:      ZeelsScreen,
  Categories: CategoriesScreen,
  Versions:   VersionsScreen,
  Profile:    ProfileScreen,
};

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <View style={{ width: 70, height: 70, borderRadius: 22, backgroundColor: `${colors.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="shield-checkmark" size={36} color={colors.primary} />
      </View>
      <ActivityIndicator color={colors.primary} size="large" />
      <Text style={{ color: colors.textMuted, fontSize: 14 }}>Loading Admin Panel...</Text>
    </View>
  );
}

// ── FAB Nav ──────────────────────────────────────────────────────────────────
function FabNav({ activeTab, onSelect, onLogout }: {
  activeTab: string;
  onSelect: (name: string) => void;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const { badges } = useBadges();

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(animation, { toValue, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(backdropAnim, { toValue, duration: 200, useNativeDriver: true }),
    ]).start();
    setOpen(!open);
  };

  const handleSelect = (name: string) => {
    Animated.parallel([
      Animated.spring(animation, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      onSelect(name);
    });
  };

  const handleLogout = () => {
    Animated.parallel([
      Animated.spring(animation, { toValue: 0, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      setOpen(false);
      onLogout();
    });
  };

  const fabRotate = animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] });
  const backdropOpacity = backdropAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.6] });

  const col1 = TABS.filter((_, i) => i % 2 === 0);
  const col2 = TABS.filter((_, i) => i % 2 === 1);

  return (
    <>
      {/* Backdrop */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[styles.backdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={toggle} />
      </Animated.View>

      {/* Popup Menu */}
      <Animated.View
        pointerEvents={open ? 'auto' : 'none'}
        style={[
          styles.popup,
          {
            opacity: animation,
            transform: [
              { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) },
              { scale: animation.interpolate({ inputRange: [0, 1], outputRange: [0.88, 1] }) },
            ],
          },
        ]}
      >
        <View style={styles.popupInner}>

          {/* Tab Grid */}
          <View style={styles.tabGrid}>
            {[col1, col2].map((col, ci) => (
              <View key={ci} style={styles.tabCol}>
                {col.map((tab, i) => {
                  const isActive = activeTab === tab.name;
                  const itemAnim = animation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20 * (i + 1), 0],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View
                      key={tab.name}
                      style={{ transform: [{ translateY: itemAnim }], opacity: animation }}
                    >
                      <TouchableOpacity
                        onPress={() => handleSelect(tab.name)}
                        style={[styles.tabItem, isActive && styles.tabItemActive]}
                        activeOpacity={0.75}
                      >
                        {/* Icon with badge */}
                        <View style={{ position: 'relative' }}>
                          <LinearGradient
                            colors={isActive ? [colors.primary, colors.primaryDark] : [colors.surface, colors.surface]}
                            style={styles.tabIconBg}
                          >
                            <Ionicons
                              name={(isActive ? tab.icon : tab.iconOff) as any}
                              size={17}
                              color={isActive ? '#000' : colors.textSecondary}
                            />
                          </LinearGradient>
                          {/* Badge */}
                          {(badges as any)[tab.name] > 0 && (
                            <View style={styles.badge}>
                              <Text style={styles.badgeText}>
                                {(badges as any)[tab.name] > 99 ? '99+' : (badges as any)[tab.name]}
                              </Text>
                            </View>
                          )}
                        </View>

                        {/* Label */}
                        <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                          {tab.name}
                        </Text>

                        {/* Active indicator bar */}
                        {isActive && <View style={styles.activeBar} />}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })}
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.popupDivider} />

          {/* Logout Button */}
          <Animated.View style={{ opacity: animation }}>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.8}>
              <View style={styles.logoutIconBg}>
                <Ionicons name="log-out-outline" size={18} color={colors.error} />
              </View>
              <Text style={styles.logoutLabel}>Logout</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.error} />
            </TouchableOpacity>
          </Animated.View>

        </View>
      </Animated.View>

      {/* FAB Button */}
      <View style={styles.fabContainer}>
        <TouchableOpacity onPress={toggle} activeOpacity={0.85} style={styles.fabOuter}>
          <LinearGradient
            colors={open ? ['#ef4444', '#dc2626'] : [colors.primary, colors.primaryDark]}
            style={styles.fab}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Animated.View style={{ transform: [{ rotate: fabRotate }] }}>
              <Ionicons name="add" size={30} color="#000" />
            </Animated.View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </>
  );
}

// ── Main Navigator ────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const { user, isLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [tabHistory, setTabHistory] = useState<string[]>(['Dashboard']);

  // Android back button handler
  useEffect(() => {
    const onBackPress = () => {
      if (tabHistory.length > 1) {
        // Go back to previous tab
        const newHistory = tabHistory.slice(0, -1);
        setTabHistory(newHistory);
        setActiveTab(newHistory[newHistory.length - 1]);
        return true; // prevent default (app close)
      }
      // On Dashboard with no history — show exit confirm
      Alert.alert('Exit App', 'Are you sure you want to exit?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Exit', style: 'destructive', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [tabHistory]);

  const handleTabSelect = (name: string) => {
    setActiveTab(name);
    setTabHistory(prev => {
      // Remove if already in history, then push to end
      const filtered = prev.filter(t => t !== name);
      return [...filtered, name];
    });
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (isLoading) return <LoadingScreen />;
  if (!user) return <LoginScreen />;

  const ActiveScreen = SCREENS[activeTab];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, paddingBottom: 80 }} edges={['top', 'left', 'right']}>
        <ActiveScreen />
      </SafeAreaView>

      <View style={styles.bottomBar}>
        <FabNav activeTab={activeTab} onSelect={handleTabSelect} onLogout={handleLogout} />
      </View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 20,
    zIndex: 5,
  },
  fabContainer: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  fabOuter: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 14,
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: `${colors.primary}40`,
  },
  fabLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    zIndex: 10,
  },
  popup: {
    position: 'absolute',
    bottom: 88,
    left: 12,
    right: 12,
    zIndex: 20,
    borderRadius: 24,
    overflow: 'hidden',
  },
  popupInner: {
    backgroundColor: colors.card,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  tabGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  tabCol: {
    flex: 1,
    gap: 2,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: `${colors.primary}12`,
    borderWidth: 1,
    borderColor: `${colors.primary}25`,
  },
  tabIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    flex: 1,
  },
  tabLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeBar: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.card,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 11,
  },
  fabBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: colors.surface,
    zIndex: 1,
  },
  fabBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 12,
  },
  popupDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 14,
    backgroundColor: `${colors.error}10`,
    borderWidth: 1,
    borderColor: `${colors.error}25`,
  },
  logoutIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: `${colors.error}20`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
});
