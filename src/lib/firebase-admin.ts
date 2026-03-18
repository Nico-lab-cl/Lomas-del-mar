import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let credentialParams;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Si se pasa todo el JSON como un solo string (Easypanel)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credentialParams = {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key?.replace(/\\n/g, '\n'),
      };
    } else {
      // Formato antiguo por variables separadas
      credentialParams = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };
    }

    if (credentialParams.projectId) {
      admin.initializeApp({
        credential: admin.credential.cert(credentialParams),
      });
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export default admin;
