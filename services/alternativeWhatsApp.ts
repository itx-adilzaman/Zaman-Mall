// Alternative WhatsApp notification services
import { Order } from '../types';

// Method 1: WhatsApp Business API (Meta)
export const sendWhatsAppBusinessAPI = async (order: Order): Promise<boolean> => {
  try {
    const message = `
🛒 *NEW ORDER* - ${order.id}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Total: ₹${order.total}
Items: ${order.items.length}
    `;

    // This requires WhatsApp Business API setup
    // You need to apply for WhatsApp Business API
    console.log('📱 WhatsApp Business API:', message);
    return true;
  } catch (error) {
    console.log('⚠️ WhatsApp Business API failed:', error);
    return false;
  }
};

// Method 2: WhatsApp Web Link (Opens WhatsApp with pre-filled message)
export const openWhatsAppWithOrder = (order: Order): void => {
  const message = `
🛒 NEW ORDER - ${order.id}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Email: ${order.customerEmail}
Total: ₹${order.total}
Items: ${order.items.map(item => `${item.name} x${item.quantity}`).join(', ')}
Address: ${order.shippingAddress}
  `.trim();

  const phoneNumber = '+923123456789'; // Your WhatsApp number
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodedMessage}`;
  
  // Open WhatsApp in new tab
  window.open(whatsappUrl, '_blank');
};

// Method 3: WhatsApp Click to Chat with QR Code
export const generateWhatsAppQR = (order: Order): string => {
  const message = `New Order: ${order.id} - Customer: ${order.customerName} - Total: ₹${order.total}`;
  const phoneNumber = '+923123456789'; // Your WhatsApp number
  
  return `https://wa.me/${phoneNumber.replace('+', '')}?text=${encodeURIComponent(message)}`;
};

// Method 4: Email to WhatsApp Gateway
export const sendEmailToWhatsAppGateway = async (order: Order): Promise<boolean> => {
  try {
    // Some email providers offer SMS-to-WhatsApp gateways
    // For example: send email to {phonenumber}@gateway.whatsapp.com
    const gatewayEmail = `923123456789@gateway.whatsapp.com`; // Fictional example
    
    const emailContent = `
NEW ORDER - ${order.id}
Customer: ${order.customerName}
Phone: ${order.customerPhone}
Total: ₹${order.total}
Items: ${order.items.length}
    `;

    console.log('📧 Email to WhatsApp Gateway:', gatewayEmail, emailContent);
    return true;
  } catch (error) {
    console.log('⚠️ Email to WhatsApp failed:', error);
    return false;
  }
};

// Method 5: Simple SMS API (as backup)
export const sendOrderSMS = async (order: Order): Promise<boolean> => {
  try {
    // Using Textlocal or similar SMS service
    const apiKey = 'your_sms_api_key';
    const message = `NEW ORDER: ${order.id} - Customer: ${order.customerName} - Total: ₹${order.total}`;
    
    console.log('📱 SMS notification:', message);
    return true;
  } catch (error) {
    console.log('⚠️ SMS failed:', error);
    return false;
  }
};
