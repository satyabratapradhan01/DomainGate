import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  initializeAuth, 
  getAuth, 
  Auth, 
  GoogleAuthProvider
} from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Default / Example Firebase Configuration
// In production, these are supplied via process.env / .env
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDemo-DomainGate-Key-HBPlusFit',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'domaingate-hbplus.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'domaingate-hbplus',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'domaingate-hbplus.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '102938475610',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:102938475610:web:abcdef123456',
};

// Initialize Firebase App instance singleton
export function getFirebaseApp(): FirebaseApp {
  if (getApps().length > 0) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

// Custom helper to get or initialize Auth with platform-appropriate persistence
let cachedAuth: Auth | null = null;

export function getFirebaseAuth(): Auth {
  if (cachedAuth) {
    return cachedAuth;
  }

  const app = getFirebaseApp();

  try {
    if (Platform.OS === 'web') {
      cachedAuth = getAuth(app);
    } else {
      // For React Native on Android / iOS, import AsyncStorage persistence
      try {
        const { getReactNativePersistence } = require('firebase/auth');
        cachedAuth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (persistenceError) {
        // Fallback to standard getAuth if already initialized
        cachedAuth = getAuth(app);
      }
    }
  } catch (e) {
    cachedAuth = getAuth(app);
  }

  return cachedAuth;
}

// Google OAuth Provider setup
export const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');
googleAuthProvider.addScope('openid');
// Prompt user to select account every time for high security compliance
googleAuthProvider.setCustomParameters({
  prompt: 'select_account',
  hd: 'hbplus.fit', // Google OAuth Hosted Domain hint
});
