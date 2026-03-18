import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let credentialParams;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Easypanel injects the entire JSON as a string.
      // JSON.parse automatically handles the \n escape sequences inside the private_key string.
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credentialParams = {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key, 
      };
    } else {
      // Formato antiguo por variables separadas
      credentialParams = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
    }

    if (credentialParams.projectId && credentialParams.privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert(credentialParams),
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export default admin;
