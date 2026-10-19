// Twilio WhatsApp Service - Step by Step Setup
import { Order } from '../types';

export const sendTwilioWhatsApp = async (order: Order): Promise<boolean> => {
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

    // Twilio WhatsApp API
    const response = await fetch('https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('YOUR_ACCOUNT_SID:YOUR_AUTH_TOKEN'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'To': 'whatsapp:+923047770565', // Your WhatsApp number
        'From': 'whatsapp:+14155238886', // Twilio's WhatsApp number
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
    console.log('⚠️ Twilio WhatsApp failed:', error);
    return false;
  }
};

// Step-by-step setup instructions
export const TWILIO_SETUP_STEPS = `
🔧 TWILIO WHATSAPP SETUP - STEP BY STEP

Step 1: Create Twilio Account
• Go to: https://www.twilio.com/try-twilio
• Sign up for free account
• Verify your email and phone number

Step 2: Get Your Credentials
• Go to Twilio Console: https://console.twilio.com/
• Copy your "Account SID" and "Auth Token"
• These will be your YOUR_SID and YOUR_AUTH_TOKEN

Step 3: Setup WhatsApp Sandbox
• In Twilio Console, go to Messaging > Try it out > Send a WhatsApp message
• Follow the setup instructions
• Connect your WhatsApp number to the sandbox
• You'll get a Twilio WhatsApp number (usually +14155238886)

Step 4: Update Code
• In services/twilioWhatsApp.ts:
• Replace YOUR_SID with your Account SID
• Replace YOUR_AUTH_TOKEN with your Auth Token
• Your number is already set: +923047770565

Step 5: Test WhatsApp
• Send a test message to the Twilio WhatsApp number
• You should receive order notifications automatically

Cost: ~$0.05 per message (very affordable)
`;
