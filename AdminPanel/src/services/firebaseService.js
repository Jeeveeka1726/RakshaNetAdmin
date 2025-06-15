import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  where,
  getDocs,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase.js';

export class FirebaseService {
  // Listen to real-time SOS events
  static subscribeToSOSEvents(callback, limitCount = 50) {
    const sosEventsRef = collection(db, 'sosEvents');
    const q = query(sosEventsRef, orderBy('timestamp', 'desc'), limit(limitCount));

    return onSnapshot(q, (snapshot) => {
      const events = [];
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(events);
    });
  }

  // Get ALL SOS events (no limit) for historical data
  static subscribeToAllSOSEvents(callback) {
    const sosEventsRef = collection(db, 'sosEvents');
    const q = query(sosEventsRef, orderBy('timestamp', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const events = [];
      snapshot.forEach((doc) => {
        events.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(events);
    });
  }

  // Listen to real-time location updates
  static subscribeToLocationUpdates(callback) {
    const locationsRef = collection(db, 'liveLocations');

    return onSnapshot(locationsRef, (snapshot) => {
      const locations = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        locations.push({
          id: doc.id,
          ...data,
          // Ensure we have valid coordinates
          lat: data.lat || data.latitude,
          lng: data.lng || data.longitude
        });
      });
      callback(locations);
    });
  }

  // Check what collections exist in the database
  static async checkAvailableCollections() {
    try {
      const collections = ['liveLocations', 'sosEvents', 'users', 'locations', 'userLocations'];
      const results = {};

      for (const collectionName of collections) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(query(collectionRef, limit(1)));
          results[collectionName] = {
            exists: !snapshot.empty,
            count: snapshot.size,
            sampleData: snapshot.empty ? null : snapshot.docs[0].data()
          };
        } catch (error) {
          results[collectionName] = {
            exists: false,
            error: error.message
          };
        }
      }

      return results;
    } catch (error) {
      console.error('Error checking collections:', error);
      return {};
    }
  }

  // Get all location data from multiple possible collections
  static async getAllLocationData() {
    try {
      const allLocations = [];
      const collections = ['liveLocations', 'locations', 'userLocations'];

      for (const collectionName of collections) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);

          snapshot.forEach((doc) => {
            const data = doc.data();
            if ((data.lat || data.latitude) && (data.lng || data.longitude)) {
              allLocations.push({
                id: doc.id,
                collection: collectionName,
                ...data,
                lat: data.lat || data.latitude,
                lng: data.lng || data.longitude
              });
            }
          });
        } catch (error) {
          console.log(`Collection ${collectionName} not accessible:`, error.message);
        }
      }

      return allLocations;
    } catch (error) {
      console.error('Error getting location data:', error);
      return [];
    }
  }

  // Get SOS events for a specific time range
  static async getSOSEventsByTimeRange(startDate, endDate) {
    const sosEventsRef = collection(db, 'sosEvents');
    const q = query(
      sosEventsRef,
      where('timestamp', '>=', startDate),
      where('timestamp', '<=', endDate),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const events = [];
    snapshot.forEach((doc) => {
      events.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return events;
  }

  // Get recent active users (based on recent SOS events or location updates)
  static async getActiveUsers(hoursBack = 24) {
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - hoursBack);
    
    const sosEventsRef = collection(db, 'sosEvents');
    const q = query(
      sosEventsRef,
      where('timestamp', '>=', cutoffTime.toISOString()),
      orderBy('timestamp', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const users = new Set();
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.userId) {
        users.add(data.userId);
      }
    });
    
    return Array.from(users);
  }

  // Get statistics for dashboard
  static async getDashboardStats() {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      // Get today's SOS events
      const todayEvents = await this.getSOSEventsByTimeRange(
        today.toISOString(),
        now.toISOString()
      );

      // Get this week's SOS events
      const weekEvents = await this.getSOSEventsByTimeRange(
        thisWeek.toISOString(),
        now.toISOString()
      );

      // Get this month's SOS events
      const monthEvents = await this.getSOSEventsByTimeRange(
        thisMonth.toISOString(),
        now.toISOString()
      );

      // Get active users
      const activeUsers = await this.getActiveUsers(24);

      return {
        todaySOSCount: todayEvents.length,
        weekSOSCount: weekEvents.length,
        monthSOSCount: monthEvents.length,
        activeUsersCount: activeUsers.length,
        recentEvents: todayEvents.slice(0, 10) // Last 10 events
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
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
