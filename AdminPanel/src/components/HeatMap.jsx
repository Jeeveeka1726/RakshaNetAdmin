import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Chip,
  Grid,
  Button,
} from '@mui/material';
import {
  LocationOn as LocationIcon
} from '@mui/icons-material';
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { DatabaseService } from '../services/databaseService';
import GoogleHeatMapLayer from './GoogleHeatMapLayer';
import MapController from './MapController';
import { majorCities, tamilNaduBounds } from '../data/tamilNaduDistricts';

// Replace with your Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyAeN6n8eMSKveBnlZT_oQQcgsFUfVjVfac';

function HeatMap() {
  const [locations, setLocations] = useState([]);
  const [sosEvents, setSOSEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [showSOSEvents, setShowSOSEvents] = useState(true);
  const [showLiveLocations, setShowLiveLocations] = useState(true);
  const [showHeatMap, setShowHeatMap] = useState(true);
  const [timeFilter, setTimeFilter] = useState('all');
  const [heatMapData, setHeatMapData] = useState([]);
  const [allLocationData, setAllLocationData] = useState([]);
  const [currentZoom, setCurrentZoom] = useState(7);
  const [keyboardActive, setKeyboardActive] = useState(false);

  // Tamil Nadu center coordinates
  const tamilNaduCenter = { lat: 11.1271, lng: 78.6569 };
  const [mapCenter, setMapCenter] = useState(tamilNaduCenter);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    setLoading(true);

    const unsubscribers = [];

    // Load live locations from Firebase
    if (showLiveLocations) {
      DatabaseService.getLiveLocationData()
        .then(liveLocations => {
          console.log('📍 Loaded live locations:', liveLocations.length);
          setLocations(liveLocations);
          setAllLocationData(liveLocations);
        })
        .catch(error => {
          console.error('Error loading live locations:', error);
          setLocations([]);
        });
    }

    // Subscribe to SOS events if enabled
    if (showSOSEvents) {
      // Use different service method based on time filter
      const sosUnsubscribe = timeFilter === 'all'
        ? DatabaseService.subscribeToAllSOSEvents((events) => {
            setSOSEvents(events);
            setLoading(false);
          })
        : DatabaseService.subscribeToSOSEvents((events) => {
            // Filter events based on time filter
            const filteredEvents = filterEventsByTime(events, timeFilter);
            setSOSEvents(filteredEvents);
            setLoading(false);
          }, 200);
      unsubscribers.push(sosUnsubscribe);
    }

    if (!showLiveLocations && !showSOSEvents) {
      setLoading(false);
    }

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [showSOSEvents, showLiveLocations, timeFilter]);

  // Regenerate heat map data when location data or SOS events change
  useEffect(() => {
    const combinedData = [...allLocationData, ...sosEvents];
    const heatData = generateHeatMapData(combinedData);
    setHeatMapData(heatData);
  }, [allLocationData, sosEvents]);

  // Keyboard navigation for map
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle arrow keys when not typing in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      const panDistance = 0.1; // Degrees to pan
      const zoomStep = 1;
      let newCenter = { ...mapCenter };
      let newZoom = currentZoom;

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault();
          setKeyboardActive(true);
          newCenter.lat = Math.min(newCenter.lat + panDistance, tamilNaduBounds.north);
          setMapCenter(newCenter);
          break;
        case 'ArrowDown':
          event.preventDefault();
          setKeyboardActive(true);
          newCenter.lat = Math.max(newCenter.lat - panDistance, tamilNaduBounds.south);
          setMapCenter(newCenter);
          break;
        case 'ArrowLeft':
          event.preventDefault();
          setKeyboardActive(true);
          newCenter.lng = Math.max(newCenter.lng - panDistance, tamilNaduBounds.west);
          setMapCenter(newCenter);
          break;
        case 'ArrowRight':
          event.preventDefault();
          setKeyboardActive(true);
          newCenter.lng = Math.min(newCenter.lng + panDistance, tamilNaduBounds.east);
          setMapCenter(newCenter);
          break;
        case '+':
        case '=':
          event.preventDefault();
          setKeyboardActive(true);
          setCurrentZoom(prev => Math.min(prev + zoomStep, 18));
          break;
        case '-':
          event.preventDefault();
          setKeyboardActive(true);
          setCurrentZoom(prev => Math.max(prev - zoomStep, 5));
          break;
        case 'Home':
          event.preventDefault();
          setKeyboardActive(true);
          setMapCenter(tamilNaduCenter);
          setCurrentZoom(7);
          break;
        default:
          break;
      }
    };

    // Add event listener
    window.addEventListener('keydown', handleKeyDown);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [mapCenter, currentZoom, tamilNaduCenter]);

  // Reset keyboard active indicator after a delay
  useEffect(() => {
    if (keyboardActive) {
      const timer = setTimeout(() => {
        setKeyboardActive(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [keyboardActive]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load live location data from Firebase
      const liveLocationData = await DatabaseService.getLiveLocationData();
      console.log('📍 Initial live locations loaded:', liveLocationData.length);

      setAllLocationData(liveLocationData);
      setLocations(liveLocationData);

      // Generate heat map data
      const heatData = generateHeatMapData([...liveLocationData, ...sosEvents]);
      setHeatMapData(heatData);

      // Keep Tamil Nadu center, but adjust if data is outside Tamil Nadu bounds
      if (liveLocationData.length > 0) {
        const firstLocation = liveLocationData[0];
        // Only update center if data is outside Tamil Nadu bounds
        if (firstLocation.lat < 8 || firstLocation.lat > 13.5 ||
            firstLocation.lng < 76.5 || firstLocation.lng > 80.5) {
          setMapCenter({
            lat: firstLocation.lat,
            lng: firstLocation.lng
          });
        }
      }

    } catch (error) {
      console.error('Error loading initial data:', error);
      setError('Failed to load location data');
    } finally {
      setLoading(false);
    }
  };

  const filterEventsByTime = (events, filter) => {
    if (filter === 'all') {
      return events; // Return all events regardless of time
    }

    const now = new Date();
    let cutoffTime;

    switch (filter) {
      case '1h':
        cutoffTime = new Date(now.getTime() - (1 * 60 * 60 * 1000));
        break;
      case '6h':
        cutoffTime = new Date(now.getTime() - (6 * 60 * 60 * 1000));
        break;
      case '24h':
        cutoffTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));
        break;
      case '7d':
        cutoffTime = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
        break;
      case '30d':
        cutoffTime = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
        break;
      case '90d':
        cutoffTime = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
        break;
      case '1y':
        cutoffTime = new Date(now.getTime() - (365 * 24 * 60 * 60 * 1000));
        break;
      default:
        return events;
    }

    return events.filter(event => {
      try {
        const eventTime = new Date(event.timestamp);
        return eventTime >= cutoffTime;
      } catch {
        return false;
      }
    });
  };

  // Generate heat map data by clustering nearby locations
  const generateHeatMapData = (allData) => {
    if (!allData || allData.length === 0) return [];

    const gridSize = 0.01; // Approximately 1km grid
    const clusters = {}; // Use plain object instead of Map

    allData.forEach(point => {
      if (!point.lat || !point.lng) return;

      // Round coordinates to create grid
      const gridLat = Math.round(point.lat / gridSize) * gridSize;
      const gridLng = Math.round(point.lng / gridSize) * gridSize;
      const key = `${gridLat},${gridLng}`;

      if (!clusters[key]) {
        clusters[key] = {
          lat: gridLat,
          lng: gridLng,
          count: 0,
          points: []
        };
      }

      clusters[key].count += 1;
      clusters[key].points.push(point);
    });

    return Object.values(clusters).filter(cluster => cluster.count > 0);
  };

  // Get heat map intensity color based on count
  const getHeatMapColor = (count, maxCount) => {
    const intensity = count / maxCount;

    if (intensity > 0.8) return '#8B0000'; // Dark red
    if (intensity > 0.6) return '#DC2626'; // Red
    if (intensity > 0.4) return '#EF4444'; // Light red
    if (intensity > 0.2) return '#F87171'; // Very light red
    return '#FCA5A5'; // Lightest red
  };

  // Get heat map radius based on count
  const getHeatMapRadius = (count, maxCount) => {
    const intensity = count / maxCount;
    return Math.max(50, intensity * 200); // Minimum 50px, maximum 200px
  };

  const handleMarkerClick = useCallback((marker, type) => {
    setSelectedMarker({ ...marker, type });
  }, []);

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getMarkerColor = (type) => {
    switch (type) {
      case 'sos':
        return '#DC2626'; // Red for SOS events
      case 'location':
        return '#2563EB'; // Blue for live locations
      default:
        return '#6B7280'; // Gray for unknown
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 600 }}>
          Tamil Nadu Heat Map
        </Typography>
        <Box display="flex" gap={1}>
          <Chip
            label="Tamil Nadu Focus"
            color="primary"
            size="small"
            icon={<LocationIcon />}
          />
          <Chip
            label="32 Districts"
            color="secondary"
            size="small"
          />
        </Box>
      </Box>

      {/* Quick Navigation for Tamil Nadu Cities */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Navigation - Major Cities
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {majorCities.map((city) => (
              <Button
                key={city.name}
                variant="outlined"
                size="small"
                onClick={() => setMapCenter({ lat: city.lat, lng: city.lng })}
                sx={{ textTransform: 'none' }}
              >
                {city.name}
              </Button>
            ))}
            <Button
              variant="contained"
              size="small"
              onClick={() => setMapCenter(tamilNaduCenter)}
              sx={{ textTransform: 'none' }}
            >
              Tamil Nadu Overview
            </Button>
          </Box>
        </CardContent>
      </Card>



      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Time Filter</InputLabel>
                <Select
                  value={timeFilter}
                  label="Time Filter"
                  onChange={(e) => setTimeFilter(e.target.value)}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="1h">Last 1 Hour</MenuItem>
                  <MenuItem value="6h">Last 6 Hours</MenuItem>
                  <MenuItem value="24h">Last 24 Hours</MenuItem>
                  <MenuItem value="7d">Last 7 Days</MenuItem>
                  <MenuItem value="30d">Last 30 Days</MenuItem>
                  <MenuItem value="90d">Last 90 Days</MenuItem>
                  <MenuItem value="1y">Last 1 Year</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showSOSEvents}
                    onChange={(e) => setShowSOSEvents(e.target.checked)}
                    color="primary"
                  />
                }
                label="SOS Events"
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showLiveLocations}
                    onChange={(e) => setShowLiveLocations(e.target.checked)}
                    color="primary"
                  />
                }
                label="Live Locations"
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={showHeatMap}
                    onChange={(e) => setShowHeatMap(e.target.checked)}
                    color="secondary"
                  />
                }
                label="Heat Map"
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip
                  label={`SOS: ${sosEvents.length}`}
                  color="error"
                  size="small"
                />
                <Chip
                  label={`Live: ${locations.length}`}
                  color="primary"
                  size="small"
                />
                <Chip
                  label={`All Data: ${allLocationData.length}`}
                  color="secondary"
                  size="small"
                />
                <Chip
                  label={`Heat Points: ${sosEvents.length + allLocationData.length}`}
                  color="warning"
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>

          {/* Heat Map Information */}
          {showHeatMap && (
            <Grid container spacing={3} alignItems="center" sx={{ mt: 2, pt: 2, borderTop: '1px solid #e0e0e0' }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                  🔥 **Heat Map**: Shows exact SOS event locations with density-based intensity
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  🗺️ Navigation: Mouse wheel to zoom, drag to pan | ⌨️ Arrow keys, +/- zoom, Home for overview
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  🎯 **Colors**: Orange (medium activity) → Red (high activity) based on event concentration
                </Typography>
                <Typography variant="caption" color="textSecondary" display="block">
                  📍 Major cities: Chennai, Coimbatore, Madurai, Salem, Tiruchirappalli, Tirunelveli
                </Typography>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Help */}
      <Card sx={{ mb: 2, backgroundColor: '#f8f9fa' }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
            ⌨️ Keyboard Shortcuts
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Navigation:</Typography>
              <Typography variant="caption" display="block">↑↓←→ Arrow keys to pan</Typography>
              <Typography variant="caption" display="block">Home - Return to Tamil Nadu overview</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Zoom:</Typography>
              <Typography variant="caption" display="block">+ or = to zoom in</Typography>
              <Typography variant="caption" display="block">- to zoom out</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Current View:</Typography>
              <Typography variant="caption" display="block">Zoom Level: {currentZoom}</Typography>
              <Typography variant="caption" display="block">Center: {mapCenter.lat.toFixed(3)}, {mapCenter.lng.toFixed(3)}</Typography>
              {keyboardActive && (
                <Chip
                  label="⌨️ Keyboard Active"
                  color="success"
                  size="small"
                  sx={{ mt: 0.5, fontSize: '0.7rem' }}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>Tips:</Typography>
              <Typography variant="caption" display="block">Focus on map area first</Typography>
              <Typography variant="caption" display="block">Shortcuts work when not typing</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Map */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ height: '70vh', width: '100%' }}>
            {error ? (
              <Alert severity="error" sx={{ m: 2 }}>
                {error}
              </Alert>
            ) : (
              <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
                <Map
                  defaultZoom={7}
                  defaultCenter={tamilNaduCenter}
                  mapId="rakshanet-heatmap"
                  style={{ width: '100%', height: '100%' }}
                  gestureHandling="greedy"
                  disableDefaultUI={false}
                  zoomControl={true}
                  mapTypeControl={true}
                  scaleControl={true}
                  streetViewControl={true}
                  rotateControl={true}
                  fullscreenControl={true}
                  clickableIcons={true}
                  scrollwheel={true}
                  disableDoubleClickZoom={false}
                  draggable={true}
                  keyboardShortcuts={true}
                >
                  {/* Map Controller for handling zoom and center changes */}
                  <MapController
                    center={mapCenter}
                    zoom={currentZoom}
                    onZoomChange={setCurrentZoom}
                    onCenterChange={setMapCenter}
                  />
                  {/* Google Heat Map Layer */}
                  {showHeatMap && (
                    <GoogleHeatMapLayer
                      data={[...allLocationData, ...sosEvents]}
                      options={{
                        radius: 50, // Fixed radius
                        gradient: [
                          'rgba(255, 255, 0, 0)', // Transparent (no activity)
                          'rgba(255, 200, 0, 0.6)', // Light orange
                          'rgba(255, 100, 0, 0.8)', // Dark orange
                          'rgba(255, 0, 0, 1.0)' // Full red (highest density)
                        ],
                        maxIntensity: undefined,
                        dissipating: true
                      }}
                    />
                  )}

                  {/* All Location Data Markers (from all collections) */}
                  {showLiveLocations && allLocationData.map((location, index) => (
                    location.lat && location.lng && (
                      <AdvancedMarker
                        key={`all-location-${location.id || index}`}
                        position={{ lat: location.lat, lng: location.lng }}
                        onClick={() => handleMarkerClick({
                          ...location,
                          type: 'location',
                          source: location.collection
                        }, 'location')}
                        title={`Location: ${location.collection || 'Unknown'}`}
                      />
                    )
                  ))}

                  {/* SOS Event Markers */}
                  {showSOSEvents && sosEvents.map((event, index) => (
                    event.lat && event.lng && (
                      <AdvancedMarker
                        key={`sos-${event.id || index}`}
                        position={{ lat: event.lat, lng: event.lng }}
                        onClick={() => handleMarkerClick(event, 'sos')}
                        title={`SOS Event: ${event.type || 'Unknown'}`}
                      />
                    )
                  ))}

                  {/* Info Window */}
                  {selectedMarker && (
                    <InfoWindow
                      position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
                      onCloseClick={() => setSelectedMarker(null)}
                    >
                      <Box sx={{ p: 1, minWidth: 250 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                          {selectedMarker.type === 'sos' && 'SOS Event'}
                          {selectedMarker.type === 'location' && 'Location Data'}
                          {selectedMarker.type === 'heatzone' && 'Heat Zone'}
                        </Typography>

                        {selectedMarker.type === 'sos' && (
                          <>
                            <Typography variant="body2">
                              <strong>Event Type:</strong> {selectedMarker.type || 'Unknown'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Time:</strong> {formatTimestamp(selectedMarker.timestamp)}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Address:</strong> {selectedMarker.address || 'Not available'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Contacts:</strong> {selectedMarker.contacts?.length || 0} notified
                            </Typography>
                          </>
                        )}

                        {selectedMarker.type === 'location' && (
                          <>
                            <Typography variant="body2">
                              <strong>Source:</strong> {selectedMarker.source || 'Unknown'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>User ID:</strong> {selectedMarker.userId || 'Not available'}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Collection:</strong> {selectedMarker.collection || 'Unknown'}
                            </Typography>
                            {selectedMarker.timestamp && (
                              <Typography variant="body2">
                                <strong>Last Updated:</strong> {formatTimestamp(selectedMarker.timestamp)}
                              </Typography>
                            )}
                          </>
                        )}

                        {selectedMarker.type === 'heatzone' && (
                          <>
                            <Typography variant="body2">
                              <strong>Activity Count:</strong> {selectedMarker.count} data points
                            </Typography>
                            <Typography variant="body2">
                              <strong>Description:</strong> {selectedMarker.description}
                            </Typography>
                            <Typography variant="body2" sx={{ mt: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                              This area shows high activity concentration. Darker shades indicate more data points.
                            </Typography>
                          </>
                        )}

                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Coordinates:</strong> {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}
                        </Typography>
                      </Box>
                    </InfoWindow>
                  )}
                </Map>
              </APIProvider>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default HeatMap;
