import { Order } from '../types';

// Using Web3Forms to send email to customer
export const sendCustomerEmail = async (order: Order): Promise<boolean> => {
  try {
    const formData = new FormData();
    formData.append('access_key', 'c8f29373-4d3a-4355-8dcb-83bcb5809716');
    formData.append('subject', `Order Confirmation - ${order.id} - Zaman Mall`);
    formData.append('from_name', 'Zaman Mall');
    formData.append('to', order.customerEmail); // Sending directly to customer
    
    const itemsContent = order.items.map(item => 
      `• ${item.name} x ${item.quantity} - Rs. ${(item.price * item.quantity).toLocaleString()}`
    ).join('\n');

    const emailContent = `
Dear ${order.customerName},

Thank you for shopping at Zaman Mall! Your order has been placed successfully.

ORDER DETAILS:
Order ID: ${order.id}
Date: ${new Date(order.date).toLocaleString()}
Total Amount: Rs. ${order.total.toLocaleString()}

ITEMS:
${itemsContent}

SHIPPING ADDRESS:
${order.shippingAddress}

PAYMENT METHOD:
${order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}

We will notify you once your order is shipped. If you have any questions, feel free to contact our support.

Best regards,
The Zaman Mall Team
+923365942212
zamanmall.netlify.app
    `;
    
    formData.append('message', emailContent);

    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      console.log('✅ Customer confirmation email sent successfully');
      return true;
    } else {
      console.log('⚠️ Customer email service response:', await response.text());
      return false;
    }

  } catch (error: any) {
    console.error('⚠️ Failed to send customer email:', error);
    return false;
  }
};
