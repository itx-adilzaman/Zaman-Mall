import React from 'react';
import { Modal as RNModal, View as RNView, Text as RNText, TouchableOpacity, Pressable, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';

const Modal: React.FC<any> = (props) => React.createElement(RNModal as any, props);
const View: React.FC<any> = (props) => React.createElement(RNView as any, props);
const Text: React.FC<any> = (props) => React.createElement(RNText as any, props);

const { width } = Dimensions.get('window');

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  onClose: () => void;
  icon?: string;
  buttons?: {
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }[];
}

export default function CustomAlert({ visible, title, message, onClose, icon = "information-circle", buttons }: CustomAlertProps) {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <BlurView intensity={isDark ? 30 : 50} style={StyleSheet.absoluteFill} tint={colors.glassTint} />
        
        <Pressable 
          style={[
            styles.alertContainer, 
            { backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF', borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* ICON SECTION */}
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name={icon as any} size={40} color={colors.primary} />
          </View>

          {/* CONTENT */}
          <View style={styles.content}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>
          </View>

          {/* BUTTONS */}
          <View style={styles.buttonContainer}>
            {buttons && buttons.length > 0 ? (
              buttons.map((btn, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    if (btn.onPress) {
                      btn.onPress();
                    }
                    onClose();
                  }}
                  style={[
                    styles.button,
                    index === 0 && buttons.length > 1 ? styles.primaryButton : styles.secondaryButton,
                    { 
                      backgroundColor: index === 0 && buttons.length > 1 ? colors.primary : 'transparent',
                      borderColor: index === 1 || buttons.length === 1 ? colors.glassBorder : 'transparent',
                      borderWidth: index === 1 || buttons.length === 1 ? 1 : 0
                    }
                  ]}
                >
                  <Text style={[
                    styles.buttonText,
                    { color: index === 0 && buttons.length > 1 ? '#000' : colors.text }
                  ]}>
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity
                onPress={onClose}
                style={[styles.button, styles.primaryButton, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.buttonText, { color: '#000' }]}>Got it</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  alertContainer: {
    width: width * 0.85,
    borderRadius: 32,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  content: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    // Background set dynamically
  },
  secondaryButton: {
    // Border set dynamically
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
