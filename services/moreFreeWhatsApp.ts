// More FREE WhatsApp Services
import { Order } from '../types';

// Method 1: WhatsApp via Botpress (Free Tier - 1,000 messages/month)
export const sendWhatsAppViaBotpress = async (order: Order): Promise<boolean> => {
  try {
    const message = `
🛒 *ZAMAN MALL - NEW ORDER* 🛒

📋 *Order ID:* ${order.id}
👤 *Customer:* ${order.customerName}
📱 *Phone:* ${order.customerPhone}
💰 *Total:* ₹${order.total}
    `.trim();

    const response = await fetch('https://api.botpress.cloud/v1/chat/messages', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_BOTPRESS_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botId: 'your-bot-id',
        conversationId: 'zaman-mall-orders',
        payload: {
          type: 'text',
          text: message
        },
        userId: '923365942212'
      })
    });

    if (response.ok) {
      console.log('✅ Botpress WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ Botpress response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Botpress failed:', error);
    return false;
  }
};

// Method 2: WhatsApp via ManyChat (Free - 1,000 contacts)
export const sendWhatsAppViaManyChat = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - New Order ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://api.manychat.com/fb/page/send_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        page_id: 'your-page-id',
        access_token: 'your-manychat-token',
        messaging_type: 'RESPONSE',
        recipient: {
          phone_number: '923047770565'
        },
        message: {
          text: message
        }
      })
    });

    if (response.ok) {
      console.log('✅ ManyChat WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ ManyChat response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ ManyChat failed:', error);
    return false;
  }
};

// Method 3: WhatsApp via SendPulse (Free - 100 contacts)
export const sendWhatsAppViaSendPulse = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - New Order ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://api.sendpulse.com/whatsapp/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_SENDPULSE_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipients: [{
          phone: '923047770565'
        }],
        message: {
          type: 'text',
          text: message
        }
      })
    });

    if (response.ok) {
      console.log('✅ SendPulse WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ SendPulse response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ SendPulse failed:', error);
    return false;
  }
};

// Method 4: WhatsApp via Chatfuel (Free - 50 users)
export const sendWhatsAppViaChatfuel = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - New Order ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://api.chatfuel.com/bots/YOUR_BOT_ID/users/923047770565/send_message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_type: 'RESPONSE',
        recipient: {
          phone_number: '923047770565'
        },
        message: {
          text: message
        }
      })
    });

    if (response.ok) {
      console.log('✅ Chatfuel WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ Chatfuel response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Chatfuel failed:', error);
    return false;
  }
};

// Method 5: WhatsApp via Dialogflow (Free - 180 requests/minute)
export const sendWhatsAppViaDialogflow = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - New Order ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://api.dialogflow.com/v2/projects/your-project-id/agent/sessions/923047770565:detectIntent', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_DIALOGFLOW_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        queryInput: {
          text: {
            text: message,
            languageCode: 'en'
          }
        },
        queryParams: {
          whatsapp: {
            phone_number: '923047770565'
          }
        }
      })
    });

    if (response.ok) {
      console.log('✅ Dialogflow WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ Dialogflow response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Dialogflow failed:', error);
    return false;
  }
};

// Method 6: WhatsApp via Tawk.to (Free - Unlimited)
export const sendWhatsAppViaTawkTo = async (order: Order): Promise<boolean> => {
  try {
    const message = `
🛒 *ZAMAN MALL - NEW ORDER RECEIVED* 🛒

📋 *Order Information:*
🔸 Order ID: ${order.id}
🔸 Date: ${new Date(order.date).toLocaleString('en-IN', { 
  day: '2-digit', 
  month: '2-digit', 
  year: 'numeric', 
  hour: '2-digit', 
  minute: '2-digit' 
})}
🔸 Payment: Cash on Delivery

👤 *Customer Details:*
🔸 Name: ${order.customerName}
🔸 Email: ${order.customerEmail}
🔸 Phone: ${order.customerPhone}
🔸 Address: ${order.shippingAddress}

📦 *Order Items:*
${order.items.map((item, index) => 
  `🔸 ${index + 1}. ${item.name}\n   • Quantity: ${item.quantity}\n   • Price: ₹${item.price}\n   • Total: ₹${item.price * item.quantity}`
).join('\n\n')}

💰 *Order Summary:*
🔸 Total Items: ${order.items.length}
🔸 Subtotal: ₹${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)}
🔸 Final Total: ₹${order.total}

---
🏪 *ZAMAN MALL* 
📞 Customer Support: +923047770565
🌐 Website: zaman-mall.com
📧 Email: support@zamansons.com

🔥 *Please check your admin panel for complete order management!*
    `.trim();

    const response = await fetch('https://api.tawk.to/v1/chats/send', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer fc596ce399e729010459712a8bc0d5c0c394dc3d',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: 'zaman-mall-orders',
        type: 'msg',
        message: message,
        visitor: {
          name: 'Zaman Mall System',
          phone: '923365942212'
        }
      })
    });

    if (response.ok) {
      console.log('✅ Tawk.to WhatsApp sent with complete branding');
      return true;
    } else {
      console.log('⚠️ Tawk.to response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Tawk.to failed:', error);
    return false;
  }
};

// Method 7: WhatsApp via Freshchat (Free - 10 agents)
export const sendWhatsAppViaFreshchat = async (order: Order): Promise<boolean> => {
  try {
    const message = `🛒 ZAMAN MALL - New Order ${order.id}\nCustomer: ${order.customerName}\nTotal: ₹${order.total}`;

    const response = await fetch('https://api.freshchat.com/v2/conversations', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_FRESHCHAT_TOKEN',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [{
          actor_type: 'agent',
          actor_id: 'your-agent-id',
          message_type: 'normal',
          parts: [{
            text: {
              content: message
            }
          }]
        }],
        users: [{
          id: '923047770565',
          phone: '923047770565'
        }]
      })
    });

    if (response.ok) {
      console.log('✅ Freshchat WhatsApp sent');
      return true;
    } else {
      console.log('⚠️ Freshchat response:', await response.text());
      return false;
    }

  } catch (error) {
    console.log('⚠️ Freshchat failed:', error);
    return false;
  }
};
