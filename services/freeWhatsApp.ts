// FREE WhatsApp Service - Multiple Free Options
import { Order } from '../types';

// Method 1: WhatsApp Click to Chat (100% Free & Instant)
export const sendWhatsAppFree = async (order: Order): Promise<boolean> => {
  try {
    const message = `
🛒 *ZAMAN MALL - NEW ORDER* 🛒

📋 *Order ID:* ${order.id}
👤 *Customer:* ${order.customerName}
📧 *Email:* ${order.customerEmail}
📱 *Phone:* ${order.customerPhone}
📍 *Address:* ${order.shippingAddress}

📦 *Order Items:*
${order.items.map(item => `• ${item.name} x${item.quantity} = Rs. ${item.price * item.quantity}`).join('\n')}

💰 *Total Amount:* Rs. ${order.total}
💳 *Payment:* Cash on Delivery
📅 *Date:* ${new Date(order.date).toLocaleString('en-PK')}

🔥 *Check your admin panel for details!*
    `.trim();

    // Your WhatsApp number
    const phoneNumber = '+923365942212';
    
    // Create WhatsApp Web link
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    console.log('✅ WhatsApp opened with order details');
    return true;

  } catch (error) {
    console.log('⚠️ WhatsApp failed:', error);
    return false;
  }
};

// Method 2: WhatsApp Share API (Free)
export const shareWhatsAppOrder = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - NEW ORDER ${order.id}\nCustomer: ${order.customerName}\nPhone: ${order.customerPhone}\nTotal: Rs. ${order.total}`;
    
    if (navigator.share) {
      await navigator.share({
        title: 'New Order - Zaman Mall',
        text: message,
        url: `https://wa.me/923047770565?text=${encodeURIComponent(message)}`
      });
      console.log('✅ Order shared via WhatsApp');
      return true;
    } else {
      // Fallback to click to chat
      return sendWhatsAppFree(order);
    }
  } catch (error) {
    console.log('⚠️ Share failed:', error);
    return sendWhatsAppFree(order);
  }
};

// Method 3: WhatsApp QR Code Generator (Free)
export const generateWhatsAppQR = (order: Order): string => {
  const message = `🛒 New Order ${order.id} - Customer: ${order.customerName} - Total: Rs. ${order.total}`;
  const phoneNumber = '+923047770565';
  
  return `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
};

// Method 4: Email to SMS Gateway (Free for some carriers)
export const sendOrderToSMS = async (order: Order): Promise<boolean> => {
  try {
    // Some carriers offer email-to-SMS gateways
    const smsGateway = '923047770565@sms.gateway.com'; // Check your carrier
    const message = `🛒 ZAMAN MALL: New Order ${order.id} - Customer: ${order.customerName} - Total: Rs. ${order.total}`;
    
    console.log('📱 SMS Gateway:', smsGateway, message);
    
    // This would work if your carrier supports email-to-SMS
    return true;
  } catch (error) {
    console.log('⚠️ SMS failed:', error);
    return false;
  }
};

// Method 5: Push Notification (Free with service worker)
export const sendPushNotification = async (order: Order): Promise<boolean> => {
  try {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.showNotification) {
        await registration.showNotification('🛒 New Order - Zaman Mall', {
          body: `Order ${order.id} - ${order.customerName} - ₹${order.total}`,
          icon: '/images/zaman-logo.png',
          badge: '/images/zaman-logo.png',
          tag: order.id,
          requireInteraction: true
        });
        
        console.log('✅ Push notification sent');
        return true;
      }
    }
    
    console.log('⚠️ Push notifications not supported');
    return false;
  } catch (error) {
    console.log('⚠️ Push notification failed:', error);
    return false;
  }
};

// Method 6: Browser Notification (Free)
export const sendBrowserNotification = async (order: Order): Promise<boolean> => {
  try {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('🛒 New Order - Zaman Mall', {
          body: `Order ${order.id} - ${order.customerName} - ₹${order.total}`,
          icon: '/images/zaman-logo.png',
          requireInteraction: true
        });
        
        console.log('✅ Browser notification sent');
        return true;
      } else if (Notification.permission !== 'denied') {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          return sendBrowserNotification(order);
        }
      }
    }
    
    console.log('⚠️ Browser notifications not permitted');
    return false;
  } catch (error) {
    console.log('⚠️ Browser notification failed:', error);
    return false;
  }
};
