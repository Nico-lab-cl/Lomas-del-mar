import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Ensure we only initialize if we have the required config to prevent white/black screens
const isConfigValid = 
  firebaseConfig.apiKey && 
  firebaseConfig.projectId && 
  firebaseConfig.appId;

let app;
if (isConfigValid) {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} else {
  console.warn("Firebase client configuration is missing. Notifications might not work.");
}

export const msg = (typeof window !== 'undefined' && app) ? getMessaging(app) : null;

export const requestForToken = async () => {
  if (!msg) return null;
  try {
    const currentToken = await getToken(msg, {
      vapidKey: "YOUR_VAPID_KEY_IF_NEEDED" // Optional: required if using a specific key
    });
    if (currentToken) {
      console.log('Current token for client: ', currentToken);
      // Send the token to your server and update the UI if necessary
      await fetch('/api/user/fcm-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
      });
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!msg) return;
    onMessage(msg, (payload) => {
      console.log("On message: ", payload);
      resolve(payload);
    });
  });
