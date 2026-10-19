// Enhanced Rate Limit Handler for Supabase Auth
import { supabase } from './supabase';

interface RateLimitState {
  isRateLimited: boolean;
  cooldownRemaining: number;
  lastAttempt: number | null;
}

const COOLDOWN_DURATION = 60000; // 60 seconds
const RATE_LIMIT_STORAGE_KEY = 'supabase_signup_rate_limit';

class RateLimitHandler {
  private static instance: RateLimitHandler;
  private state: RateLimitState;

  private constructor() {
    this.state = this.loadState();
    this.startCooldownTimer();
  }

  static getInstance(): RateLimitHandler {
    if (!RateLimitHandler.instance) {
      RateLimitHandler.instance = new RateLimitHandler();
    }
    return RateLimitHandler.instance;
  }

  private loadState(): RateLimitState {
    try {
      const stored = localStorage.getItem(RATE_LIMIT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        
        // Check if cooldown has expired
        if (parsed.lastAttempt && (now - parsed.lastAttempt) < COOLDOWN_DURATION) {
          return {
            isRateLimited: true,
            cooldownRemaining: Math.ceil((COOLDOWN_DURATION - (now - parsed.lastAttempt)) / 1000),
            lastAttempt: parsed.lastAttempt
          };
        }
      }
    } catch (error) {
      console.log('Failed to load rate limit state:', error);
    }
    
    return {
      isRateLimited: false,
      cooldownRemaining: 0,
      lastAttempt: null
    };
  }

  private saveState(): void {
    try {
      localStorage.setItem(RATE_LIMIT_STORAGE_KEY, JSON.stringify(this.state));
    } catch (error) {
      console.log('Failed to save rate limit state:', error);
    }
  }

  private startCooldownTimer(): void {
    if (this.state.cooldownRemaining > 0) {
      const interval = setInterval(() => {
        this.state.cooldownRemaining--;
        
        if (this.state.cooldownRemaining <= 0) {
          this.state.isRateLimited = false;
          this.state.lastAttempt = null;
          clearInterval(interval);
        }
        
        this.saveState();
      }, 1000);
    }
  }

  // Check if current error is a rate limit error
  isRateLimitError(error: any): boolean {
    if (!error) return false;
    
    const errorMessage = error.message?.toLowerCase() || '';
    const errorStatus = error.status;
    
    return (
      errorMessage.includes('rate limit') ||
      errorMessage.includes('too many requests') ||
      errorMessage.includes('email already been registered') ||
      errorMessage.includes('for security purposes') ||
      errorMessage.includes('signup disabled') ||
      errorMessage.includes('duplicate email') ||
      errorStatus === 429 ||
      errorStatus === 425
    );
  }

  // Handle rate limit error
  handleRateLimit(): { isRateLimited: boolean; message: string; cooldownRemaining: number } {
    this.state.isRateLimited = true;
    this.state.lastAttempt = Date.now();
    this.state.cooldownRemaining = 60;
    
    this.saveState();
    this.startCooldownTimer();
    
    return {
      isRateLimited: true,
      message: "Verification email already sent, please check your inbox. If you don't see it, check your spam folder.",
      cooldownRemaining: 60
    };
  }

  // Check if user can attempt signup
  canAttemptSignup(): { canAttempt: boolean; cooldownRemaining: number } {
    if (this.state.isRateLimited && this.state.cooldownRemaining > 0) {
      return { canAttempt: false, cooldownRemaining: this.state.cooldownRemaining };
    }
    
    return { canAttempt: true, cooldownRemaining: 0 };
  }

  // Reset rate limit state
  reset(): void {
    this.state = {
      isRateLimited: false,
      cooldownRemaining: 0,
      lastAttempt: null
    };
    this.saveState();
  }

  // Get current state
  getState(): RateLimitState {
    return { ...this.state };
  }
}

export const rateLimitHandler = RateLimitHandler.getInstance();

// Enhanced signup function with rate limit handling
export const signupWithRateLimit = async (email: string, password: string, options?: any) => {
  // Check if user can attempt signup
  const { canAttempt, cooldownRemaining } = rateLimitHandler.canAttemptSignup();
  
  if (!canAttempt) {
    return {
      success: false,
      message: `Please wait ${cooldownRemaining} seconds before trying again.`,
      cooldownRemaining
    };
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options
    });

    if (error) {
      // Check if it's a rate limit error
      if (rateLimitHandler.isRateLimitError(error)) {
        const rateLimitResponse = rateLimitHandler.handleRateLimit();
        return {
          success: false,
          message: rateLimitResponse.message,
          cooldownRemaining: rateLimitResponse.cooldownRemaining
        };
      }
      
      // Handle other errors
      return {
        success: false,
        message: error.message || 'Signup failed'
      };
    }

    // Successful signup
    return {
      success: true,
      message: 'Account created! Please check your email to verify your account.',
      user: data.user
    };

  } catch (error: any) {
    // Check if caught error is rate limit related
    if (rateLimitHandler.isRateLimitError(error)) {
      const rateLimitResponse = rateLimitHandler.handleRateLimit();
      return {
        success: false,
        message: rateLimitResponse.message,
        cooldownRemaining: rateLimitResponse.cooldownRemaining
      };
    }
    
    return {
      success: false,
      message: error?.message || 'An unexpected error occurred'
    };
  }
};
