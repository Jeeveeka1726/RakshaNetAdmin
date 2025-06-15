import React from 'react';
import { Box } from '@mui/material';

// Simple CSS-based heat map as fallback
function SimpleHeatMap({ data, radius = 60, opacity = 0.8 }) {
  if (!data || data.length === 0) return null;

  // Create heat zones based on data density
  const createHeatZones = () => {
    const zones = [];
    const gridSize = 0.005; // Smaller grid for better resolution
    const clusters = {};

    // Group data points into clusters
    data.forEach((point, index) => {
      if (!point.lat || !point.lng) return;
      
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

    // Convert clusters to heat zones
    const maxCount = Math.max(...Object.values(clusters).map(c => c.count));
    
    Object.values(clusters).forEach((cluster, index) => {
      const intensity = cluster.count / maxCount;
      const size = Math.max(radius * 0.5, radius * intensity);
      
      // Create multiple overlapping circles for wave effect
      for (let i = 0; i < 3; i++) {
        zones.push({
          id: `${cluster.lat}-${cluster.lng}-${i}`,
          lat: cluster.lat,
          lng: cluster.lng,
          size: size * (1 + i * 0.3),
          intensity: intensity * (1 - i * 0.2),
          delay: i * 0.5
        });
      }
    });

    return zones;
  };

  const heatZones = createHeatZones();

  const getHeatColor = (intensity) => {
    // Orange to red gradient
    if (intensity > 0.8) return `rgba(255, 0, 0, ${intensity * opacity})`;
    if (intensity > 0.6) return `rgba(255, 69, 0, ${intensity * opacity})`;
    if (intensity > 0.4) return `rgba(255, 140, 0, ${intensity * opacity})`;
    if (intensity > 0.2) return `rgba(255, 165, 0, ${intensity * opacity})`;
    return `rgba(255, 215, 0, ${intensity * opacity})`;
  };

  return (
    <>
      {heatZones.map((zone) => (
        <div
          key={zone.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: zone.size,
            height: zone.size,
            backgroundColor: getHeatColor(zone.intensity),
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 1,
            animation: `heatPulse 3s ease-in-out infinite ${zone.delay}s`,
            filter: 'blur(2px)',
          }}
        />
      ))}
      
      <style jsx>{`
        @keyframes heatPulse {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 0.8;
          }
          50% {
            transform: translate(-50%, -50%) scale(1.1);
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  );
}

export default SimpleHeatMap;
