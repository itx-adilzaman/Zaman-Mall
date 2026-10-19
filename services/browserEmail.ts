// Browser-compatible email service using EmailJS
import { Order } from '../types';

export const sendOrderEmail = async (order: Order): Promise<boolean> => {
  try {
    const emailData = {
      to: 'malikmuhammadadilzaman@gmail.com',
      subject: `🛒 New Order - ${order.id}`,
      message: `
NEW ORDER RECEIVED - ${order.id}

Customer Details:
Name: ${order.customerName}
Email: ${order.customerEmail}
Phone: ${order.customerPhone}
Address: ${order.shippingAddress}

Order Items:
${order.items.map(item => `${item.name} - Qty: ${item.quantity} - Price: ₹${item.price} - Total: ₹${item.price * item.quantity}`).join('\n')}

Total Amount: ₹${order.total}
Payment: Cash on Delivery
Order Date: ${new Date(order.date).toLocaleString('en-IN')}
      `
    };

    // Option 1: Using EmailJS (recommended - free and easy)
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        service_id: 'service_your_service_id',
        template_id: 'template_your_template_id',
        user_id: 'your_public_key',
        template_params: {
          to_email: emailData.to,
          subject: emailData.subject,
          message: emailData.message
        }
      })
    });

    if (response.ok) {
      console.log('✅ Email sent successfully');
      return true;
    } else {
      console.log('⚠️ Email service not configured, but order placed successfully');
      return false;
    }

  } catch (error) {
    console.log('⚠️ Email failed, but order placed successfully:', error);
    return false;
  }
};

// Simple fallback - just log the order
export const logOrderForEmail = (order: Order) => {
  console.log('📧 ORDER DETAILS FOR EMAIL:');
  console.log('Order ID:', order.id);
  console.log('Customer:', order.customerName);
  console.log('Email:', order.customerEmail);
  console.log('Phone:', order.customerPhone);
  console.log('Total:', order.total);
  console.log('Items:', order.items.length);
};
