import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Typography, Container } from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import HeatMap from './components/HeatMap';
import SOSMonitor from './components/SOSMonitor';
import UserManagement from './components/UserManagement';
import Navigation from './components/Navigation';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ backgroundColor: '#DC2626' }}>
        <Toolbar>
          <SecurityIcon sx={{ mr: 2 }} />
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            RakshaNet Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Police Monitoring Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      <Box sx={{ display: 'flex', flex: 1 }}>
        {/* Sidebar Navigation */}
        <Navigation />

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: '#f5f5f5' }}>
          <Container maxWidth="xl">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/heatmap" element={<HeatMap />} />
              <Route path="/sos-monitor" element={<SOSMonitor />} />
              <Route path="/users" element={<UserManagement />} />
            </Routes>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}

export default App;
