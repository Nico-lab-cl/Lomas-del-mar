import admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    let credentialParams;

    const formatPrivateKey = (key?: string) => {
      if (!key) return undefined;
      let pk = key.replace(/\\n/g, '\n').replace(/^"|"$/g, '');
      if (!pk.includes('\n')) {
        // En caso de que haya perdido los saltos de línea (por espacios)
        const begin = '-----BEGIN PRIVATE KEY-----';
        const end = '-----END PRIVATE KEY-----';
        if (pk.startsWith(begin) && pk.endsWith(end)) {
          const body = pk.substring(begin.length, pk.length - end.length).trim().replace(/ /g, '\n');
          pk = `${begin}\n${body}\n${end}\n`;
        }
      }
      return pk;
    };

    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      // Si se pasa todo el JSON como un solo string (Easypanel)
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      credentialParams = {
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: formatPrivateKey(serviceAccount.private_key),
      };
    } else {
      // Formato antiguo por variables separadas
      credentialParams = {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY),
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
