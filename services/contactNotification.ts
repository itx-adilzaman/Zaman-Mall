// Contact Notification Service
import { User, ContactMessage } from '../types';
import { emailDebouncer } from './emailDebouncer';
import { emailRateLimiter } from './emailRateLimiter';

// Send contact form email to admin
export const sendContactFormEmail = async (message: ContactMessage): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('access_key', 'c8f29373-4d3a-4355-8dcb-83bcb5809716');
    formData.append('subject', `📧 New Contact Form Message - ${message.subject}`);
    formData.append('from_name', 'Zaman Mall Contact Form');
    formData.append('to', 'malikmuhammadadilzaman@gmail.com');
    
    const emailContent = `
📧 ZAMAN MALL - NEW CONTACT FORM MESSAGE 📧

📋 MESSAGE DETAILS:
🔸 From: ${message.name}
🔸 Email: ${message.email}
🔸 Subject: ${message.subject}
🔸 Date: ${new Date(message.date).toLocaleString('en-IN', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit' 
})}

💬 MESSAGE:
${message.message}

---
🏪 ZAMAN MALL 
📞 Customer Support: +923365942212
🌐 Website: zamanmall.netlify.app
📧 Email: malikmuhammadadilzaman@gmail.com

This is an automated notification from Zaman Mall Contact Form.
    `;
    
    formData.append('message', emailContent);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log('✅ Contact form email sent successfully');
      return true;
    } else {
      console.log('⚠️ Contact form email failed:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Contact form email service failed:', error);
    return false;
  }
};

// Helper function with retry logic for rate limiting
const sendEmailWithRetry = async (emailFunction: () => Promise<boolean>, maxRetries = 3): Promise<boolean> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await emailFunction();
      if (result) return true;
      
      // If failed but not last attempt, wait with exponential backoff
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
        console.log(`⚠️ Email attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error: any) {
      // Check for rate limiting error (429)
      if (error?.message?.includes('429') || error?.message?.includes('rate limit')) {
        if (attempt < maxRetries) {
          const delay = Math.min(5000 * Math.pow(2, attempt - 1), 30000); // Max 30 seconds for rate limiting
          console.log(`⚠️ Rate limited, attempt ${attempt}/${maxRetries}, waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // For other errors, don't retry
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  return false;
};

// Send new user signup notification to admin
export const sendNewUserSignupEmail = async (user: User): Promise<boolean> => {
  // Check frontend debouncing first
  const debounceCheck = emailDebouncer.canSendEmail(user.email, 'signup');
  if (!debounceCheck.canSend) {
    console.log(`⚠️ Signup email skipped (debounce): ${debounceCheck.reason}`);
    return false;
  }

  // Check backend rate limiting
  const rateLimitCheck = await emailRateLimiter.canSendEmail(user.email, 'signup', user.id);
  if (!rateLimitCheck.canSend) {
    console.log(`⚠️ Signup email skipped (rate limit): ${rateLimitCheck.reason}`);
    return false;
  }

  const emailFunction = async (): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('access_key', 'c8f29373-4d3a-4355-8dcb-83bcb5809716');
      formData.append('subject', `👤 New User Signup - ${user.name}`);
      formData.append('from_name', 'Zaman Mall User Registration');
      formData.append('to', 'malikmuhammadadilzaman@gmail.com');
      
      const emailContent = `
👤 ZAMAN MALL - NEW USER SIGNUP 👤

📋 USER DETAILS:
🔸 Name: ${user.name}
🔸 Email: ${user.email}
🔸 Role: ${user.role}
🔸 User ID: ${user.id}
🔸 Join Date: ${new Date(user.joinedDate).toLocaleString('en-IN', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit' 
})}

🎉 A new user has successfully registered on Zaman Mall!

---
🏪 ZAMAN MALL 
📞 Customer Support: +923365942212
🌐 Website: zamanmall.netlify.app
📧 Email: malikmuhammadadilzaman@gmail.com

This is an automated notification from Zaman Mall User Registration.
      `;
      
      formData.append('message', emailContent);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        console.log('✅ New user signup email sent successfully');
        // Record that email was sent successfully in both systems
        emailDebouncer.recordEmailSent(user.email, 'signup');
        await emailRateLimiter.recordEmailSent(user.email, 'signup', user.id);
        return true;
      } else {
        const errorText = await response.text();
        console.log('⚠️ New user signup email failed:', errorText);
        throw new Error(errorText);
      }

    } catch (error) {
      console.log('⚠️ New user signup email service failed:', error);
      throw error;
    }
  };

  return sendEmailWithRetry(emailFunction);
};

// Send welcome email to new user
export const sendWelcomeEmailToUser = async (user: User): Promise<boolean> => {
  // Check frontend debouncing first
  const debounceCheck = emailDebouncer.canSendEmail(user.email, 'welcome');
  if (!debounceCheck.canSend) {
    console.log(`⚠️ Welcome email skipped (debounce): ${debounceCheck.reason}`);
    return false;
  }

  // Check backend rate limiting
  const rateLimitCheck = await emailRateLimiter.canSendEmail(user.email, 'welcome', user.id);
  if (!rateLimitCheck.canSend) {
    console.log(`⚠️ Welcome email skipped (rate limit): ${rateLimitCheck.reason}`);
    return false;
  }

  const emailFunction = async (): Promise<boolean> => {
    try {
      const formData = new FormData();
      formData.append('access_key', 'c8f29373-4d3a-4355-8dcb-83bcb5809716');
      formData.append('subject', '🎉 Welcome to Zaman Mall!');
      formData.append('from_name', 'Zaman Mall');
      formData.append('to', user.email); // Send to user's email, not admin
      
      console.log(`📧 Sending welcome email to: ${user.email}`);
      
      const emailContent = `
🎉 WELCOME TO ZAMAN MALL! 🎉

Dear ${user.name},

Thank you for joining Zaman Mall! We're excited to have you as part of our community.

🛍️ WHAT YOU CAN DO:
• Browse our wide range of products
• Add items to your cart and checkout easily
• Track your orders
• Save your favorite items
• Manage your addresses
• Contact us for any support

🔐 YOUR ACCOUNT:
🔸 Email: ${user.email}
🔸 Name: ${user.name}
🔸 Member Since: ${new Date(user.joinedDate).toLocaleDateString('en-IN')}

📞 GET IN TOUCH:
If you need any help, we're here for you!
• Customer Support: +923365942212
• Email: malikmuhammadadilzaman@gmail.com
• Website: zamanmall.netlify.app

🛒 Start shopping now and enjoy the best deals at Zaman Mall!

Thank you for choosing us!
Happy Shopping! 🛍️✨

---
🏪 ZAMAN MALL 
📞 Customer Support: +923365942212
🌐 Website: zamanmall.netlify.app
📧 Email: malikmuhammadadilzaman@gmail.com

This is an automated welcome email from Zaman Mall.
      `;
      
      formData.append('message', emailContent);

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        console.log('✅ Welcome email sent successfully to user');
        // Record that email was sent successfully in both systems
        emailDebouncer.recordEmailSent(user.email, 'welcome');
        await emailRateLimiter.recordEmailSent(user.email, 'welcome', user.id);
        return true;
      } else {
        const errorText = await response.text();
        console.log('⚠️ Welcome email failed:', errorText);
        throw new Error(errorText);
      }

    } catch (error) {
      console.log('⚠️ Welcome email service failed:', error);
      throw error;
    }
  };

  return sendEmailWithRetry(emailFunction);
};