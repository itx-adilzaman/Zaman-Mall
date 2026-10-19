// Real WhatsApp API Services - Actually Send Messages
import { Order } from '../types';

// Method 1: CallMeBot (100% Free - Actually Works!)
export const sendWhatsAppViaCallMeBot = async (order: Order): Promise<boolean> => {
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

    // CallMeBot API - Actually sends WhatsApp messages
    const phoneNumber = '+923365942212'; // Your WhatsApp number
    const apiKey = 'YOUR_CALLMEBOT_API_KEY'; // Get from callmebot.com - Replace this
    
    const response = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phoneNumber.replace('+', '')}&text=${encodeURIComponent(message)}&apikey=${apiKey}`, {
      method: 'GET'
    });

    if (response.ok) {
      console.log('✅ CallMeBot WhatsApp sent successfully');
      return true;
    } else {
      console.log('⚠️ CallMeBot response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ CallMeBot failed:', error);
    return false;
  }
};

// Method 2: WhatsApp Business API (Meta) - Most Reliable
export const sendWhatsAppViaBusinessAPI = async (order: Order): Promise<boolean> => {
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

// Method 3: Twilio WhatsApp (Professional)
export const sendWhatsAppViaTwilio = async (order: Order): Promise<boolean> => {
  try {
    const message = `
🛒 ZAMAN MALL - NEW ORDER ${order.id}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Total: ₹${order.total}
Items: ${order.items.length}
Payment: Cash on Delivery
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

// Method 4: WhatsApp Click to Chat (Fallback - Always Works)
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
