import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ContactMessage } from "@/types";
import { useAuth } from "@/context/AuthContext";

export const useMessages = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
    isError,
    refetch
  } = useQuery<ContactMessage[]>({
    queryKey: ["messages", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`user_id.eq.${user.id},email.eq.${user.email}`);
        // Removed order by created_at as user reported it doesn't exist

      if (error) {
        console.error("Error fetching messages:", error);
        throw error;
      }

      return data.map((msg: any) => ({
        id: msg.id,
        userId: msg.user_id,
        name: msg.name,
        email: msg.email,
        subject: msg.subject,
        message: msg.message,
        date: msg.date || new Date().toISOString(), // Fallback if created_at is missing
        read: msg.read,
        reply: msg.reply,
        repliedAt: msg.replied_at,
        replyReadByUser: msg.reply_read_by_user
      }));
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds — avoid refetch on every render
    refetchOnWindowFocus: false,
  });

  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      
      // Update all messages with a reply to be read by user
      const { error } = await supabase
        .from("messages")
        .update({ reply_read_by_user: true })
        .eq("user_id", user.id)
        .not("reply", "is", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", user?.id] });
    },
  });

  return {
    messages,
    isLoading,
    isError,
    refetch,
    markAsRead: markAsRead.mutate
  };
};
