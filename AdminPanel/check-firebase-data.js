// Simple script to check what data exists in Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

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
const db = getFirestore(app);

async function checkFirebaseData() {
  console.log('🔍 Checking Firebase collections...\n');
  
  const collectionsToCheck = [
    'liveLocations',
    'sosEvents', 
    'locations',
    'userLocations',
    'users',
    'emergencyEvents',
    'trackingData'
  ];

  for (const collectionName of collectionsToCheck) {
    try {
      console.log(`📁 Checking collection: ${collectionName}`);
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(query(collectionRef, limit(5)));
      
      if (snapshot.empty) {
        console.log(`   ❌ Collection '${collectionName}' is empty or doesn't exist\n`);
      } else {
        console.log(`   ✅ Collection '${collectionName}' has ${snapshot.size} documents (showing first 5)`);
        
        snapshot.forEach((doc, index) => {
          const data = doc.data();
          console.log(`   📄 Document ${index + 1}:`, {
            id: doc.id,
            data: JSON.stringify(data, null, 2).substring(0, 200) + '...'
          });
          
          // Check for location data specifically
          if (data.lat || data.latitude || data.lng || data.longitude) {
            console.log(`   📍 LOCATION DATA FOUND: lat=${data.lat || data.latitude}, lng=${data.lng || data.longitude}`);
          }
        });
        console.log('');
      }
    } catch (error) {
      console.log(`   ❌ Error accessing collection '${collectionName}':`, error.message, '\n');
    }
  }
  
  console.log('🏁 Firebase data check complete!');
  process.exit(0);
}

checkFirebaseData().catch(console.error);
