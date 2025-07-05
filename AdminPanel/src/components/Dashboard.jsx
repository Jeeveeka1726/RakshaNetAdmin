import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
} from '@mui/material';
import {
  Warning as WarningIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DatabaseService } from '../services/databaseService';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [sqlStats, setSqlStats] = useState(null);

  useEffect(() => {
    loadDashboardData();

    // Set up real-time listener for recent events
    const unsubscribe = DatabaseService.subscribeToSOSEvents((events) => {
      setRecentEvents(events.slice(0, 5)); // Show only 5 most recent
    }, 10);

    return () => unsubscribe();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dashboardStats = await DatabaseService.getDashboardStats();
      setStats(dashboardStats);
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };



  const formatTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return 'Invalid time';
    }
  };

  const getEventTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'sms':
        return 'primary';
      case 'call':
        return 'secondary';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Dashboard Overview
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Today's SOS Events
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#DC2626' }}>
                    {stats?.todaySOSCount || 0}
                  </Typography>
                </Box>
                <WarningIcon sx={{ fontSize: 40, color: '#DC2626', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    This Week
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2' }}>
                    {stats?.weekSOSCount || 0}
                  </Typography>
                </Box>
                <TrendingUpIcon sx={{ fontSize: 40, color: '#1976d2', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    This Month
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#2e7d32' }}>
                    {stats?.monthSOSCount || 0}
                  </Typography>
                </Box>
                <AccessTimeIcon sx={{ fontSize: 40, color: '#2e7d32', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Active Users (24h)
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 600, color: '#ed6c02' }}>
                    {stats?.activeUsersCount || 0}
                  </Typography>
                </Box>
                <PeopleIcon sx={{ fontSize: 40, color: '#ed6c02', opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* SQL Database Stats */}
      {sqlStats && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2, fontWeight: 600 }}>
            User Registration Statistics
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Total Registered Users
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                        {sqlStats.totalUsers}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: '#2E7D32', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Users with Emergency Contacts
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#1976d2' }}>
                        {sqlStats.usersWithContacts}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: '#1976d2', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Total Emergency Contacts
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#ed6c02' }}>
                        {sqlStats.totalContacts}
                      </Typography>
                    </Box>
                    <PeopleIcon sx={{ fontSize: 40, color: '#ed6c02', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Box>
                      <Typography color="textSecondary" gutterBottom variant="body2">
                        Setup Completion Rate
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600, color: '#9c27b0' }}>
                        {sqlStats.setupCompletionRate}%
                      </Typography>
                    </Box>
                    <TrendingUpIcon sx={{ fontSize: 40, color: '#9c27b0', opacity: 0.7 }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </>
      )}

      {/* Recent Events */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent SOS Events
              </Typography>
              {recentEvents.length === 0 ? (
                <Typography color="textSecondary" sx={{ py: 2 }}>
                  No recent SOS events
                </Typography>
              ) : (
                <List>
                  {recentEvents.map((event, index) => (
                    <ListItem key={event.id || index} divider={index < recentEvents.length - 1}>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip 
                              label={event.type || 'Unknown'} 
                              size="small" 
                              color={getEventTypeColor(event.type)}
                            />
                            <Typography variant="body2">
                              {event.address || `${event.lat}, ${event.lng}`}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="textSecondary">
                            {formatTime(event.timestamp)} • {event.contacts?.length || 0} contacts notified
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f5f5f5', 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#e0e0e0' }
                  }}
                  onClick={() => window.location.href = '/heatmap'}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    View Live Heat Map
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    See real-time user locations
                  </Typography>
                </Paper>
                
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f5f5f5', 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#e0e0e0' }
                  }}
                  onClick={() => window.location.href = '/sos-monitor'}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Monitor SOS Events
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    Real-time emergency alerts
                  </Typography>
                </Paper>
                
                <Paper 
                  sx={{ 
                    p: 2, 
                    backgroundColor: '#f5f5f5', 
                    cursor: 'pointer',
                    '&:hover': { backgroundColor: '#e0e0e0' }
                  }}
                  onClick={() => window.location.href = '/users'}
                >
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    Manage Users
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    View user activity and details
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Dashboard;
