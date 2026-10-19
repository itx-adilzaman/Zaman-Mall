import React, { useState, useRef, useEffect } from 'react';
import { View, TouchableOpacity, ActivityIndicator, StyleSheet, Animated, Platform, Text, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/context/ThemeContext';

interface LiquidGlassVideoPlayerProps {
  videoUrl: string;
  height: number;
  width: number;
}

const LiquidGlassVideoPlayer: React.FC<LiquidGlassVideoPlayerProps> = ({ videoUrl, height, width }) => {
  const { colors } = useTheme();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  
  // Animation for controls (only bottom bar)
  const controlsOpacity = useRef(new Animated.Value(0)).current;

  const position = status && 'positionMillis' in status ? status.positionMillis : 0;
  const duration = status && 'durationMillis' in status ? status.durationMillis : 0;
  const progress = duration > 0 ? position / duration : 0;

  useEffect(() => {
    // Show bottom controls briefly then fade out
    fadeInControls();
    const timer = setTimeout(fadeOutControls, 3000);
    return () => clearTimeout(timer);
  }, []);

  const fadeOutControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const fadeInControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const toggleControls = () => {
    const currentOpacity = (controlsOpacity as any)._value;
    if (currentOpacity < 0.5) {
      fadeInControls();
    } else {
      fadeOutControls();
    }
  };

  const handleSeek = (event: any) => {
    const { locationX } = event.nativeEvent;
    const seekPosition = (locationX / (width - 40)) * duration;
    if (videoRef.current) {
      videoRef.current.setPositionAsync(seekPosition);
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = millis / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.setIsMutedAsync(!isMuted);
    }
  };

  return (
    <View style={{ width, height, position: 'relative', overflow: 'hidden', backgroundColor: '#000' }}>
      <TouchableOpacity 
        activeOpacity={1} 
        onPress={toggleControls}
        style={StyleSheet.absoluteFill}
      >
        <Video
          ref={videoRef}
          source={{ uri: videoUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode={ResizeMode.COVER}
          isLooping
          shouldPlay={true}
          isMuted={isMuted}
          useNativeControls={false}
          onPlaybackStatusUpdate={setStatus}
          onLoadStart={() => setIsLoading(true)}
          onLoad={() => {
            setIsLoading(false);
          }}
          onError={(error) => {
            console.error("Video Error:", error);
            setIsLoading(false);
          }}
        />
      </TouchableOpacity>

      {isLoading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      )}

      {/* BOTTOM CONTROLS */}
      <Animated.View 
        style={[
          styles.bottomControls,
          { opacity: controlsOpacity }
        ]}
      >
        <BlurView intensity={30} tint="dark" style={styles.bottomBlur}>
          <View className="flex-row items-center justify-between px-4 py-2">
            <Text style={styles.timeText}>{formatTime(position)}</Text>
            
            {/* PROGRESS BAR */}
            <TouchableOpacity 
              activeOpacity={1} 
              onPress={handleSeek}
              style={styles.progressBarContainer}
            >
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${progress * 100}%` }
                  ]} 
                />
              </View>
            </TouchableOpacity>

            <Text style={styles.timeText}>{formatTime(duration)}</Text>

            <TouchableOpacity onPress={toggleMute} className="ml-2">
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-high"} 
                size={20} 
                color="#FFF" 
              />
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  bottomBlur: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  timeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
    minWidth: 35,
    textAlign: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 20,
    justifyContent: 'center',
    marginHorizontal: 10,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 2,
  },
  liquidGlassContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 15,
  },
  blurEffect: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blueGlow: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2563EB',
    opacity: 0.3,
  },
  iconShadow: {
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    marginLeft: 6,
  }
});

export default LiquidGlassVideoPlayer;
