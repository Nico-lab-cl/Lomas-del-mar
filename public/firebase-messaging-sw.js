importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// These are public values from google-services.json / firebase config
firebase.initializeApp({
  apiKey: "AIzaSyCtudQ0-81WmjSmR9pLM1WwWxXZaHWSVhQ",
  authDomain: "crm-alimin.firebaseapp.com",
  projectId: "crm-alimin",
  storageBucket: "crm-alimin.firebasestorage.app",
  messagingSenderId: "668947081980",
  appId: "1:668947081980:android:4bf1e91d71eb33fa870579"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo-alimin.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
