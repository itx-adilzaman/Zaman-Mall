// WhatsApp notification service - Multiple methods
import { Order } from '../types';

// Method 1: WhatsApp Web Link (Best & Free)
export const sendOrderToWhatsApp = async (order: Order): Promise<boolean> => {
  try {
    const message = `
🛒 *NEW ORDER RECEIVED* 🛒

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

    // Your WhatsApp number
    const phoneNumber = '+923047770565'; // Your actual number
    
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

// Method 2: Automatic notification (requires setup)
export const sendOrderToWhatsAppAuto = async (order: Order): Promise<boolean> => {
  try {
    // Using CallMeBot as backup
    const phoneNumber = '+921234567890'; // Replace with your WhatsApp number
    const apiKey = 'YOUR_CALLMEBOT_API_KEY'; // Get from callmebot.com
    
    const message = `🛒 NEW ORDER - ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;
    
    const response = await fetch(`https://api.callmebot.com/whatsapp.php?phone=${phoneNumber}&text=${encodeURIComponent(message)}&apikey=${apiKey}`, {
      method: 'GET'
    });

    if (response.ok) {
      console.log('✅ Auto WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ Auto WhatsApp failed, opening manual link');
      return sendOrderToWhatsApp(order);
    }

  } catch (error) {
    console.log('⚠️ Auto WhatsApp failed, opening manual link');
    return sendOrderToWhatsApp(order);
  }
};
