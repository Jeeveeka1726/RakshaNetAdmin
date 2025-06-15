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
  CircularProgress,
  TextField,
  Grid,
  Avatar,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { FirebaseService } from '../services/firebaseService';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [sosEvents, setSOSEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [userEvents, setUserEvents] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get SOS events to extract user information
      const unsubscribe = FirebaseService.subscribeToSOSEvents((events) => {
        setSOSEvents(events);
        
        // Extract unique users from SOS events
        const userMap = new Map();
        
        events.forEach(event => {
          // Extract user information from the event
          let userId, userName, userPhone;

          if (event.contacts && event.contacts.length > 0) {
            // Check if contacts is an array of objects or strings
            const firstContact = event.contacts[0];

            if (typeof firstContact === 'string') {
              // Contact is a phone number string
              userId = firstContact;
              userName = `User ${firstContact.slice(-4)}`; // Use last 4 digits
              userPhone = firstContact;
            } else if (typeof firstContact === 'object') {
              // Contact is an object with name and phone
              userId = firstContact.phone || firstContact.id || `user_${Date.now()}`;
              userName = firstContact.name || `User ${(firstContact.phone || '').slice(-4)}`;
              userPhone = firstContact.phone || 'Unknown';
            }
          } else {
            // No contacts, create user from event location/address
            const locationId = `${event.lat}_${event.lng}`.replace('.', '');
            userId = `location_${locationId}`;
            userName = event.address ?
              `User at ${event.address.split(',')[0]}` :
              `User at ${event.lat?.toFixed(4)}, ${event.lng?.toFixed(4)}`;
            userPhone = 'Not available';
          }

          if (!userMap.has(userId)) {
            userMap.set(userId, {
              id: userId,
              name: userName || 'Anonymous User',
              phone: userPhone || 'Not available',
              email: 'Not available',
              lastActivity: event.timestamp,
              sosCount: 1,
              status: 'active',
              location: event.address || `${event.lat}, ${event.lng}`,
              eventTypes: [event.type]
            });
          } else {
            const existingUser = userMap.get(userId);
            existingUser.sosCount += 1;

            // Add event type if not already present
            if (!existingUser.eventTypes.includes(event.type)) {
              existingUser.eventTypes.push(event.type);
            }

            // Update last activity if this event is more recent
            if (new Date(event.timestamp) > new Date(existingUser.lastActivity)) {
              existingUser.lastActivity = event.timestamp;
              existingUser.location = event.address || `${event.lat}, ${event.lng}`;
            }
          }
        });
        
        setUsers(Array.from(userMap.values()));
        setLoading(false);
      }, 200);

      return () => unsubscribe();
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const handleViewUser = (user) => {
    setSelectedUser(user);
    
    // Get events for this user
    const userSOSEvents = sosEvents.filter(event => 
      event.contacts && event.contacts.some(contact => 
        contact.phone === user.phone || contact.name === user.name
      )
    );
    setUserEvents(userSOSEvents);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedUser(null);
    setUserEvents([]);
  };

  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (lastActivity) => {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffHours = (now - activityDate) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'success'; // Active in last hour
    if (diffHours < 24) return 'warning'; // Active in last day
    return 'default'; // Inactive
  };

  const getStatusText = (lastActivity) => {
    const now = new Date();
    const activityDate = new Date(lastActivity);
    const diffHours = (now - activityDate) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'Active';
    if (diffHours < 24) return 'Recent';
    return 'Inactive';
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        User Management
      </Typography>

      {/* Search and Stats */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search users by name, phone, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Box display="flex" gap={2} alignItems="center" justifyContent="flex-end">
                <Typography variant="body2" color="textSecondary">
                  Total Users: {filteredUsers.length}
                </Typography>
                <Chip 
                  label={`Active: ${filteredUsers.filter(u => getStatusText(u.lastActivity) === 'Active').length}`}
                  color="success" 
                  size="small" 
                />
                <Chip 
                  label={`Recent: ${filteredUsers.filter(u => getStatusText(u.lastActivity) === 'Recent').length}`}
                  color="warning" 
                  size="small" 
                />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell sx={{ fontWeight: 600 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact & Location</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>SOS Events</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Last Activity</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user, index) => (
                    <TableRow key={user.id || index} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ bgcolor: '#DC2626' }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              ID: {user.id}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{user.phone}</Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1}>
                            <LocationIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ maxWidth: 150 }}>
                              {user.location ? user.location.split(',')[0] + '...' : 'Not available'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusText(user.lastActivity)}
                          color={getStatusColor(user.lastActivity)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.sosCount}
                          color={user.sosCount > 5 ? 'error' : user.sosCount > 2 ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatTimestamp(user.lastActivity)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleViewUser(user)}
                          color="primary"
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          User Details
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    User Information
                  </Typography>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Name:</strong> {selectedUser.name}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Phone:</strong> {selectedUser.phone}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Email:</strong> {selectedUser.email}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong> {getStatusText(selectedUser.lastActivity)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total SOS Events:</strong> {selectedUser.sosCount}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Event Types:</strong> {selectedUser.eventTypes?.join(', ') || 'Unknown'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Last Location:</strong> {selectedUser.location || 'Not available'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Last Activity:</strong> {formatTimestamp(selectedUser.lastActivity)}
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom>
                    Recent SOS Events
                  </Typography>
                  {userEvents.length > 0 ? (
                    <List dense>
                      {userEvents.slice(0, 5).map((event, index) => (
                        <React.Fragment key={event.id || index}>
                          <ListItem>
                            <ListItemText
                              primary={
                                <Box display="flex" alignItems="center" gap={1}>
                                  <Chip 
                                    label={event.type || 'Unknown'} 
                                    size="small" 
                                    color="primary"
                                  />
                                  <Typography variant="body2">
                                    {event.address || 'Address not available'}
                                  </Typography>
                                </Box>
                              }
                              secondary={formatTimestamp(event.timestamp)}
                            />
                          </ListItem>
                          {index < userEvents.slice(0, 5).length - 1 && <Divider />}
                        </React.Fragment>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="body2" color="textSecondary">
                      No SOS events found for this user
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default UserManagement;
