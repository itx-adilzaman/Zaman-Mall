// Real email service that will send emails to your Gmail
import { Order } from '../types';

export const logOrderForEmail = (order: Order) => {
  console.log('📧 ORDER DETAILS FOR EMAIL:');
  console.log('Order ID:', order.id);
  console.log('Customer:', order.customerName);
  console.log('Email:', order.customerEmail);
  console.log('Phone:', order.customerPhone);
  console.log('Total:', order.total);
  console.log('Items:', order.items.length);
};

export const sendOrderEmail = async (order: Order): Promise<boolean> => {
  try {
    // Using Web3Forms API - it's free and works from browser
    const formData = new FormData();
    formData.append('access_key', 'c8f29373-4d3a-4355-8dcb-83bcb5809716'); // Get from web3forms.com dashboard
    formData.append('subject', `🛒 New Order - ${order.id}`);
    formData.append('from_name', 'Zaman Mall'); // This will show as sender name
    formData.append('to', 'malikmuhammadadilzaman@gmail.com');
    
    const emailContent = `
🛒 ZAMAN MALL - NEW ORDER RECEIVED 🛒

📋 ORDER INFORMATION:
🔸 Order ID: ${order.id}
🔸 Date: ${new Date(order.date).toLocaleString('en-IN', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit' 
})}
🔸 Payment Method: Cash on Delivery

👤 CUSTOMER DETAILS:
🔸 Name: ${order.customerName}
🔸 Email: ${order.customerEmail}
🔸 Phone: ${order.customerPhone}
🔸 Shipping Address: ${order.shippingAddress}

📦 ORDER ITEMS:
${order.items.map((item, index) => 
  `🔸 ${index + 1}. ${item.name}\n   • Quantity: ${item.quantity}\n   • Price: ₹${item.price}\n   • Total: ₹${item.price * item.quantity}`
).join('\n\n')}

💰 ORDER SUMMARY:
🔸 Total Items: ${order.items.length}
🔸 Subtotal: ₹${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
🔸 Final Total: ₹${order.total}

---
🏪 ZAMAN MALL 
📞 Customer Support: +923365942212
🌐 Website: zamanmall.netlify.app
📧 Email: malikmuhammadadilzaman@gmail.com

🔥 Please check your admin panel for complete order management!
This is an automated notification from Zaman Mall.
    `;
    
    formData.append('message', emailContent);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log('✅ Email sent successfully');
      return true;
    } else {
      console.log('⚠️ Email service response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Email failed:', error);
    return false;
  }
};
