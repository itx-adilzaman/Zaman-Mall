-- Email Logs Table for Rate Limiting and Tracking
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('signup', 'welcome', 'contact', 'order')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_email_type ON email_logs(email, type);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON email_logs(user_id);

-- Row Level Security (RLS)
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own email logs
CREATE POLICY "Users can view own email logs" ON email_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Service can insert email logs (for system emails)
CREATE POLICY "Service can insert email logs" ON email_logs
  FOR INSERT WITH CHECK (true);

-- Policy: Admin can view all email logs
CREATE POLICY "Admin can view all email logs" ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'malikmuhammadadilzaman@gmail.com'
    )
  );
