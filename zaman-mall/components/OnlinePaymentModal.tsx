import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
  Clipboard,
  Pressable,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { useImageUpload } from '@/hooks/useImageUpload';
import * as ImagePicker from 'expo-image-picker';
import { Image as ExpoImage } from 'expo-image';

// ─── App deep links + Play Store fallback ────────────────────────────────────
const APP_CONFIG = {
  easypaisa: {
    // Android intent URI — opens app directly if installed
    androidIntent: 'intent://send/#Intent;scheme=easypaisa;package=pk.com.telenor.phoenix;end',
    // Fallback: Play Store
    playStore: 'https://play.google.com/store/apps/details?id=pk.com.telenor.phoenix',
    // iOS App Store (if needed in future)
    appStore: 'https://apps.apple.com/pk/app/easypaisa/id1548807258',
    // URL scheme attempt
    urlScheme: 'easypaisa://',
    packageId: 'pk.com.telenor.phoenix',
  },
  jazzcash: {
    androidIntent: 'intent://send/#Intent;scheme=jazzcash;package=com.techlogix.mobilinkcustomer;end',
    playStore: 'https://play.google.com/store/apps/details?id=com.techlogix.mobilinkcustomer',
    appStore: 'https://apps.apple.com/pk/app/jazzcash/id1506140573',
    urlScheme: 'jazzcash://',
    packageId: 'com.techlogix.mobilinkcustomer',
  },
};

const PAYMENT_INFO = {
  easypaisa: {
    number: '03185576890',
    displayNumber: '0318-5576890',
    name: 'Easypaisa',
    accountTitle: 'Zaman Sons Mall',
    primaryColor: '#10B981',
    bgColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.3)',
    appColor: '#1a9e5c',
    logoText: 'EP',
  },
  jazzcash: {
    number: '03365942212',
    displayNumber: '0336-5942212',
    name: 'JazzCash',
    accountTitle: 'Zaman Sons Mall',
    primaryColor: '#EF4444',
    bgColor: 'rgba(239,68,68,0.1)',
    borderColor: 'rgba(239,68,68,0.3)',
    appColor: '#c0392b',
    logoText: 'JC',
  },
};

interface OnlinePaymentModalProps {
  visible: boolean;
  method: 'easypaisa' | 'jazzcash';
  totalAmount: number;
  onReceiptUploaded: (receiptUrl: string) => void;
  onClose: () => void;
}

// ─── Open app via deep link ───────────────────────────────────────────────────
const openPaymentApp = async (method: 'easypaisa' | 'jazzcash') => {
  const cfg = APP_CONFIG[method];

  try {
    if (Platform.OS === 'android') {
      // 1. Try URL scheme first (fastest)
      const canOpenScheme = await Linking.canOpenURL(cfg.urlScheme);
      if (canOpenScheme) {
        await Linking.openURL(cfg.urlScheme);
        return;
      }

      // 2. Try Android Intent URI
      const canOpenIntent = await Linking.canOpenURL(cfg.androidIntent);
      if (canOpenIntent) {
        await Linking.openURL(cfg.androidIntent);
        return;
      }

      // 3. Fallback: market:// (opens Play Store directly in app)
      const marketUrl = `market://details?id=${cfg.packageId}`;
      const canOpenMarket = await Linking.canOpenURL(marketUrl);
      if (canOpenMarket) {
        await Linking.openURL(marketUrl);
        return;
      }

      // 4. Last resort: browser Play Store
      await Linking.openURL(cfg.playStore);

    } else if (Platform.OS === 'ios') {
      // Try URL scheme on iOS
      const canOpen = await Linking.canOpenURL(cfg.urlScheme);
      if (canOpen) {
        await Linking.openURL(cfg.urlScheme);
      } else {
        // Open App Store
        await Linking.openURL(cfg.appStore);
      }
    }
  } catch (err) {
    // All attempts failed — open Play Store in browser
    try {
      await Linking.openURL(cfg.playStore);
    } catch {
      Alert.alert(
        'App Open Nahi Ho Saki',
        `${PAYMENT_INFO[method].name} app manually open karein aur ${PAYMENT_INFO[method].displayNumber} pe transfer karein.`,
      );
    }
  }
};

// ─── Component ───────────────────────────────────────────────────────────────
const OnlinePaymentModal: React.FC<OnlinePaymentModalProps> = ({
  visible,
  method,
  totalAmount,
  onReceiptUploaded,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const { uploadImage, uploading } = useImageUpload();
  const info = PAYMENT_INFO[method];

  const [receiptUri, setReceiptUri] = useState<string | null>(null);
  const [receiptBase64, setReceiptBase64] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [openingApp, setOpeningApp] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(info.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenApp = async () => {
    setOpeningApp(true);
    await openPaymentApp(method);
    setOpeningApp(false);
  };

  const handlePickReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.85,
      base64: true,
    });

    if (!result.canceled && result.assets?.[0]) {
      setReceiptUri(result.assets[0].uri);
      setReceiptBase64(result.assets[0].base64 || null);
      setUploadError(null);
    }
  };

  const handleSubmit = async () => {
    if (!receiptUri) {
      setUploadError('Pehle payment receipt ki image select karein.');
      return;
    }
    setUploadError(null);
    try {
      const url = await uploadImage(receiptUri, receiptBase64);
      onReceiptUploaded(url);
      setReceiptUri(null);
      setReceiptBase64(null);
    } catch {
      setUploadError('Upload fail hua. Dobara try karein.');
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setReceiptUri(null);
      setReceiptBase64(null);
      setUploadError(null);
      onClose();
    }
  };

  const steps = [
    `${info.name} app khulega — Amount: Rs. ${totalAmount.toLocaleString()} send karein`,
    `Account number copy karein ya directly app se scan/transfer karein`,
    `Payment ke baad screenshot/confirmation lein`,
    `Neeche receipt upload karein aur "Place Order" press karein`,
    `Admin 1-2 ghante mein verify karega — order active ho jaye ga`,
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'flex-end' }}>
        {/* Backdrop tap to close */}
        <Pressable style={{ flex: 1 }} onPress={handleClose} />

        <View style={{
          backgroundColor: isDark ? '#0D1117' : '#f8f9fa',
          borderTopLeftRadius: 36,
          borderTopRightRadius: 36,
          maxHeight: '94%',
          borderWidth: 1,
          borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
          overflow: 'hidden',
        }}>

          {/* ── HEADER ── */}
          <View style={{
            backgroundColor: info.primaryColor,
            padding: 22,
            paddingBottom: 20,
          }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                {/* App logo placeholder */}
                <View style={{
                  width: 48, height: 48, borderRadius: 14,
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  alignItems: 'center', justifyContent: 'center',
                  borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.25)',
                }}>
                  <Text style={{ color: '#fff', fontWeight: '900', fontSize: 14, letterSpacing: 0.5 }}>
                    {info.logoText}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: '#fff', fontSize: 19, fontWeight: '900', letterSpacing: -0.3 }}>
                    {info.name} Payment
                  </Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '600', marginTop: 1 }}>
                    Manual Transfer · Advance Payment
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={handleClose}
                style={{
                  width: 36, height: 36, borderRadius: 12,
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 36 }}
          >

            {/* ── AMOUNT ── */}
            <View style={{
              backgroundColor: info.bgColor,
              borderRadius: 18, padding: 18,
              borderWidth: 1, borderColor: info.borderColor,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <View>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4 }}>
                  Transfer Amount
                </Text>
                <Text style={{ color: info.primaryColor, fontSize: 30, fontWeight: '900', letterSpacing: -0.5 }}>
                  Rs. {totalAmount.toLocaleString()}
                </Text>
              </View>
              <View style={{
                width: 50, height: 50, borderRadius: 16,
                backgroundColor: info.primaryColor + '20',
                alignItems: 'center', justifyContent: 'center',
                borderWidth: 1, borderColor: info.borderColor,
              }}>
                <Ionicons name="cash-outline" size={24} color={info.primaryColor} />
              </View>
            </View>

            {/* ── OPEN APP BUTTON ── */}
            <TouchableOpacity
              onPress={handleOpenApp}
              disabled={openingApp}
              activeOpacity={0.85}
              style={{
                backgroundColor: info.primaryColor,
                borderRadius: 18, padding: 16,
                flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', gap: 10,
                opacity: openingApp ? 0.75 : 1,
                shadowColor: info.primaryColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 6,
              }}
            >
              {openingApp ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="phone-portrait-outline" size={22} color="#fff" />
              )}
              <View>
                <Text style={{ color: '#fff', fontWeight: '900', fontSize: 15, letterSpacing: -0.2 }}>
                  {openingApp ? 'App Khul Rahi Hai...' : `${info.name} App Kholein`}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 1 }}>
                  {openingApp ? 'Please wait...' : 'Direct transfer ke liye tap karein'}
                </Text>
              </View>
              {!openingApp && (
                <View style={{ marginLeft: 'auto' }}>
                  <Ionicons name="open-outline" size={18} color="rgba(255,255,255,0.8)" />
                </View>
              )}
            </TouchableOpacity>

            {/* ── OR DIVIDER ── */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
                ya manually transfer karein
              </Text>
              <View style={{ flex: 1, height: 1, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
            </View>

            {/* ── ACCOUNT NUMBER + COPY ── */}
            <View style={{
              backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#ffffff',
              borderRadius: 18, padding: 18,
              borderWidth: 1, borderColor: info.borderColor,
              flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
              shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
              shadowOpacity: isDark ? 0.2 : 0.06, shadowRadius: 6, elevation: 2,
            }}>
              <View style={{ gap: 3 }}>
                <Text style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                  {info.name} Number
                </Text>
                <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontSize: 24, fontWeight: '900', letterSpacing: 0.5 }}>
                  {info.displayNumber}
                </Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
                  Account: {info.accountTitle}
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleCopy}
                activeOpacity={0.8}
                style={{
                  backgroundColor: copied ? '#10B981' : info.bgColor,
                  borderRadius: 14, padding: 14,
                  borderWidth: 1,
                  borderColor: copied ? '#10B981' : info.borderColor,
                  alignItems: 'center', gap: 5, minWidth: 64,
                }}
              >
                <Ionicons
                  name={copied ? 'checkmark-circle' : 'copy-outline'}
                  size={22}
                  color={copied ? '#fff' : info.primaryColor}
                />
                <Text style={{
                  color: copied ? '#fff' : info.primaryColor,
                  fontSize: 9, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5,
                }}>
                  {copied ? 'Copied!' : 'Copy'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── STEPS ── */}
            <View style={{
              backgroundColor: 'rgba(245,158,11,0.07)',
              borderRadius: 18, padding: 16,
              borderWidth: 1, borderColor: 'rgba(245,158,11,0.22)',
              gap: 10,
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Ionicons name="list-outline" size={16} color="#F59E0B" />
                <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Steps
                </Text>
              </View>
              {steps.map((step, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                  <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: 'rgba(245,158,11,0.18)',
                    alignItems: 'center', justifyContent: 'center',
                    borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
                    flexShrink: 0, marginTop: 1,
                  }}>
                    <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '900' }}>{i + 1}</Text>
                  </View>
                  <Text style={{
                    color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                    fontSize: 12, lineHeight: 18, flex: 1,
                  }}>
                    {step}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── UPLOAD RECEIPT ── */}
            <View style={{ gap: 10 }}>
              {/* Step label */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{
                  width: 28, height: 28, borderRadius: 10,
                  backgroundColor: info.bgColor, borderWidth: 1, borderColor: info.borderColor,
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Ionicons name="cloud-upload-outline" size={15} color={info.primaryColor} />
                </View>
                <Text style={{ color: isDark ? '#fff' : '#0a0a0a', fontSize: 14, fontWeight: '800' }}>
                  Receipt Upload Karein
                </Text>
              </View>

              {/* Preview or picker */}
              {receiptUri ? (
                <View style={{
                  borderRadius: 18, overflow: 'hidden',
                  borderWidth: 1.5, borderColor: '#10B981',
                  position: 'relative',
                }}>
                  <ExpoImage
                    source={{ uri: receiptUri }}
                    style={{ width: '100%', height: 200 }}
                    contentFit="contain"
                  />
                  {/* Change overlay */}
                  <TouchableOpacity
                    onPress={handlePickReceipt}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      backgroundColor: 'rgba(0,0,0,0.65)',
                      borderRadius: 12, paddingHorizontal: 12, paddingVertical: 7,
                      flexDirection: 'row', alignItems: 'center', gap: 6,
                    }}
                  >
                    <Ionicons name="refresh-outline" size={14} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Change</Text>
                  </TouchableOpacity>
                  {/* Success checkmark */}
                  <View style={{
                    position: 'absolute', top: 10, left: 10,
                    width: 30, height: 30, borderRadius: 15,
                    backgroundColor: '#10B981',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={handlePickReceipt}
                  activeOpacity={0.8}
                  style={{
                    borderWidth: 2, borderStyle: 'dashed',
                    borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.12)',
                    borderRadius: 18, padding: 36,
                    alignItems: 'center', gap: 12,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)',
                  }}
                >
                  <View style={{
                    width: 56, height: 56, borderRadius: 18,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
                    alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Ionicons name="image-outline" size={28} color={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)'} />
                  </View>
                  <View style={{ alignItems: 'center', gap: 4 }}>
                    <Text style={{ color: isDark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)', fontSize: 14, fontWeight: '700' }}>
                      Tap to upload receipt
                    </Text>
                    <Text style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', fontSize: 12 }}>
                      JPG, PNG ya screenshot
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* ── ERROR ── */}
            {uploadError && (
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: 'rgba(239,68,68,0.08)',
                borderRadius: 14, padding: 14,
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
              }}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text style={{ color: '#EF4444', fontSize: 13, flex: 1 }}>{uploadError}</Text>
              </View>
            )}

            {/* ── PLACE ORDER BUTTON ── */}
            <Pressable
              onPress={handleSubmit}
              disabled={uploading || !receiptUri}
              android_ripple={null}
              style={{
                borderRadius: 18, paddingVertical: 18,
                alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 10,
                overflow: 'hidden',
                backgroundColor: receiptUri && !uploading
                  ? info.primaryColor
                  : (isDark ? '#2a2a2a' : '#e8e8e8'),
                opacity: !receiptUri ? 0.55 : 1,
                elevation: 0,
              }}
            >
              {uploading ? (
                <>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={{ color: '#fff', fontSize: 14, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                    Uploading...
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons
                    name="bag-check-outline"
                    size={20}
                    color={receiptUri ? '#fff' : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)')}
                  />
                  <Text style={{
                    color: receiptUri
                      ? '#fff'
                      : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
                    fontSize: 14, fontWeight: '900',
                    textTransform: 'uppercase', letterSpacing: 1.5,
                  }}>
                    Place Order
                  </Text>
                </>
              )}
            </Pressable>

            {/* Footer note */}
            <Text style={{
              color: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
              fontSize: 11, textAlign: 'center', lineHeight: 16,
            }}>
              Order{' '}
              <Text style={{ color: '#F59E0B', fontWeight: '800' }}>Pending Payment</Text>
              {' '}mein rahega jab tak admin receipt verify na kar de
            </Text>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default OnlinePaymentModal;
