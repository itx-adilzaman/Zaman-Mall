// Direct WhatsApp message service - sends directly to your number
import { Order } from '../types';

// Method 1: Using WhatsApp Business API (Meta)
export const sendDirectWhatsApp = async (order: Order): Promise<boolean> => {
  try {
    // This requires WhatsApp Business API setup
    const message = `
🛒 NEW ORDER - ${order.id}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Email: ${order.customerEmail}
Total: ₹${order.total}
Items: ${order.items.length}
Payment: Cash on Delivery
Address: ${order.shippingAddress}
    `.trim();

    // WhatsApp Business API endpoint
    const response = await fetch('https://graph.facebook.com/v18.0/your-phone-number-id/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '923047770565', // Your number
        text: {
          body: message
        }
      })
    });

    if (response.ok) {
      console.log('✅ WhatsApp message sent directly');
      return true;
    } else {
      console.log('⚠️ WhatsApp API response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Direct WhatsApp failed:', error);
    return false;
  }
};

// Method 2: Using Twilio WhatsApp
export const sendTwilioWhatsApp = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 NEW ORDER - ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    // Twilio WhatsApp API
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_SID/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('YOUR_SID:YOUR_AUTH_TOKEN'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': 'whatsapp:+923047770565',
        'From': 'whatsapp:+14155238886', // Twilio WhatsApp number
        'Body': message
      })
    });

    if (response.ok) {
      console.log('✅ Twilio WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ Twilio response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Twilio WhatsApp failed:', error);
    return false;
  }
};

// Method 3: Using WhatsApp Business via MessageBird
export const sendWhatsAppViaMessageBird = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 NEW ORDER - ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://rest.messagebird.com/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'AccessKey YOUR_MESSAGEBIRD_KEY',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'to': '+923047770565',
        'from': 'YourBusinessName',
        'type': 'whatsapp',
        'content': {
          'text': message
        }
      })
    });

    if (response.ok) {
      console.log('✅ MessageBird WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ MessageBird response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ MessageBird WhatsApp failed:', error);
    return false;
  }
};

// Method 4: Using WhatsApp Business via 360dialog
export const sendWhatsAppVia360Dialog = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 NEW ORDER - ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://waba.360dialog.io/v1/messages', {
      method: 'POST',
      headers: {
        'D360-API-KEY': 'YOUR_360DIALOG_API_KEY',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'recipient_type': 'individual',
        'to': '923047770565',
        'type': 'text',
        'text': {
          'body': message
        }
      })
    });

    if (response.ok) {
      console.log('✅ 360dialog WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ 360dialog response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ 360dialog WhatsApp failed:', error);
    return false;
  }
};
