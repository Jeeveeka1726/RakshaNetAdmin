// Firebase configuration for RakshaNet Admin Panel
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase config for rakshanet--live--location project
const firebaseConfig = {
  apiKey: "AIzaSyAeN6n8eMSKveBnlZT_oQQcgsFUfVjVfac",
  authDomain: "rakshanet--live--location.firebaseapp.com",
  projectId: "rakshanet--live--location",
  storageBucket: "rakshanet--live--location.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

export default app;
