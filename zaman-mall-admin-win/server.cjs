const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
let isFirebaseInitialized = false;
try {
  // Find the firebase admin sdk json file in the current directory
  const files = fs.readdirSync(__dirname);
  const serviceAccountFile = files.find(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));
  
  if (serviceAccountFile) {
    const serviceAccount = require(path.join(__dirname, serviceAccountFile));
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    isFirebaseInitialized = true;
    console.log('Firebase Admin initialized successfully with ' + serviceAccountFile);
  } else {
    console.error('Firebase Admin SDK JSON file not found in the root directory.');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

app.post('/send-fcm', async (req, res) => {
  if (!isFirebaseInitialized) {
    return res.status(500).json({ error: 'Firebase Admin not initialized' });
  }

  try {
    const { tokens, title, body, data, image } = req.body;

    if (!tokens || !Array.isArray(tokens) || tokens.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid tokens array' });
    }

    // Build the FCM Message payload
    // Using MulticastMessage for multiple tokens
    const message = {
      tokens: tokens,
      notification: {
        title: title,
        body: body,
      },
      android: {
        notification: {
          sound: 'default',
          channelId: 'zaman-mall-alerts',
          priority: 'high',
          defaultVibrateTimings: true,
          defaultSound: true,
        }
      },
      data: data || {}
    };

    // Attach image if provided (Rich Notification)
    if (image) {
      message.android.notification.imageUrl = image;
      // Also set APNs (iOS) image if needed in the future
      message.apns = {
        payload: {
          aps: {
            'mutable-content': 1
          }
        },
        fcm_options: {
          image: image
        }
      };
    }

    const response = await admin.messaging().sendEachForMulticast(message);
    
    console.log(`[FCM] Successfully sent message: ${response.successCount} successes, ${response.failureCount} failures`);
    res.status(200).json({ 
      success: true, 
      successCount: response.successCount, 
      failureCount: response.failureCount,
      responses: response.responses 
    });

  } catch (error) {
    console.error('Error sending FCM message:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`FCM Proxy Server running at http://localhost:${port}`);
});
