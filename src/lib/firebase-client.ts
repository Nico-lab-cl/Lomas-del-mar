import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCtudQ0-81WmjSmR9pLM1WwWxXZaHWSVhQ",
  authDomain: "crm-alimin.firebaseapp.com",
  projectId: "crm-alimin",
  storageBucket: "crm-alimin.firebasestorage.app",
  messagingSenderId: "668947081980",
  appId: "1:668947081980:android:4bf1e91d71eb33fa870579"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const msg = typeof window !== 'undefined' ? getMessaging(app) : null;

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
