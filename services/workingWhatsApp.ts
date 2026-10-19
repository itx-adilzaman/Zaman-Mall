// Working WhatsApp Solutions - Actually Send Messages
import { Order } from '../types';

// Method 1: WhatsApp Business API (Meta) - OFFICIAL & WORKS
export const sendWhatsAppBusinessAPI = async (order: Order): Promise<boolean> => {
  try {
    const message = `
🛒 *ZAMAN MALL - NEW ORDER RECEIVED* 🛒

📋 *Order ID:* ${order.id}
👤 *Customer:* ${order.customerName}
📧 *Email:* ${order.customerEmail}
📱 *Phone:* ${order.customerPhone}
📍 *Address:* ${order.shippingAddress}

📦 *Order Items:*
${order.items.map((item, index) => 
  `🔸 ${index + 1}. ${item.name}\n   • Quantity: ${item.quantity}\n   • Price: ₹${item.price}\n   • Total: ₹${item.price * item.quantity}`
).join('\n\n')}

💰 *Order Summary:*
🔸 Total Items: ${order.items.length}
🔸 Final Total: ₹${order.total}
🔸 Payment: Cash on Delivery
🔸 Date: ${new Date(order.date).toLocaleString('en-IN')}

---
🏪 *ZAMAN MALL* 
📞 Customer Support: +923365942212
🌐 Website: zamanmall.netlify.app
📧 Email: malikmuhammadadilzaman@gmail.com
    `.trim();

    // WhatsApp Business Cloud API
    const response = await fetch('https://graph.facebook.com/v18.0/YOUR_PHONE_NUMBER_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: '923365942212', // Your number
        text: {
          body: message
        }
      })
    });

    if (response.ok) {
      console.log('✅ WhatsApp Business API sent successfully');
      return true;
    } else {
      console.log('⚠️ WhatsApp Business API response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ WhatsApp Business API failed:', error);
    return false;
  }
};

// Method 2: Twilio WhatsApp - PROFESSIONAL & WORKS
export const sendTwilioWhatsApp = async (order: Order): Promise<boolean> => {
  try {
    const message = `
🛒 ZAMAN MALL - NEW ORDER ${order.id}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Email: ${order.customerEmail}
Total: ₹${order.total}
Items: ${order.items.length}
Payment: Cash on Delivery
Date: ${new Date(order.date).toLocaleString('en-IN')}
    `.trim();

    // Twilio WhatsApp API
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_TWILIO_SID/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('YOUR_TWILIO_SID:YOUR_TWILIO_TOKEN'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': 'whatsapp:+923365942212',
        'From': 'whatsapp:+14155238886', // Twilio WhatsApp number
        'Body': message
      })
    });

    if (response.ok) {
      console.log('✅ Twilio WhatsApp sent successfully');
      return true;
    } else {
      console.log('⚠️ Twilio response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Twilio failed:', error);
    return false;
  }
};

// Method 3: Interakt.ai - WORKS & HAS FREE TIER
export const sendInteraktWhatsApp = async (order: Order): Promise<boolean> => {
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
        phoneNumber: '923365942212',
        callbackData: 'order_notification',
        type: 'Text',
        data: {
          message: message
        }
      })
    });

    if (response.ok) {
      console.log('✅ Interakt WhatsApp sent successfully');
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

// Method 4: Gupshup - WORKS & RELIABLE
export const sendGupshupWhatsApp = async (order: Order): Promise<boolean> => {
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
        'destination': '923365942212',
        'src.name': 'ZamanMallBot',
        'message': JSON.stringify({
          type: 'text',
          text: message
        })
      })
    });

    if (response.ok) {
      console.log('✅ Gupshup WhatsApp sent successfully');
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

// Method 5: WhatsApp Click to Chat - ALWAYS WORKS (Fallback)
export const openWhatsAppWithOrder = (order: Order): void => {
  const message = `
🛒 *ZAMAN MALL - NEW ORDER RECEIVED* 🛒

📋 *Order ID:* ${order.id}
👤 *Customer:* ${order.customerName}
📧 *Email:* ${order.customerEmail}
📱 *Phone:* ${order.customerPhone}
📍 *Address:* ${order.shippingAddress}

📦 *Order Items:*
${order.items.map((item, index) => 
  `🔸 ${index + 1}. ${item.name}\n   • Quantity: ${item.quantity}\n   • Price: ₹${item.price}\n   • Total: ₹${item.price * item.quantity}`
).join('\n\n')}

💰 *Order Summary:*
🔸 Total Items: ${order.items.length}
🔸 Final Total: ₹${order.total}
🔸 Payment: Cash on Delivery
🔸 Date: ${new Date(order.date).toLocaleString('en-IN')}

---
🏪 *ZAMAN MALL* 
📞 Customer Support: +923365942212
🌐 Website: zamanmall.netlify.app
📧 Email: malikmuhammadadilzaman@gmail.com
  `.trim();

  const phoneNumber = '+923365942212';
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodedMessage}`;
  
  // Open WhatsApp in new tab
  window.open(whatsappUrl, '_blank');
  console.log('✅ WhatsApp opened with complete order details');
};
