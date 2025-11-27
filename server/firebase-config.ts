import admin from 'firebase-admin';

// Initialize Firebase Admin (uses GOOGLE_APPLICATION_CREDENTIALS environment variable or credentials from .env)
let firebaseApp: admin.app.App;

try {
  // Try to initialize with environment variable
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT ? 
    JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT) : undefined;
    
  firebaseApp = admin.initializeApp({
    credential: serviceAccount ? 
      admin.credential.cert(serviceAccount as admin.ServiceAccount) :
      admin.credential.applicationDefault(),
  });
} catch (error) {
  console.warn("Firebase not initialized - ensure FIREBASE_SERVICE_ACCOUNT environment variable is set");
}

export const getFirebaseMessaging = () => {
  try {
    return admin.messaging();
  } catch (error) {
    console.error("Firebase Messaging not available:", error);
    return null;
  }
};

export default firebaseApp;
