import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBCdfdZrq2XI7OpoLvB0sTqKgY2ifHrgF8",
  authDomain: "rakshanet--live--location.firebaseapp.com",
  projectId: "rakshanet--live--location",
  storageBucket: "rakshanet--live--location.firebasestorage.app",
  messagingSenderId: "910921426775",
  appId: "1:910921426775:web:9a1777219def3794d08012",
  measurementId: "G-DEMXC216Z9",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
