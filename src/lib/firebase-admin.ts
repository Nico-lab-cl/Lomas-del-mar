import admin from 'firebase-admin';

function initFirebase() {
  if (admin.apps.length) return;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    console.error('[Firebase Admin] ❌ Missing env variables:', {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKeyRaw,
    });
    return;
  }

  // Fix private key: replace escaped newlines with real newlines
  // This handles both \\n (from env files) and already-correct \n
  const privateKey = privateKeyRaw.replace(/\\n/g, '\n');

  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('[Firebase Admin] ✅ Initialized successfully for project:', projectId);
  } catch (error) {
    console.error('[Firebase Admin] ❌ Initialization error:', error);
  }
}

initFirebase();

export default admin;
