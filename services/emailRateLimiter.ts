// Backend Email Rate Limiting Service for Supabase
import { supabase } from './supabase';

interface EmailLogEntry {
  id: string;
  email: string;
  type: 'signup' | 'welcome' | 'contact' | 'order';
  sent_at: string;
  user_id?: string;
}

class EmailRateLimiter {
  private static instance: EmailRateLimiter;
  
  private constructor() {}

  static getInstance(): EmailRateLimiter {
    if (!EmailRateLimiter.instance) {
      EmailRateLimiter.instance = new EmailRateLimiter();
    }
    return EmailRateLimiter.instance;
  }

  // Check if email can be sent based on backend records
  async canSendEmail(email: string, type: EmailLogEntry['type'], userId?: string): Promise<{ canSend: boolean; reason?: string }> {
    try {
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60000); // 1 minute ago
      const fiveMinutesAgo = new Date(now.getTime() - 300000); // 5 minutes ago

      // Check for same email type within last minute
      const { data: recentSameType, error: sameTypeError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('email', email)
        .eq('type', type)
        .gte('sent_at', oneMinuteAgo.toISOString())
        .maybeSingle();

      if (sameTypeError) {
        console.log('Rate limit check error (same type):', sameTypeError);
        // If DB check fails, allow sending but log the error
        return { canSend: true };
      }

      if (recentSameType) {
        const timeDiff = Math.ceil((now.getTime() - new Date(recentSameType.sent_at).getTime()) / 1000);
        return { 
          canSend: false, 
          reason: `Same email type sent recently. Please wait ${60 - timeDiff} seconds.` 
        };
      }

      // Check for any email to same user within last 5 minutes (prevent spam)
      const { data: recentAnyEmail, error: anyEmailError } = await supabase
        .from('email_logs')
        .select('*')
        .eq('email', email)
        .gte('sent_at', fiveMinutesAgo.toISOString())
        .order('sent_at', { ascending: false })
        .limit(3);

      if (anyEmailError) {
        console.log('Rate limit check error (any email):', anyEmailError);
        return { canSend: true };
      }

      if (recentAnyEmail && recentAnyEmail.length >= 3) {
        return { 
          canSend: false, 
          reason: 'Too many emails sent recently. Please wait a few minutes.' 
        };
      }

      return { canSend: true };

    } catch (error) {
      console.error('Email rate limit check failed:', error);
      // If check fails, allow sending but don't block the flow
      return { canSend: true };
    }
  }

  // Record that an email was sent successfully
  async recordEmailSent(email: string, type: EmailLogEntry['type'], userId?: string): Promise<void> {
    try {
      const logEntry: Partial<EmailLogEntry> = {
        id: crypto.randomUUID(),
        email,
        type,
        sent_at: new Date().toISOString(),
        user_id: userId
      };

      const { error } = await supabase
        .from('email_logs')
        .insert([logEntry]);

      if (error) {
        console.error('Failed to record email log:', error);
      } else {
        console.log(`✅ Email logged: ${type} to ${email}`);
      }
    } catch (error) {
      console.error('Email logging failed:', error);
    }
  }

  // Clean up old email logs (call this periodically)
  async cleanupOldLogs(daysToKeep = 7): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('email_logs')
        .delete()
        .lt('sent_at', cutoffDate.toISOString());

      if (error) {
        console.error('Failed to cleanup old email logs:', error);
      } else {
        console.log(`🧹 Cleaned up email logs older than ${daysToKeep} days`);
      }
    } catch (error) {
      console.error('Email log cleanup failed:', error);
    }
  }

  // Get email statistics for monitoring
  async getEmailStats(hours = 24): Promise<any> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - hours);

      const { data, error } = await supabase
        .from('email_logs')
        .select('type, sent_at')
        .gte('sent_at', cutoffDate.toISOString());

      if (error) {
        console.error('Failed to get email stats:', error);
        return null;
      }

      const stats = {
        total: data?.length || 0,
        byType: {} as Record<string, number>,
        timeRange: `Last ${hours} hours`
      };

      data?.forEach(log => {
        stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Failed to get email stats:', error);
      return null;
    }
  }
}

export const emailRateLimiter = EmailRateLimiter.getInstance();
export type { EmailLogEntry };
