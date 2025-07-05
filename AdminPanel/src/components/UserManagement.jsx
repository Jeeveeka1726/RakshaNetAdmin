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
  Contacts as ContactsIcon,
} from '@mui/icons-material';
import { DatabaseService } from '../services/databaseService';

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

      // Get real users from PostgreSQL database (already includes SOS event data)
      const realUsers = await DatabaseService.getAllUsers();

      // Set users directly since they already include SOS event information
      setUsers(realUsers);
      setLoading(false);
    } catch (error) {
      console.error('Error loading user data:', error);
      setLoading(false);
    }
  };

  const handleViewUser = async (user) => {
    setSelectedUser(user);

    // Get SOS events for this specific user from the database
    try {
      const response = await fetch(`http://localhost:5500/api/admin/sos-events?userId=${user.id}`);
      if (response.ok) {
        const userSOSEvents = await response.json();
        setUserEvents(userSOSEvents);
      } else {
        setUserEvents([]);
      }
    } catch (error) {
      console.error('Error fetching user SOS events:', error);
      setUserEvents([]);
    }

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
                  <TableCell sx={{ fontWeight: 600 }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Registration</TableCell>
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
                          <Avatar sx={{
                            bgcolor: user.isRealUser ? '#2E7D32' : '#DC2626',
                            border: user.isRealUser ? '2px solid #4CAF50' : '2px solid #F44336'
                          }}>
                            <PersonIcon />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                              {user.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {user.isRealUser ? `User ID: ${user.id}` : `Temp ID: ${user.id}`}
                            </Typography>
                            {user.isRealUser && (
                              <Chip
                                label="Registered"
                                color="success"
                                size="small"
                                sx={{ ml: 1, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{user.phone || 'No phone'}</Typography>
                          </Box>
                          <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                            <EmailIcon fontSize="small" color="action" />
                            <Typography variant="body2" sx={{ maxWidth: 150 }}>
                              {user.email !== 'Not available' ? user.email : 'No email'}
                            </Typography>
                          </Box>
                          {user.emergency_contacts_count > 0 && (
                            <Box display="flex" alignItems="center" gap={1}>
                              <ContactsIcon fontSize="small" color="success" />
                              <Typography variant="caption" color="success.main">
                                {user.emergency_contacts_count} emergency contacts
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Chip
                            label={user.isRealUser ? 'Registered User' : 'SOS Only'}
                            color={user.isRealUser ? 'success' : 'warning'}
                            size="small"
                            sx={{ mb: 0.5 }}
                          />
                          {user.registeredAt && (
                            <Typography variant="caption" display="block" color="textSecondary">
                              Joined: {new Date(user.registeredAt).toLocaleDateString()}
                            </Typography>
                          )}
                        </Box>
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
                      <strong>Registration Status:</strong>
                      <Chip
                        label={selectedUser.isRealUser ? 'Registered User' : 'SOS Only'}
                        color={selectedUser.isRealUser ? 'success' : 'warning'}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                    {selectedUser.registeredAt && (
                      <Typography variant="body2">
                        <strong>Registration Date:</strong> {formatTimestamp(selectedUser.registeredAt)}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Total SOS Events:</strong> {selectedUser.sosCount}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Event Types:</strong> {selectedUser.eventTypes?.join(', ') || 'None'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Last Location:</strong> {selectedUser.location || 'Not available'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Last Activity:</strong> {formatTimestamp(selectedUser.lastActivity)}
                    </Typography>
                    {selectedUser.emergency_contacts_count > 0 && (
                      <>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Emergency Contacts:</strong> {selectedUser.emergency_contacts_count}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                          {selectedUser.emergency_contacts?.map((contact, index) => (
                            <Chip
                              key={index}
                              label={`${contact} (${selectedUser.emergency_phones?.[index] || 'No phone'})`}
                              size="small"
                              variant="outlined"
                              color="success"
                              sx={{ mr: 0.5, mb: 0.5 }}
                            />
                          ))}
                        </Box>
                      </>
                    )}
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
