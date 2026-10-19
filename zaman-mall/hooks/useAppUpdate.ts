import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { AppState, Platform, Alert, Linking } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import { useState, useCallback, useEffect, useRef } from "react";

// Current app version - update this when releasing new versions
const CURRENT_APP_VERSION = "1.0.0";

interface AppVersion {
  id: string;
  version_code: string;
  download_url: string;
  is_critical: boolean;
  release_notes: string;
  created_at: string;
  updated_at: string;
}

interface DownloadProgress {
  isDownloading: boolean;
  isInitializing: boolean;
  progress: number; // 0-100
  downloadedBytes: number;
  totalBytes: number;
}

interface UseAppUpdateReturn {
  latestVersion: AppVersion | null;
  isLoading: boolean;
  error: Error | null;
  updateAvailable: boolean;
  isCritical: boolean;
  downloadProgress: DownloadProgress;
  downloadComplete: boolean;
  downloadedFileInfo: { fileUri: string; contentUri: string; fileSize: number } | null;
  checkForUpdates: () => Promise<unknown>;
  startDownload: () => Promise<void>;
  cancelDownload: () => void;
  dismissUpdate: () => void;
  openFileManager: () => Promise<void>;
}

// Compare version strings (e.g., "1.2.0" > "1.1.9")
const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split(".").map(Number);
  const v2Parts = version2.split(".").map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
};

const useAppUpdate = (): UseAppUpdateReturn => {
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress>({
    isDownloading: false,
    isInitializing: false,
    progress: 0,
    downloadedBytes: 0,
    totalBytes: 0,
  });
  const [downloadResumable, setDownloadResumable] = useState<FileSystem.DownloadResumable | null>(null);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [downloadedFileInfo, setDownloadedFileInfo] = useState<{ fileUri: string; contentUri: string; fileSize: number } | null>(null);
  const initializingIntervalRef = useRef<number | null>(null);

  // Fetch latest version from Supabase
  const {
    data: latestVersion,
    isLoading,
    error,
    refetch: checkForUpdates,
  } = useQuery<AppVersion | null>({
    queryKey: ["app_versions", "latest"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_versions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error("Error fetching app version:", error);
        throw error;
      }

      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 2,
  });

  // Check if update is available
  const updateAvailable = latestVersion
    ? compareVersions(latestVersion.version_code, CURRENT_APP_VERSION) > 0
    : false;

  const isCritical = latestVersion?.is_critical || false;

  // Start download (now shows initializing progress and redirects to browser)
  const startDownload = useCallback(async () => {
    if (!latestVersion || downloadProgress.isDownloading || downloadProgress.isInitializing) return;

    try {
      setDownloadProgress({
        isDownloading: false,
        isInitializing: true,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
      });

      // Show initializing progress for 10 seconds
      const totalDuration = 10000; // 10 seconds
      const updateInterval = 100; // Update every 100ms
      const totalSteps = totalDuration / updateInterval;
      let currentStep = 0;

      const intervalId = setInterval(() => {
        currentStep++;
        const progress = Math.min(100, Math.round((currentStep / totalSteps) * 100));
        
        setDownloadProgress(prev => ({
          ...prev,
          progress,
        }));

        if (currentStep >= totalSteps) {
          clearInterval(intervalId);
          initializingIntervalRef.current = null;
          
          // After 10 seconds, redirect to browser
          setDownloadProgress({
            isDownloading: false,
            isInitializing: false,
            progress: 0,
            downloadedBytes: 0,
            totalBytes: 0,
          });

          // Open browser for download
          Linking.openURL(latestVersion.download_url).catch(err => {
            console.error("Failed to open browser:", err);
            Alert.alert("Error", "Could not open browser for download. Please try again.");
          });
        }
      }, updateInterval);

      // Store interval ID for cleanup
      initializingIntervalRef.current = intervalId;
    } catch (error) {
      console.error("Download error:", error);
      setDownloadProgress({
        isDownloading: false,
        isInitializing: false,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
      });
      throw error;
    }
  }, [latestVersion, downloadProgress.isDownloading, downloadProgress.isInitializing]);

  // Cancel download
  const cancelDownload = useCallback(async () => {
    if (downloadResumable) {
      try {
        await downloadResumable.pauseAsync();
        setDownloadProgress({
          isDownloading: false,
          isInitializing: false,
          progress: 0,
          downloadedBytes: 0,
          totalBytes: 0,
        });
        setDownloadResumable(null);
      } catch (error) {
        console.error("Error canceling download:", error);
      }
    } else if (downloadProgress.isInitializing) {
      // Clear the initializing interval
      if (initializingIntervalRef.current) {
        clearInterval(initializingIntervalRef.current);
        initializingIntervalRef.current = null;
      }
      setDownloadProgress({
        isDownloading: false,
        isInitializing: false,
        progress: 0,
        downloadedBytes: 0,
        totalBytes: 0,
      });
    }
  }, [downloadResumable, downloadProgress.isInitializing]);

  // Dismiss update (for non-critical updates)
  const dismissUpdate = useCallback(() => {
    // Store dismissal timestamp to avoid showing again for a period
    // This could be enhanced with AsyncStorage
  }, []);

  // Open file manager to install APK
  const openFileManager = useCallback(async () => {
    if (!downloadedFileInfo) return;
    
    try {
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: downloadedFileInfo.contentUri,
        type: "application/vnd.android.package-archive",
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        category: "android.intent.category.DEFAULT",
      });
    } catch (openError) {
      console.log("Could not open file manager:", openError);
    }
  }, [downloadedFileInfo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (downloadResumable) {
        downloadResumable.pauseAsync().catch(console.error);
      }
    };
  }, [downloadResumable]);

  return {
    latestVersion: latestVersion || null,
    isLoading,
    error: error as Error | null,
    updateAvailable,
    isCritical,
    downloadProgress,
    downloadComplete,
    downloadedFileInfo,
    checkForUpdates: () => checkForUpdates(),
    startDownload,
    cancelDownload,
    dismissUpdate,
    openFileManager,
  };
};

export default useAppUpdate;
