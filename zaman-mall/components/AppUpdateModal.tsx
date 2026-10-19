import React, { useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Download, X, AlertTriangle, CheckCircle, RefreshCw, Sparkles, ArrowRight } from "lucide-react-native";
import useAppUpdate from "@/hooks/useAppUpdate";
import PremiumButton from "@/components/PremiumButton";

const { width, height } = Dimensions.get("window");

interface AppUpdateModalProps {
  visible: boolean;
  onClose?: () => void;
}

const AppUpdateModal: React.FC<AppUpdateModalProps> = ({ visible, onClose }) => {
  const {
    latestVersion,
    updateAvailable,
    isCritical,
    downloadProgress,
    downloadComplete,
    downloadedFileInfo,
    startDownload,
    cancelDownload,
    dismissUpdate,
    openFileManager,
  } = useAppUpdate();

  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleUpdateNow = async () => {
    try {
      await startDownload();
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  const handleCancel = () => {
    if (downloadProgress.isDownloading || downloadProgress.isInitializing) {
      cancelDownload();
    } else if (!isCritical) {
      dismissUpdate();
      onClose?.();
    }
  };

  if (!updateAvailable || !latestVersion) return null;

  const progressPercent = downloadProgress.progress; // 0-100 number

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        if (!isCritical && !downloadProgress.isDownloading && !downloadProgress.isInitializing) {
          handleCancel();
        }
      }}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Premium Header with Animated Gradient */}
          <LinearGradient
            colors={isCritical 
              ? ["#dc2626", "#b91c1c", "#991b1b"]
              : ["#10b981", "#3b82f6", "#2563eb"]
            }
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerContent}>
              <View style={styles.iconContainer}>
                {isCritical ? (
                  <AlertTriangle size={56} color="#ffffff" strokeWidth={2} />
                ) : (
                  <Sparkles size={56} color="#fbbf24" strokeWidth={2} />
                )}
              </View>
              <Text style={styles.title}>
                {isCritical ? "Critical Update" : "New Update Available"}
              </Text>
              <Text style={styles.subtitle}>
                Version {latestVersion.version_code}
              </Text>
              <View style={styles.badge}>
                <Sparkles size={14} color="#fbbf24" strokeWidth={2.5} />
                <Text style={styles.badgeText}>Enhanced Experience</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            {/* Release Notes */}
            <View style={styles.releaseNotesContainer}>
              <Text style={styles.releaseNotesLabel}>What's New:</Text>
              <Text style={styles.releaseNotesText}>
                {latestVersion.release_notes || "Bug fixes and performance improvements."}
              </Text>
            </View>

            {/* Download Progress */}
            {(downloadProgress.isDownloading || downloadProgress.isInitializing) && (
              <View style={styles.progressContainer}>
                <View style={styles.progressInfo}>
                  <RefreshCw
                    size={20}
                    color="#2563eb"
                    strokeWidth={2.5}
                    style={styles.spinner}
                  />
                  <Text style={styles.progressText}>
                    {downloadProgress.isInitializing ? "Initializing..." : "Downloading..."} {downloadProgress.progress}%
                  </Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={[styles.progressBar, { width: `${progressPercent}%` as any }]} />
                </View>
                {!downloadProgress.isInitializing && (
                  <Text style={styles.progressSize}>
                    {((downloadProgress.downloadedBytes / 1024 / 1024).toFixed(2))} MB /{" "}
                    {((downloadProgress.totalBytes / 1024 / 1024).toFixed(2))} MB
                  </Text>
                )}
              </View>
            )}

            {/* Success State - Download Complete */}
            {downloadComplete && downloadedFileInfo && (
              <View style={styles.successContainer}>
                <LinearGradient
                  colors={["#10b981", "#059669"]}
                  style={styles.successIconContainer}
                >
                  <CheckCircle size={56} color="#ffffff" strokeWidth={2.5} />
                </LinearGradient>
                <Text style={styles.successTitle}>Download Complete!</Text>
                <Text style={styles.successSubtitle}>
                  APK has been downloaded successfully
                </Text>
                <View style={styles.fileInfoContainer}>
                  <Text style={styles.fileInfoLabel}>File Size:</Text>
                  <Text style={styles.fileInfoValue}>
                    {((downloadedFileInfo.fileSize / 1024 / 1024).toFixed(2))} MB
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.button, styles.openFileManagerButton]}
                  onPress={openFileManager}
                  activeOpacity={0.8}
                >
                  <Text style={styles.openFileManagerButtonText}>Open File Manager</Text>
                  <ArrowRight size={20} color="#ffffff" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            )}

            {/* Critical Warning */}
            {isCritical && !downloadProgress.isDownloading && !downloadProgress.isInitializing && (
              <View style={styles.warningContainer}>
                <AlertTriangle size={24} color="#dc2626" strokeWidth={2} />
                <Text style={styles.warningText}>
                  This update is required to continue using the app.
                </Text>
              </View>
            )}
          </View>

          {/* Footer Actions */}
          <View style={styles.footer}>
            {!isCritical && !downloadProgress.isDownloading && !downloadProgress.isInitializing && (
              <PremiumButton
                title="Later"
                colors={["#00ffaa", "#1488fd"] as [string, string]}
                onPress={handleCancel}
                textStyle={{ color: "#000000", fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}
              />
            )}

            {downloadProgress.isDownloading || downloadProgress.isInitializing ? (
              <PremiumButton
                title="Cancel"
                colors={["#f8fafc", "#f8fafc"] as [string, string]}
                onPress={handleCancel}
                textStyle={{ color: "#000000", fontSize: 17, fontWeight: "700", letterSpacing: -0.2 }}
              />
            ) : (
              <PremiumButton
                title={downloadProgress.progress === 100 ? "Installing..." : "Update Now"}
                colors={isCritical ? ["#dc2626", "#b91c1c"] as [string, string] : ["#1488fd", "#00ffaa"] as [string, string]}
                onPress={handleUpdateNow}
                disabled={downloadProgress.progress === 100}
                textStyle={{ fontSize: 17, fontWeight: "800", letterSpacing: -0.3, color: "#000000" }}
              />
            )}
          </View>

          {/* Close Button (only for non-critical updates) */}
          {!isCritical && !downloadProgress.isDownloading && !downloadProgress.isInitializing && (
            <TouchableOpacity
              style={styles.closeButton}
              onPress={handleCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={24} color="#64748b" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 32,
    width: width * 0.9,
    maxWidth: 400,
    overflow: "hidden",
    elevation: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
  },
  header: {
    padding: 36,
    paddingTop: 44,
    paddingBottom: 28,
  },
  headerContent: {
    alignItems: "center",
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.95)",
    textAlign: "center",
    letterSpacing: 0.3,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: "rgba(251, 191, 36, 0.4)",
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fbbf24",
    marginLeft: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  content: {
    padding: 24,
    paddingTop: 0,
  },
  releaseNotesContainer: {
    marginBottom: 20,
  },
  releaseNotesLabel: {
    marginTop: 15,
    fontSize: 20,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 8,
    letterSpacing: -0.2,
    textAlign: "center",
  },
  releaseNotesText: {
    fontSize: 20,
    lineHeight: 22,
    color: "#475569",
    letterSpacing: 0.1,
    textAlign: "center",
  },
  progressContainer: {
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  progressInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  spinner: {
    marginRight: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#2563eb",
    letterSpacing: -0.1,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#2563eb",
    borderRadius: 5,
  },
  progressSize: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
    fontWeight: "500",
  },
  successContainer: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#f0fdf4",
    borderRadius: 16,
    marginBottom: 18,
    borderWidth: 2,
    borderColor: "#bbf7d0",
  },
  successIconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#10b981",
    marginBottom: 6,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  successSubtitle: {
    fontSize: 15,
    fontWeight: "500",
    color: "#475569",
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  fileInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    width: "100%",
  },
  fileInfoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  fileInfoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f172a",
  },
  openFileManagerButton: {
    backgroundColor: "#10b981",
    elevation: 8,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  openFileManagerButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  warningText: {
    fontSize: 13,
    color: "#dc2626",
    marginLeft: 12,
    flex: 1,
    fontWeight: "600",
    lineHeight: 20,
  },
  footer: {
    flexDirection: "column",
    padding: 20,
    paddingTop: 0,
    gap: 10,
  },
  button: {
    width: "100%",
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
  },
  cancelButton: {
    backgroundColor: "#f8fafc",
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#475569",
    letterSpacing: -0.2,
    textAlign: "center",
    paddingVertical: 16,
  },
  updateButton: {
    backgroundColor: "#2563eb",
    elevation: 8,
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  updateButtonCritical: {
    backgroundColor: "#dc2626",
    shadowColor: "#dc2626",
  },
  updateButtonText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.3,
    textAlign: "center",
    paddingVertical: 16,
  },
  closeButton: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
});

export default AppUpdateModal;
