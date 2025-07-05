// Combined Database Service for RakshaNet Admin Panel
// Connects to both PostgreSQL (via backend API) and Firebase for comprehensive data

import { FirebaseService } from './firebaseService';

// Backend API URL - connects to the main RakshaNet backend
const BACKEND_API_URL = 'http://localhost:5500/api';

export class DatabaseService {
  constructor() {
    this.pollingIntervals = new Map();
  }

  // Static properties to store last events for comparison
  static lastEvents = null;
  static lastAllEvents = null;
  static lastDashboardStats = null;

  // Helper method to make API calls to the backend
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${BACKEND_API_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Listen to real-time SOS events (PostgreSQL only for stability)
  static subscribeToSOSEvents(callback, limitCount = 50) {
    let lastEventCount = 0;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/admin/sos-events?limit=${limitCount}`);
        if (response.ok) {
          const events = await response.json();

          // Only update if the data has actually changed
          if (events.length !== lastEventCount || JSON.stringify(events) !== JSON.stringify(this.lastEvents)) {
            lastEventCount = events.length;
            this.lastEvents = events;
            callback(events);
          }
        }
      } catch (error) {
        console.error('Error polling SOS events:', error);
      }
    }, 3000); // Poll every 3 seconds (less frequent to reduce fluctuation)

    // Return unsubscribe function
    return () => clearInterval(pollInterval);
  }



  // Get ALL SOS events (no limit) for historical data
  static subscribeToAllSOSEvents(callback) {
    let lastAllEventCount = 0;

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`${BACKEND_API_URL}/admin/sos-events`);
        if (response.ok) {
          const events = await response.json();

          // Only update if the data has actually changed
          if (events.length !== lastAllEventCount || JSON.stringify(events) !== JSON.stringify(this.lastAllEvents)) {
            lastAllEventCount = events.length;
            this.lastAllEvents = events;
            callback(events);
          }
        }
      } catch (error) {
        console.error('Error polling all SOS events:', error);
      }
    }, 5000); // Poll every 5 seconds for all events

    return () => clearInterval(pollInterval);
  }

  // Get SOS events for a specific time range
  static async getSOSEventsByTimeRange(startDate, endDate) {
    try {
      const response = await fetch(`${BACKEND_API_URL}/admin/sos-events?start=${startDate}&end=${endDate}`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error getting SOS events by time range:', error);
      return [];
    }
  }

  // Get recent active users (based on recent SOS events)
  static async getActiveUsers(hoursBack = 24) {
    try {
      const response = await fetch(`${BACKEND_API_URL}/admin/active-users?hours=${hoursBack}`);
      if (response.ok) {
        const result = await response.json();
        return result.userIds || [];
      }
      return [];
    } catch (error) {
      console.error('Error getting active users:', error);
      return [];
    }
  }

  // Get live location data for heat map (combines PostgreSQL and Firebase)
  static async getLiveLocationData() {
    try {
      // Get locations from backend API (if available)
      let backendLocations = [];
      try {
        const response = await fetch(`${BACKEND_API_URL}/admin/live-locations`);
        if (response.ok) {
          backendLocations = await response.json();
        }
      } catch (error) {
        console.error('Error getting backend live locations:', error);
      }

      // Get locations from Firebase
      let firebaseLocations = [];
      try {
        firebaseLocations = await FirebaseService.getAllLocationData();
      } catch (error) {
        console.error('Error getting Firebase live locations:', error);
      }

      // Combine and deduplicate locations
      const allLocations = [...backendLocations, ...firebaseLocations];

      // Remove duplicates based on userId and timestamp proximity
      const uniqueLocations = [];
      const seen = new Set();

      allLocations.forEach(location => {
        const key = `${location.userId}_${Math.floor(new Date(location.timestamp).getTime() / 60000)}`; // Group by minute
        if (!seen.has(key)) {
          seen.add(key);
          uniqueLocations.push(location);
        }
      });

      return uniqueLocations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error('Error getting live location data:', error);
      return [];
    }
  }

  // Get statistics for dashboard (PostgreSQL only)
  static async getDashboardStats() {
    try {
      const response = await fetch(`${BACKEND_API_URL}/admin/dashboard-stats`);
      if (response.ok) {
        const stats = await response.json();
        // Cache the stats to avoid fluctuation
        this.lastDashboardStats = stats;
        return stats;
      }

      // Return cached stats if available, otherwise default
      return this.lastDashboardStats || {
        todaySOSCount: 0,
        weekSOSCount: 0,
        monthSOSCount: 0,
        activeUsersCount: 0,
        recentEvents: []
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      // Return cached stats if available, otherwise default
      return this.lastDashboardStats || {
        todaySOSCount: 0,
        weekSOSCount: 0,
        monthSOSCount: 0,
        activeUsersCount: 0,
        recentEvents: []
      };
    }
  }

  // Get all users with enhanced data
  static async getAllUsers() {
    try {
      const response = await fetch(`${BACKEND_API_URL}/admin/users`);
      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (error) {
      console.error('Error getting all users:', error);
      return [];
    }
  }

  // Get user by ID
  static async getUserById(userId) {
    try {
      const response = await fetch(`${BACKEND_API_URL}/admin/users/${userId}`);
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  }

}
