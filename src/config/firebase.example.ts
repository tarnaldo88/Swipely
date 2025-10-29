import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Firebase configuration - EXAMPLE
// Copy this file to firebase.ts and replace with your actual Firebase project credentials
const firebaseConfig = {
  apiKey: "AIzaSyExample-Replace-With-Your-Actual-API-Key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

// Initialize Firebase
let app;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth
const auth = getAuth(app);

export { auth };
export default app;