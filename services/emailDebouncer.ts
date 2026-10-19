// Email Debouncing and Rate Limiting Service
interface EmailRecord {
  email: string;
  lastSent: number;
  type: 'signup' | 'welcome' | 'contact' | 'order';
}

class EmailDebouncer {
  private static instance: EmailDebouncer;
  private emailRecords: Map<string, EmailRecord> = new Map();
  private readonly DEBOUNCE_TIME = 5000; // 5 seconds debounce
  private readonly RATE_LIMIT_TIME = 60000; // 1 minute rate limit for same email type
  private readonly CLEANUP_INTERVAL = 300000; // 5 minutes cleanup interval

  private constructor() {
    // Clean up old records periodically
    setInterval(() => this.cleanup(), this.CLEANUP_INTERVAL);
  }

  static getInstance(): EmailDebouncer {
    if (!EmailDebouncer.instance) {
      EmailDebouncer.instance = new EmailDebouncer();
    }
    return EmailDebouncer.instance;
  }

  // Check if email can be sent (debounce + rate limit)
  canSendEmail(email: string, type: EmailRecord['type']): { canSend: boolean; reason?: string } {
    const now = Date.now();
    const key = `${email}_${type}`;
    const record = this.emailRecords.get(key);

    // Check debounce (prevent duplicate sends within 5 seconds)
    if (record && (now - record.lastSent) < this.DEBOUNCE_TIME) {
      return { 
        canSend: false, 
        reason: `Debounce active: Please wait ${Math.ceil((this.DEBOUNCE_TIME - (now - record.lastSent)) / 1000)} seconds` 
      };
    }

    // Check rate limit (prevent same email type within 1 minute)
    if (record && (now - record.lastSent) < this.RATE_LIMIT_TIME) {
      return { 
        canSend: false, 
        reason: `Rate limit active: Please wait ${Math.ceil((this.RATE_LIMIT_TIME - (now - record.lastSent)) / 1000)} seconds` 
      };
    }

    return { canSend: true };
  }

  // Record that an email was sent
  recordEmailSent(email: string, type: EmailRecord['type']): void {
    const key = `${email}_${type}`;
    this.emailRecords.set(key, {
      email,
      type,
      lastSent: Date.now()
    });
  }

  // Clean up old records
  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.emailRecords.entries()) {
      if (now - record.lastSent > this.RATE_LIMIT_TIME * 2) {
        this.emailRecords.delete(key);
      }
    }
  }

  // Get all records for debugging
  getAllRecords(): EmailRecord[] {
    return Array.from(this.emailRecords.values());
  }

  // Clear all records (for testing)
  clearAllRecords(): void {
    this.emailRecords.clear();
  }
}

export const emailDebouncer = EmailDebouncer.getInstance();
export type { EmailRecord };
