import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

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

// Initialize Firebase Auth
const auth = getAuth(app);

export { auth };
export default app;