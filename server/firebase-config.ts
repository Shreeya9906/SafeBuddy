import admin from 'firebase-admin';

let firebaseApp: admin.app.App | null = null;
let firebaseInitialized = false;

export const getFirebaseMessaging = () => {
  try {
    // Return null if Firebase already tried and failed
    if (firebaseInitialized && !firebaseApp) {
      return null;
    }

    // Initialize if not already done
    if (!firebaseInitialized) {
      firebaseInitialized = true;

      // Check if app already initialized
      if (admin.apps.length > 0) {
        firebaseApp = admin.app();
        console.log("✅ Firebase already initialized");
        return admin.messaging();
      }

      // Get service account from environment
      const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      
      if (!serviceAccountJson) {
        console.log("ℹ️ Firebase disabled (FIREBASE_SERVICE_ACCOUNT not set)");
        return null;
      }

      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
        
        console.log("✅ Firebase initialized successfully");
        return admin.messaging();
      } catch (parseError: any) {
        console.log("ℹ️ Firebase disabled (invalid service account JSON)");
        return null;
      }
    }

    // Return messaging if Firebase is initialized
    if (firebaseApp && admin.apps.length > 0) {
      return admin.messaging();
    }

    return null;
  } catch (error: any) {
    console.log("ℹ️ Firebase messaging unavailable:", error.message);
    return null;
  }
};

export default firebaseApp;
