import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export interface DBNotification {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  type: 'support_reply' | 'order_status' | 'promotional';
  data: {
    url?: string;
    messageId?: string;
    [key: string]: any;
  };
  read: boolean;
  created_at: string;
}

const READ_BROADCASTS_KEY = "@zaman_read_broadcasts";

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [readBroadcastIds, setReadBroadcastIds] = useState<string[]>([]);

  // Load read broadcast IDs from local storage on mount
  useEffect(() => {
    const loadReadBroadcasts = async () => {
      try {
        const stored = await AsyncStorage.getItem(READ_BROADCASTS_KEY);
        if (stored) {
          setReadBroadcastIds(JSON.parse(stored));
        }
      } catch (e) {
        console.error("Failed to load read broadcasts:", e);
      }
    };
    loadReadBroadcasts();
  }, [user?.id]); // Reload when user changes

  // Fetch notifications
  const {
    data: rawNotifications = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<DBNotification[]>({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        throw error;
      }

      return data.map((n: any) => ({
        id: n.id,
        user_id: n.user_id,
        title: n.title,
        body: n.body,
        type: n.type,
        data: typeof n.data === "string" ? JSON.parse(n.data) : (n.data || {}),
        read: n.user_id ? n.read : false, // For broadcasts, read is computed client-side
        created_at: n.created_at,
      }));
    },
    enabled: !!user,
    staleTime: 10 * 1000, // 10 seconds cache validity
  });

  // Compute read status for each notification (including broadcasts)
  const notifications = rawNotifications.map((n) => {
    if (n.user_id === null) {
      // It's a broadcast. It is read if its ID is in our local storage list
      return { ...n, read: readBroadcastIds.includes(n.id) };
    }
    return n;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`user-notifications-realtime-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
        },
        () => {
          // Invalidate queries to fetch fresh data
          queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  // Mutation to mark all as read
  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;

      // 1. Mark personal notifications as read in Supabase
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false);

      if (error) {
        console.error("Error marking database notifications as read:", error);
      }

      // 2. Mark all loaded broadcasts as read in local storage
      const broadcastIds = rawNotifications
        .filter((n) => n.user_id === null)
        .map((n) => n.id);

      if (broadcastIds.length > 0) {
        const uniqueIds = Array.from(new Set([...readBroadcastIds, ...broadcastIds]));
        setReadBroadcastIds(uniqueIds);
        await AsyncStorage.setItem(READ_BROADCASTS_KEY, JSON.stringify(uniqueIds));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  return {
    notifications,
    unreadCount,
    isLoading,
    isError,
    refetch,
    markAsRead: markAsRead.mutate,
  };
};
