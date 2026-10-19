import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { getShoppingAssistantResponse } from '@/services/gemini';
import useProducts from '@/hooks/useProducts';
import { LinearGradient } from 'expo-linear-gradient';
import Reanimated, { FadeInUp, FadeIn, ZoomIn } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const AI_HISTORY_KEY = '@zaman_ai_history';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface AIChatModalProps {
  visible: boolean;
  onClose: () => void;
}

const AIChatModal = ({ visible, onClose }: AIChatModalProps) => {
  const { colors, isDark } = useTheme();
  const { data: products } = useProducts();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem(AI_HISTORY_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as any[];
          const restored: Message[] = parsed.map((m) => ({
            ...m,
            timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
          }));
          if (restored.length > 0) {
            setMessages(restored);
            return;
          }
        }
      } catch (e) {}

      setMessages([
        {
          id: '1',
          text: "Welcome to Zaman Mall. I am Zaman AI, your personal shopping assistant. How may I help you find the perfect product today?",
          sender: 'ai',
          timestamp: new Date(),
        },
      ]);
    };

    loadHistory();
  }, []);

  useEffect(() => {
    if (messages.length === 0) return;
    const save = async () => {
      try {
        const trimmed = messages.slice(-30);
        await AsyncStorage.setItem(AI_HISTORY_KEY, JSON.stringify(trimmed));
      } catch (e) {}
    };
    save();
  }, [messages]);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [visible]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newUserMsg: Message = {
      id: Date.now().toString(),
      text: userMessage,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await getShoppingAssistantResponse(userMessage, products || []);
      
      // Fixed typing effect - no blinking
      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = {
        id: aiMsgId,
        text: response, // Set full text immediately
        sender: 'ai',
        timestamp: new Date(),
      };
      
      // Add complete message at once (no word-by-word to prevent blinking)
      setMessages((prev) => [...prev, newAiMsg]);

    } catch (error) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        text: "My apologies. I'm experiencing a temporary connection issue. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessage = (item: Message) => {
    const isAI = item.sender === 'ai';
    
    return (
      <Reanimated.View 
        key={item.id}
        entering={FadeInUp.duration(500).springify()}
        style={[
          styles.messageBubble,
          isAI ? styles.aiBubble : styles.userBubble,
        ]}
      >
        {isAI ? (
          <LinearGradient
            colors={isDark 
              ? ['rgba(139, 92, 246, 0.22)', 'rgba(124, 58, 237, 0.28)', 'rgba(109, 40, 217, 0.22)']
              : ['rgba(243, 232, 255, 1)', 'rgba(233, 213, 255, 1)', 'rgba(243, 232, 255, 1)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#1a1a2e' : 'transparent' }]}
          />
        ) : (
          <LinearGradient
            colors={['#8B5CF6', '#7C3AED', '#6D28D9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        
        <View style={{ position: 'relative', zIndex: 1 }}>
          {isAI && (
            <View style={styles.aiHeaderContainer}>
              <LinearGradient
                colors={isDark 
                  ? ['rgba(139, 92, 246, 0.3)', 'rgba(124, 58, 237, 0.4)']
                  : ['rgba(139, 92, 246, 0.2)', 'rgba(124, 58, 237, 0.3)']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.aiBadge}
              >
                <MaterialCommunityIcons 
                  name="brain" 
                  size={11} 
                  color={isDark ? '#C4B5FD' : '#7C3AED'} 
                />
                <Text style={[styles.aiBadgeText, { 
                  color: isDark ? '#C4B5FD' : '#7C3AED'
                }]}>ZAMAN AI</Text>
              </LinearGradient>
            </View>
          )}
          <Text
            style={[
              styles.messageText,
              { 
                color: isAI ? (isDark ? '#FFFFFF' : '#1F2937') : '#FFFFFF',
                fontSize: 15,
                lineHeight: 22,
                fontWeight: isAI ? '400' : '500',
                letterSpacing: 0.3,
              }
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.timestamp, { 
              color: isAI ? (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)') : 'rgba(255,255,255,0.6)'
            }]}>
              {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            {!isAI && (
              <Ionicons name="checkmark-done" size={14} color="rgba(255,255,255,0.8)" style={{ marginLeft: 6 }} />
            )}
          </View>
        </View>
      </Reanimated.View>
    );
  };

  const ThinkingIndicator = () => (
    <Reanimated.View
      entering={FadeInUp.duration(400).springify()}
      style={[styles.messageBubble, styles.aiBubble]}
    >
      <LinearGradient
        colors={isDark 
          ? ['rgba(139, 92, 246, 0.25)', 'rgba(124, 58, 237, 0.35)']
          : ['rgba(243, 232, 255, 1)', 'rgba(233, 213, 255, 1)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.thinkingContainer, { position: 'relative', zIndex: 1 }]}>
        <MaterialCommunityIcons 
          name="head-lightbulb" 
          size={18} 
          color={isDark ? '#C4B5FD' : '#7C3AED'} 
          style={{ marginRight: 8 }} 
        />
        <Text style={[styles.thinkingText, { 
          color: isDark ? '#C4B5FD' : '#7C3AED'
        }]}>Zaman AI is thinking</Text>
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((i) => (
            <Reanimated.View
              key={i}
              entering={FadeInUp.delay(i * 150).duration(500).springify()}
              style={[styles.dot, { 
                backgroundColor: isDark ? '#C4B5FD' : '#7C3AED'
              }]}
            />
          ))}
        </View>
      </View>
    </Reanimated.View>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Premium Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={isDark 
              ? ['rgba(0,0,0,0.85)', 'rgba(16,16,20,0.95)', 'rgba(0,0,0,0.9)']
              : ['rgba(30,27,75,0.5)', 'rgba(88,28,135,0.4)', 'rgba(49,46,129,0.5)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Animated.View
            style={[
              styles.chatContainer,
              {
                backgroundColor: isDark ? '#0A0A0F' : '#FFFFFF',
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            {/* Luxury Gradient Overlay */}
            <LinearGradient
              colors={isDark 
                ? ['rgba(139, 92, 246, 0.08)', 'transparent', 'rgba(168, 85, 247, 0.05)']
                : ['rgba(139, 92, 246, 0.04)', 'transparent', 'rgba(168, 85, 247, 0.03)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            
            {/* Animated Gold Accent Line */}
            <Reanimated.View 
              entering={ZoomIn.delay(200).duration(800)}
              style={[styles.accentLine, { backgroundColor: isDark ? '#A78BFA' : '#8B5CF6' }]} 
            />

            {/* Header */}
            <View style={[styles.header, { 
              borderBottomColor: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(139, 92, 246, 0.1)', 
              backgroundColor: 'transparent'
            }]}>
              <View style={styles.headerInfo}>
                <Reanimated.View 
                  entering={ZoomIn.delay(100).duration(600).springify()}
                  style={[styles.aiBadgeHeader, { 
                    backgroundColor: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                    borderWidth: 1.5,
                    borderColor: isDark ? 'rgba(167, 139, 250, 0.3)' : 'rgba(139, 92, 246, 0.2)'
                  }]}
                >
                  <MaterialCommunityIcons name="robot-excited" size={20} color={isDark ? '#C4B5FD' : '#7C3AED'} />
                </Reanimated.View>
                <View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.headerTitle, { color: colors.text }]}>Zaman AI</Text>
                    <Reanimated.View entering={FadeIn.delay(400)}>
                      <MaterialCommunityIcons name="shimmer" size={16} color={isDark ? '#C4B5FD' : '#7C3AED'} />
                    </Reanimated.View>
                  </View>
                  <View style={styles.subtitleContainer}>
                    <Reanimated.View 
                      entering={ZoomIn.delay(300).duration(500)}
                      style={[styles.statusDot, { backgroundColor: '#10B981' }]} 
                    />
                    <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                      Your Shopping Assistant
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <LinearGradient
                  colors={isDark 
                    ? ['rgba(167, 139, 250, 0.1)', 'rgba(139, 92, 246, 0.15)']
                    : ['rgba(139, 92, 246, 0.08)', 'rgba(124, 58, 237, 0.1)']
                  }
                  style={styles.closeIconWrapper}
                >
                  <Ionicons name="close" size={20} color={colors.text} />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesList}
              contentContainerStyle={styles.messagesContent}
              onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageWrapper,
                    msg.sender === 'user' ? styles.userWrapper : styles.aiWrapper,
                  ]}
                >
                  {renderMessage(msg)}
                </View>
              ))}
              {isLoading && (
                <View style={styles.aiWrapper}>
                  <ThinkingIndicator />
                </View>
              )}
            </ScrollView>

            {/* Luxury Input Area */}
            <View style={[styles.inputContainer, { 
              borderTopColor: isDark ? 'rgba(167, 139, 250, 0.15)' : 'rgba(139, 92, 246, 0.1)', 
              backgroundColor: 'transparent'
            }]}>
              <View style={styles.inputWrapper}>
                <LinearGradient
                  colors={isDark 
                    ? ['rgba(30, 30, 45, 1)', 'rgba(25, 25, 40, 1)']
                    : ['rgba(255, 255, 255, 1)', 'rgba(249, 250, 251, 1)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.inputGradient, { 
                    borderColor: isDark ? 'rgba(167, 139, 250, 0.3)' : 'rgba(139, 92, 246, 0.2)'
                  }]}
                >
                  <MaterialCommunityIcons 
                    name="message-text-outline" 
                    size={20} 
                    color={isDark ? '#C4B5FD' : '#7C3AED'} 
                    style={{ marginLeft: 16 }}
                  />
                  <TextInput
                    style={[styles.input, { 
                      color: isDark ? '#FFFFFF' : '#1F2937'
                    }]}
                    placeholder="Ask me anything about products..."
                    placeholderTextColor={isDark ? 'rgba(200, 200, 220, 0.5)' : 'rgba(107, 114, 128, 0.6)'}
                    value={input}
                    onChangeText={setInput}
                    multiline
                    maxLength={500}
                  />
                </LinearGradient>
              </View>
              <TouchableOpacity
                onPress={handleSend}
                disabled={!input.trim() || isLoading}
                style={styles.sendButtonContainer}
              >
                <LinearGradient
                  colors={input.trim() && !isLoading 
                    ? ['#8B5CF6', '#7C3AED', '#6D28D9']
                    : isDark 
                      ? ['rgba(60,60,70,1)', 'rgba(50,50,60,1)']
                      : ['rgba(229, 231, 235, 1)', 'rgba(209, 213, 219, 1)']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendButton}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <MaterialCommunityIcons
                      name="send"
                      size={22}
                      color={input.trim() ? '#FFFFFF' : (isDark ? 'rgba(150,150,160,1)' : 'rgba(107, 114, 128, 1)')}
                    />
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  chatContainer: {
    height: height * 0.88,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: -20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 30,
    borderTopWidth: 2,
    borderLeftWidth: 0.5,
    borderRightWidth: 0.5,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: '25%',
    right: '25%',
    height: 4,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    zIndex: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  aiBadgeHeader: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  closeButton: {
    padding: 4,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 24,
    paddingBottom: 40,
  },
  messageWrapper: {
    marginBottom: 20,
    maxWidth: '82%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  aiWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  userBubble: {
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 8,
    fontWeight: '700',
    marginHorizontal: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  aiHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.3)',
  },
  aiBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#A78BFA',
    marginLeft: 5,
    letterSpacing: 1.2,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  thinkingText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    fontStyle: 'italic',
    letterSpacing: 0.3,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 12 : 20,
    borderTopWidth: 1,
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
  },
  inputGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 26,
    borderWidth: 1.5,
    paddingRight: 16,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  input: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 14,
    fontSize: 15,
    maxHeight: 110,
    fontWeight: '500',
    letterSpacing: 0.2,
    backgroundColor: 'transparent',
  },
  sendButtonContainer: {
    marginBottom: 2,
  },
  sendButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default AIChatModal;
