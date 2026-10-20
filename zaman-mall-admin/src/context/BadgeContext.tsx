import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface BadgeCounts {
  Orders: number;
  Returns: number;
  Messages: number;
  Users: number;
  Products: number;
}

interface BadgeContextType {
  badges: BadgeCounts;
  refreshBadges: () => void;
}

const BadgeContext = createContext<BadgeContextType>({
  badges: { Orders: 0, Returns: 0, Messages: 0, Users: 0, Products: 0 },
  refreshBadges: () => {},
});

export const BadgeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [badges, setBadges] = useState<BadgeCounts>({
    Orders: 0, Returns: 0, Messages: 0, Users: 0, Products: 0,
  });

  const refreshBadges = useCallback(async () => {
    try {
      const [ordersRes, messagesRes, returnsRes] = await Promise.all([
        supabase.from('orders').select('id, status').eq('status', 'pending'),
        supabase.from('messages').select('id, read').eq('read', false),
        supabase.from('orders').select('id, return_request').not('return_request', 'is', null),
      ]);

      // Pending returns count
      const pendingReturns = (returnsRes.data || []).filter((o: any) => {
        const rr = typeof o.return_request === 'string'
          ? JSON.parse(o.return_request) : o.return_request;
        return rr?.status === 'pending';
      }).length;

      setBadges({
        Orders:   (ordersRes.data || []).length,
        Returns:  pendingReturns,
        Messages: (messagesRes.data || []).length,
        Users:    0,
        Products: 0,
      });
    } catch (err) {
      console.error('Badge fetch error:', err);
    }
  }, []);

  useEffect(() => {
    refreshBadges();

    // Realtime subscriptions
    const orderSub = supabase
      .channel('badge-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, refreshBadges)
      .subscribe();

    const msgSub = supabase
      .channel('badge-messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, refreshBadges)
      .subscribe();

    return () => {
      supabase.removeChannel(orderSub);
      supabase.removeChannel(msgSub);
    };
  }, [refreshBadges]);

  return (
    <BadgeContext.Provider value={{ badges, refreshBadges }}>
      {children}
    </BadgeContext.Provider>
  );
};

export const useBadges = () => useContext(BadgeContext);
