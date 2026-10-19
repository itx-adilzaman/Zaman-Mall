-- ============================================================
-- NOTIFICATIONS TABLE - Zaman Sons Super Mall
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id          UUID      DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID      REFERENCES public.profiles(id) ON DELETE CASCADE, -- Null means broadcast to ALL users
  title       TEXT      NOT NULL,
  body        TEXT      NOT NULL,
  type        TEXT      NOT NULL, -- 'support_reply', 'order_status', 'promotional'
  data        JSONB     DEFAULT '{}'::jsonb NOT NULL, -- Holds deep link URL, metadata, etc.
  read        BOOLEAN   DEFAULT false NOT NULL,
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policy 1: Select notifications (Users can read their own notifications, or broadcast notifications where user_id is null)
CREATE POLICY "Notifications are viewable by recipient or all"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy 2: Update notifications (Users can update their own notifications to mark them as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Manage notifications (Admins can insert and delete notifications)
CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete notifications"
  ON public.notifications FOR DELETE
  USING (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, read) WHERE read = false;
