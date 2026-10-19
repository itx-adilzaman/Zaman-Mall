import { useEffect, useState, useCallback } from "react";
import * as Updates from "expo-updates";

interface OTAUpdateState {
  isUpdateReady: boolean;
  isChecking: boolean;
  error: string | null;
}

/**
 * useOTAUpdate
 * Checks for EAS OTA updates on app load.
 * When a new JS bundle is fully downloaded, sets isUpdateReady = true
 * so the UI can show a "Restart to Apply Update" popup.
 */
const useOTAUpdate = () => {
  const [state, setState] = useState<OTAUpdateState>({
    isUpdateReady: false,
    isChecking: false,
    error: null,
  });

  const checkAndFetchUpdate = useCallback(async () => {
    // expo-updates does not work in Expo Go or development builds without updates configured
    if (__DEV__) return;

    try {
      setState((prev) => ({ ...prev, isChecking: true, error: null }));

      const result = await Updates.checkForUpdateAsync();

      if (result.isAvailable) {
        // Download the update in the background
        await Updates.fetchUpdateAsync();
        // Bundle is now cached — safe to restart
        setState({ isUpdateReady: true, isChecking: false, error: null });
      } else {
        setState({ isUpdateReady: false, isChecking: false, error: null });
      }
    } catch (err: any) {
      // Silently fail — OTA errors should never crash the app
      console.warn("[OTA Update] Check failed:", err?.message ?? err);
      setState({ isUpdateReady: false, isChecking: false, error: err?.message ?? null });
    }
  }, []);

  useEffect(() => {
    checkAndFetchUpdate();
  }, [checkAndFetchUpdate]);

  const applyUpdate = useCallback(async () => {
    try {
      await Updates.reloadAsync();
    } catch (err) {
      console.warn("[OTA Update] Reload failed:", err);
    }
  }, []);

  return {
    isUpdateReady: state.isUpdateReady,
    isChecking: state.isChecking,
    error: state.error,
    applyUpdate,
  };
};

export default useOTAUpdate;
