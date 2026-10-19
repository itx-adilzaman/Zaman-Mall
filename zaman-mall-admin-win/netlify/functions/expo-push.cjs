// Netlify Serverless Function: expo-push.cjs
// Proxy for Expo Push Notification API — handles CORS for POST requests
// .cjs extension forces CommonJS mode even when package.json has "type": "module"

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

exports.handler = async (event) => {
  // Allow CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Accept-Encoding',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: 'Method Not Allowed' }),
    };
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: event.body,
    });

    const text = await response.text();

    console.log('[expo-push] Expo API status:', response.status);
    console.log('[expo-push] Expo API response:', text);

    return {
      statusCode: response.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: text,
    };
  } catch (error) {
    console.error('[expo-push] Error forwarding to Expo API:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to send push notification', details: error.message }),
    };
  }
};
