// Firebase service for RakshaNet Admin Panel
import { db } from '../config/firebase';
import { collection, query, orderBy, onSnapshot, limit, getDocs } from 'firebase/firestore';

export class FirebaseService {
  // Subscribe to real-time SOS events from Firebase
  static subscribeToSOSEvents(callback, limitCount = 50) {
    try {
      const sosEventsRef = collection(db, 'sosEvents');
      const q = query(sosEventsRef, orderBy('timestamp', 'desc'), limit(limitCount));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const events = [];
        snapshot.forEach((doc) => {
          events.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(events);
      }, (error) => {
        console.error('Error listening to Firebase SOS events:', error);
        // Fallback to empty array if Firebase fails
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up Firebase SOS events listener:', error);
      // Return a dummy unsubscribe function
      return () => {};
    }
  }

  // Subscribe to ALL SOS events (no limit) for historical data
  static subscribeToAllSOSEvents(callback) {
    try {
      const sosEventsRef = collection(db, 'sosEvents');
      const q = query(sosEventsRef, orderBy('timestamp', 'desc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const events = [];
        snapshot.forEach((doc) => {
          events.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(events);
      }, (error) => {
        console.error('Error listening to all Firebase SOS events:', error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up Firebase all SOS events listener:', error);
      return () => {};
    }
  }

  // Subscribe to live location updates from Firebase
  static subscribeToLocationUpdates(callback) {
    try {
      const locationsRef = collection(db, 'liveLocations');
      const q = query(locationsRef, orderBy('timestamp', 'desc'), limit(100));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const locations = [];
        snapshot.forEach((doc) => {
          locations.push({
            id: doc.id,
            ...doc.data()
          });
        });
        callback(locations);
      }, (error) => {
        console.error('Error listening to Firebase live locations:', error);
        callback([]);
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up Firebase live locations listener:', error);
      return () => {};
    }
  }

  // Get all location data for heat map
  static async getAllLocationData() {
    try {
      const locationsRef = collection(db, 'liveLocations');
      const snapshot = await getDocs(locationsRef);
      
      const locations = [];
      snapshot.forEach((doc) => {
        locations.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return locations;
    } catch (error) {
      console.error('Error fetching all Firebase location data:', error);
      return [];
    }
  }

  // Get dashboard statistics from Firebase
  static async getDashboardStats() {
    try {
      const sosEventsRef = collection(db, 'sosEvents');
      const snapshot = await getDocs(sosEventsRef);
      
      const events = [];
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });

      // Calculate stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const todayEvents = events.filter(event => 
        new Date(event.timestamp) >= today
      );

      const weekEvents = events.filter(event => 
        new Date(event.timestamp) >= thisWeek
      );

      const monthEvents = events.filter(event => 
        new Date(event.timestamp) >= thisMonth
      );

      // Get unique users from recent events
      const recentUserIds = new Set();
      events.forEach(event => {
        if (new Date(event.timestamp) >= new Date(now.getTime() - (24 * 60 * 60 * 1000))) {
          recentUserIds.add(event.userId);
        }
      });

      return {
        todaySOSCount: todayEvents.length,
        weekSOSCount: weekEvents.length,
        monthSOSCount: monthEvents.length,
        activeUsersCount: recentUserIds.size,
        recentEvents: events.slice(0, 10) // Most recent 10 events
      };
    } catch (error) {
      console.error('Error fetching Firebase dashboard stats:', error);
      return {
        todaySOSCount: 0,
        weekSOSCount: 0,
        monthSOSCount: 0,
        activeUsersCount: 0,
        recentEvents: []
      };
    }
  }
}
