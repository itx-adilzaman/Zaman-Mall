// EmailJS Service - Replacement for Web3Forms
import emailjs from '@emailjs/browser';

// EmailJS Configuration - Updated with actual credentials
const EMAILJS_CONFIG = {
  serviceId: 'service_wyorg7n', // User's service ID
  welcomeTemplateId: 'template_d74dzau', // Using same template for now
  signupTemplateId: 'template_d74dzau', // Using same template for now
  publicKey: 'MKC0tUvfmsVi4rhlt' // User's public key
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

// Send welcome email to new user
export const sendWelcomeEmailViaEmailJS = async (user: any): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: user.email, // ✅ Dynamic recipient
      to_name: user.name,
      user_email: user.email,
      user_name: user.name,
      user_id: user.id,
      join_date: new Date(user.joinedDate).toLocaleDateString('en-IN'),
      from_name: 'Zaman Mall',
      reply_to: 'malikmuhammadadilzaman@gmail.com'
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.welcomeTemplateId,
      templateParams
    );

    console.log('✅ Welcome email sent successfully via EmailJS:', response);
    return true;

  } catch (error: any) {
    console.error('⚠️ Welcome email failed via EmailJS:', error);
    return false;
  }
};

// Send signup notification to admin
export const sendSignupNotificationViaEmailJS = async (user: any): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: 'malikmuhammadadilzaman@gmail.com', // Admin email
      to_name: 'Zaman Mall Admin',
      user_name: user.name,
      user_email: user.email,
      user_id: user.id,
      user_role: user.role,
      join_date: new Date(user.joinedDate).toLocaleString('en-IN'),
      from_name: 'Zaman Mall System',
      reply_to: user.email
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      EMAILJS_CONFIG.signupTemplateId,
      templateParams
    );

    console.log('✅ Signup notification sent successfully via EmailJS:', response);
    return true;

  } catch (error: any) {
    console.error('⚠️ Signup notification failed via EmailJS:', error);
    return false;
  }
};

// Send contact form email to admin
export const sendContactFormViaEmailJS = async (message: any): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: 'malikmuhammadadilzaman@gmail.com', // Admin email
      to_name: 'Zaman Mall Admin',
      from_name: message.name,
      from_email: message.email,
      subject: message.subject,
      message_content: message.message,
      date: new Date(message.date).toLocaleString('en-IN'),
      reply_to: message.email
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      'contact_form_template', // Separate template for contact form
      templateParams
    );

    console.log('✅ Contact form sent successfully via EmailJS:', response);
    return true;

  } catch (error: any) {
    console.error('⚠️ Contact form failed via EmailJS:', error);
    return false;
  }
};

// Send order email via EmailJS
export const sendOrderEmailViaEmailJS = async (order: any): Promise<boolean> => {
  try {
    const templateParams = {
      to_email: 'malikmuhammadadilzaman@gmail.com', // Admin email
      to_name: 'Zaman Mall Admin',
      order_id: order.id,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      total_amount: order.total,
      order_date: new Date(order.date).toLocaleString('en-IN'),
      items: order.items.map((item: any) => 
        `${item.name} (${item.quantity}x) - Rs.${item.price * item.quantity}`
      ).join('\n'),
      reply_to: order.customerEmail
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      'order_template', // Separate template for orders
      templateParams
    );

    console.log('✅ Order email sent successfully via EmailJS:', response);
    return true;

  } catch (error: any) {
    console.error('⚠️ Order email failed via EmailJS:', error);
    return false;
  }
};

// Helper function to test EmailJS configuration
export const testEmailJS = async (): Promise<boolean> => {
  try {
    const testParams = {
      to_email: 'malikmuhammadadilzaman@gmail.com',
      to_name: 'Test User',
      message: 'EmailJS is working correctly!',
      from_name: 'Zaman Mall Test'
    };

    const response = await emailjs.send(
      EMAILJS_CONFIG.serviceId,
      'test_template', // Create a test template
      testParams
    );

    console.log('✅ EmailJS test successful:', response);
    return true;

  } catch (error: any) {
    console.error('❌ EmailJS test failed:', error);
    return false;
  }
};
