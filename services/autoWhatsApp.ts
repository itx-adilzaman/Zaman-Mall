// Automatic WhatsApp Message Service
import { Order } from '../types';

// Method 1: Using WhatsApp Business API (Free Tier Available)
export const sendAutoWhatsApp = async (order: Order): Promise<boolean> => {
  try {
    const message = `
🛒 *ZAMAN MALL - NEW ORDER* 🛒

📋 *Order ID:* ${order.id}
👤 *Customer:* ${order.customerName}
📧 *Email:* ${order.customerEmail}
📱 *Phone:* ${order.customerPhone}
📍 *Address:* ${order.shippingAddress}

📦 *Order Items:*
${order.items.map(item => `• ${item.name} x${item.quantity} = ₹${item.price * item.quantity}`).join('\n')}

💰 *Total Amount:* ₹${order.total}
💳 *Payment:* Cash on Delivery
📅 *Date:* ${new Date(order.date).toLocaleString('en-IN')}

🔥 *Check your admin panel for details!*
    `.trim();

    // Using WhatsApp Business Cloud API (Meta)
    // This sends message directly to your number
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
      console.log('✅ Automatic WhatsApp sent successfully');
      return true;
    } else {
      console.log('⚠️ WhatsApp API response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Auto WhatsApp failed:', error);
    return false;
  }
};

// Method 2: Using Interakt (Free Tier Available)
export const sendWhatsAppViaInterakt = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - New Order ${order.id}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}\nTotal: ₹${order.total}`;

    const response = await fetch('https://api.interakt.ai/v1/public/message/', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic YOUR_INTERAKT_KEY',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        countryCode: '+91',
        phoneNumber: '923047770565',
        callbackData: 'order_notification',
        type: 'Text',
        data: {
          message: message
        }
      })
    });

    if (response.ok) {
      console.log('✅ Interakt WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ Interakt response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Interakt failed:', error);
    return false;
  }
};

// Method 3: Using Gupshup (Free Tier Available)
export const sendWhatsAppViaGupshup = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - New Order ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://api.gupshup.io/wa/api/v1/msg', {
      method: 'POST',
      headers: {
        'apikey': 'YOUR_GUPSHUP_API_KEY',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'channel': 'whatsapp',
        'source': '917834811114', // Gupshup WhatsApp number
        'destination': '923047770565',
        'src.name': 'ZamanMallBot',
        'message': JSON.stringify({
          type: 'text',
          text: message
        })
      })
    });

    if (response.ok) {
      console.log('✅ Gupshup WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ Gupshup response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Gupshup failed:', error);
    return false;
  }
};

// Method 4: Using Karix (Free Tier Available)
export const sendWhatsAppViaKarix = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - New Order ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://api.karix.io/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_KARIX_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: '1.0',
        payload: {
          source: {
            type: 'whatsapp',
            number: '917834811114'
          },
          destination: [{
            type: 'whatsapp',
            number: '923047770565'
          }],
          message: {
            content: {
              type: 'text',
              text: message
            }
          }
        }
      })
    });

    if (response.ok) {
      console.log('✅ Karix WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ Karix response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Karix failed:', error);
    return false;
  }
};

// Method 5: Using WATI (Free Trial Available)
export const sendWhatsAppViaWATI = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - New Order ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://api.wati.io/api/v1/sendTemplateMessage', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_WATI_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        whatsappNumber: '923047770565',
        templateName: 'order_notification',
        templateParams: [order.id, order.customerName, order.total.toString()]
      })
    });

    if (response.ok) {
      console.log('✅ WATI WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ WATI response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ WATI failed:', error);
    return false;
  }
};
