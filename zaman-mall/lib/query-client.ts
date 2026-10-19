import { QueryClient, QueryCache, MutationCache, onlineManager } from "@tanstack/react-query";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import NetInfo from "@react-native-community/netinfo";

// 1. Setup Online Manager with NetInfo
onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected);
  });
});

// 2. Create Async Storage Persister
export const persister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 3000, // Throttle persistence to every 3 seconds
});

// 3. Create Query Client with Global Error Handling and Memory Optimization
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 30, // Reduced to 30 minutes for better memory management
      staleTime: 1000 * 60 * 2, // Reduced to 2 minutes
      retry: 2,
      networkMode: "offlineFirst",
      refetchOnWindowFocus: false, // Prevent unnecessary refetches
      refetchOnReconnect: true,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      // Ignore AbortError (cancelled requests)
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        return;
      }
      
      console.error("React Query Error:", error);
    },
    onSuccess: (data, query) => {
      // Clean up old queries periodically
      if (Math.random() < 0.1) { // 10% chance to cleanup
        queryClient.refetchQueries({ stale: true });
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error: any) => {
      // global error handler for all mutations
      console.error("Mutation Error:", error);
    },
  }),
});
