# RakshaNet Admin Panel

A comprehensive police monitoring dashboard for the RakshaNet emergency response system. This admin panel provides real-time monitoring capabilities for law enforcement to track SOS events, user locations, and emergency activities.

## Features

### 🚨 Real-time SOS Monitoring
- Live monitoring of emergency SOS button activations
- Real-time alerts for new emergency events
- Detailed event information including location, contacts, and timestamps
- Priority-based event classification

### 🗺️ Interactive Heat Map
- Live location tracking of users
- Visual heat map showing emergency event clusters
- Google Maps integration with custom markers
- Filter by time ranges (1h, 6h, 24h, 7d)
- Toggle between SOS events and live locations

### 📊 Dashboard Analytics
- Real-time statistics and KPIs
- Activity trends and patterns
- User engagement metrics
- Emergency response analytics

### 👥 User Management
- User activity monitoring
- Contact information management
- User status tracking (active/inactive)
- Emergency contact details

## Technology Stack

- **Frontend**: React 18 with Vite
- **UI Framework**: Material-UI (MUI)
- **Maps**: Google Maps API with @vis.gl/react-google-maps
- **Database**: Firebase Firestore (real-time)
- **Charts**: Recharts
- **Routing**: React Router DOM

## Prerequisites

- Node.js 16+ and npm
- Google Maps API key
- Firebase project with Firestore enabled

## Installation

1. **Navigate to the AdminPanel directory:**
   ```bash
   cd AdminPanel
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Google Maps API:**
   - Update the `GOOGLE_MAPS_API_KEY` in `src/components/HeatMap.jsx`
   - Ensure the API key has the following APIs enabled:
     - Maps JavaScript API
     - Places API
     - Geocoding API

4. **Firebase Configuration:**
   - The Firebase config is already set up in `src/config/firebase.js`
   - Ensure your Firebase project has the correct security rules for admin access

## Running the Application

1. **Development mode:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3001`

2. **Build for production:**
   ```bash
   npm run build
   ```

3. **Preview production build:**
   ```bash
   npm run preview
   ```

## Firebase Security Rules

For the admin panel to work properly, ensure your Firestore has appropriate security rules. Example rules for admin access:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read access to sosEvents for admin monitoring
    match /sosEvents/{document} {
      allow read: if true; // Configure based on your admin authentication
    }
    
    // Allow read access to liveLocations for heat map
    match /liveLocations/{document} {
      allow read: if true; // Configure based on your admin authentication
    }
  }
}
```

## Features Overview

### Dashboard
- **Real-time Statistics**: Today's SOS count, weekly/monthly trends
- **Active Users**: 24-hour user activity tracking
- **Recent Events**: Live feed of latest emergency events
- **Quick Actions**: Direct navigation to key features

### Heat Map
- **Live Location Tracking**: Real-time user location visualization
- **SOS Event Mapping**: Emergency events plotted on interactive map
- **Time Filtering**: Filter events by time ranges
- **Interactive Markers**: Click markers for detailed information
- **Google Maps Integration**: Full maps functionality with directions

### SOS Monitor
- **Real-time Event Stream**: Live monitoring of emergency activations
- **Event Details**: Comprehensive information about each SOS event
- **Priority Classification**: Automatic priority assignment based on recency
- **Contact Information**: Emergency contact details for each event
- **Map Integration**: Direct links to Google Maps for navigation

### User Management
- **User Activity Tracking**: Monitor user engagement and activity
- **Contact Management**: View and manage user emergency contacts
- **Status Monitoring**: Track active/inactive users
- **Event History**: View user's SOS event history

## Data Structure

The admin panel expects the following Firestore collections:

### sosEvents Collection
```javascript
{
  type: "SMS" | "Call",
  address: "Human readable address",
  lat: number,
  lng: number,
  timestamp: "ISO string",
  contacts: [
    {
      name: "Contact name",
      phone: "Phone number",
      relationship: "Relationship"
    }
  ]
}
```

### liveLocations Collection (Optional)
```javascript
{
  userId: "User identifier",
  lat: number,
  lng: number,
  timestamp: "ISO string"
}
```

## Customization

### Styling
- The app uses Material-UI with a custom theme
- Primary color: `#DC2626` (Red - matching RakshaNet branding)
- Modify theme in `src/main.jsx`

### Maps Configuration
- Update Google Maps API key in `src/components/HeatMap.jsx`
- Customize map styles and markers as needed
- Default center is set to India coordinates

### Real-time Updates
- All components use Firebase real-time listeners
- Automatic updates without page refresh
- Configurable update intervals

## Deployment

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Deploy to your preferred hosting service:**
   - Firebase Hosting
   - Netlify
   - Vercel
   - Traditional web servers

3. **Environment Variables:**
   - Ensure all API keys are properly configured
   - Set up environment-specific configurations

## Security Considerations

- Implement proper authentication for admin access
- Configure Firebase security rules appropriately
- Secure API keys and sensitive configuration
- Use HTTPS in production
- Implement role-based access control

## Support

For issues or questions regarding the admin panel:
1. Check the console for error messages
2. Verify Firebase configuration and security rules
3. Ensure Google Maps API key is valid and has required permissions
4. Check network connectivity for real-time updates

## License

This admin panel is part of the RakshaNet emergency response system.
