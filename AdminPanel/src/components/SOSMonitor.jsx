import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Badge,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  LocationOn as LocationIcon,
  Refresh as RefreshIcon,
  Mic as MicIcon,
  DirectionsRun as DirectionsRunIcon,
  TouchApp as TouchAppIcon,
} from '@mui/icons-material';
import { DatabaseService } from '../services/databaseService';

function SOSMonitor() {
  const [sosEvents, setSOSEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [newEventsCount, setNewEventsCount] = useState(0);

  useEffect(() => {
    // Subscribe to real-time SOS events
    const unsubscribe = DatabaseService.subscribeToSOSEvents((events) => {
      // Only update if events actually changed
      if (JSON.stringify(events) !== JSON.stringify(sosEvents)) {
        const previousCount = sosEvents.length;
        setSOSEvents(events);

        // Count new events
        if (previousCount > 0 && events.length > previousCount) {
          setNewEventsCount(events.length - previousCount);
          // Reset count after 5 seconds
          setTimeout(() => setNewEventsCount(0), 5000);
        }

        setLoading(false);
      }
    }, 100);

    return () => unsubscribe();
  }, []); // Remove dependency to prevent unnecessary re-subscriptions

  const handleViewDetails = (event) => {
    setSelectedEvent(event);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEvent(null);
  };

  const formatTimestamp = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString(),
      };
    } catch {
      return { date: 'Invalid', time: 'Invalid' };
    }
  };

  const getEventTypeIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'voice':
        return <MicIcon fontSize="small" />;
      case 'motion':
        return <DirectionsRunIcon fontSize="small" />;
      case 'button':
        return <TouchAppIcon fontSize="small" />;
      case 'sms':
        return <MessageIcon fontSize="small" />;
      case 'call':
        return <PhoneIcon fontSize="small" />;
      default:
        return <LocationIcon fontSize="small" />;
    }
  };

  const getEventTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'voice':
        return 'error'; // Red for voice SOS
      case 'motion':
        return 'warning'; // Orange for motion SOS
      case 'button':
        return 'info'; // Blue for button SOS
      case 'sms':
        return 'primary';
      case 'call':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (timestamp) => {
    const eventTime = new Date(timestamp);
    const now = new Date();
    const diffMinutes = (now - eventTime) / (1000 * 60);
    
    if (diffMinutes < 5) return 'error'; // High priority - very recent
    if (diffMinutes < 30) return 'warning'; // Medium priority
    return 'success'; // Lower priority
  };

  const filteredEvents = sosEvents.filter(event => {
    if (filter === 'all') return true;
    return event.type?.toLowerCase() === filter;
  });

  const openInMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
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
          SOS Events Monitor
        </Typography>
        <Badge badgeContent={newEventsCount} color="error">
          <IconButton onClick={() => window.location.reload()}>
            <RefreshIcon />
          </IconButton>
        </Badge>
      </Box>

      {newEventsCount > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {newEventsCount} new SOS event(s) detected!
        </Alert>
      )}

      {/* Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Filter by Type</InputLabel>
                <Select
                  value={filter}
                  label="Filter by Type"
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <MenuItem value="all">All Events</MenuItem>
                  <MenuItem value="voice">Voice SOS</MenuItem>
                  <MenuItem value="motion">Motion SOS</MenuItem>
                  <MenuItem value="button">Button SOS</MenuItem>
                  <MenuItem value="sms">SMS Events</MenuItem>
                  <MenuItem value="call">Call Events</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Box display="flex" gap={2} alignItems="center">
                <Typography variant="body2" color="textSecondary">
                  Total Events: {filteredEvents.length}
                </Typography>
                <Chip
                  label={`Voice: ${sosEvents.filter(e => e.type?.toLowerCase() === 'voice').length}`}
                  color="error"
                  size="small"
                />
                <Chip
                  label={`Motion: ${sosEvents.filter(e => e.type?.toLowerCase() === 'motion').length}`}
                  color="warning"
                  size="small"
                />
                <Chip
                  label={`Button: ${sosEvents.filter(e => e.type?.toLowerCase() === 'button').length}`}
                  color="info"
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date & Time</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contacts</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No SOS events found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEvents.map((event, index) => {
                    const { date, time } = formatTimestamp(event.timestamp);
                    return (
                      <TableRow key={event.id || index} hover>
                        <TableCell>
                          <Chip
                            size="small"
                            label={getPriorityColor(event.timestamp).toUpperCase()}
                            color={getPriorityColor(event.timestamp)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getEventTypeIcon(event.type)}
                            <Chip
                              label={event.type || 'Unknown'}
                              color={getEventTypeColor(event.type)}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2">{date}</Typography>
                            <Typography variant="caption" color="textSecondary">
                              {time}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ maxWidth: 200 }}>
                              {event.address || 'Address not available'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {event.lat?.toFixed(4)}, {event.lng?.toFixed(4)}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {event.contacts?.length || 0} contacts
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box display="flex" gap={1}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewDetails(event)}
                              color="primary"
                            >
                              <VisibilityIcon fontSize="small" />
                            </IconButton>
                            {event.lat && event.lng && (
                              <IconButton
                                size="small"
                                onClick={() => openInMaps(event.lat, event.lng)}
                                color="secondary"
                              >
                                <LocationIcon fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Event Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          SOS Event Details
        </DialogTitle>
        <DialogContent>
          {selectedEvent && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Event Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Type:</strong> {selectedEvent.type || 'Unknown'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Timestamp:</strong> {formatTimestamp(selectedEvent.timestamp).date} at {formatTimestamp(selectedEvent.timestamp).time}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Address:</strong> {selectedEvent.address || 'Not available'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Coordinates:</strong> {selectedEvent.lat}, {selectedEvent.lng}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Emergency Contacts
                  </Typography>
                  {selectedEvent.contacts && selectedEvent.contacts.length > 0 ? (
                    <Box>
                      {selectedEvent.contacts.map((contact, index) => (
                        <Box key={index} sx={{ mb: 1, p: 1, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="body2">
                            <strong>{contact.name}</strong>
                          </Typography>
                          <Typography variant="caption">
                            {contact.phone} • {contact.relationship}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No contacts available
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedEvent?.lat && selectedEvent?.lng && (
            <Button
              onClick={() => openInMaps(selectedEvent.lat, selectedEvent.lng)}
              startIcon={<LocationIcon />}
              color="primary"
            >
              Open in Maps
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SOSMonitor;
