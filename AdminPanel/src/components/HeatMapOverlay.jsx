import React from 'react';
import { Box, Typography } from '@mui/material';

// Custom heat map overlay component
function HeatMapOverlay({ heatMapData, mapCenter, zoom = 10 }) {
  if (!heatMapData || heatMapData.length === 0) {
    return null;
  }

  const maxCount = Math.max(...heatMapData.map(h => h.count));

  const getHeatMapColor = (count, maxCount) => {
    const intensity = count / maxCount;
    
    if (intensity > 0.8) return '#8B0000'; // Dark red
    if (intensity > 0.6) return '#DC2626'; // Red
    if (intensity > 0.4) return '#EF4444'; // Light red
    if (intensity > 0.2) return '#F87171'; // Very light red
    return '#FCA5A5'; // Lightest red
  };

  const getHeatMapSize = (count, maxCount) => {
    const intensity = count / maxCount;
    return Math.max(20, intensity * 60); // Minimum 20px, maximum 60px
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1,
      }}
    >
      {heatMapData.map((heatPoint, index) => {
        // Simple coordinate to pixel conversion (this is approximate)
        const x = ((heatPoint.lng - mapCenter.lng) * 100000) + 50;
        const y = ((mapCenter.lat - heatPoint.lat) * 100000) + 50;
        
        return (
          <Box
            key={`heat-overlay-${index}`}
            sx={{
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
              width: getHeatMapSize(heatPoint.count, maxCount),
              height: getHeatMapSize(heatPoint.count, maxCount),
              backgroundColor: getHeatMapColor(heatPoint.count, maxCount),
              borderRadius: '50%',
              opacity: 0.6,
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'white',
                fontWeight: 'bold',
                fontSize: '10px',
              }}
            >
              {heatPoint.count}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}

export default HeatMapOverlay;
