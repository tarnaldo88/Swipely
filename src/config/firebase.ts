import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase configuration
// You'll need to replace these with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyDslt19Byt9H09-PCQDGvuE4CuRIe1QcNc",
  authDomain: "swipely-d5d70.firebaseapp.com",
  projectId: "swipely-d5d70",
  storageBucket: "swipely-d5d70.firebasestorage.app",
  messagingSenderId: "418266990343",
  appId: "1:418266990343:web:5ded224bdd5418e82ee7a2",
  measurementId: "G-ZHL367JS5Q"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth with AsyncStorage persistence
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  auth = getAuth(app);
}

export { auth };
export default app;