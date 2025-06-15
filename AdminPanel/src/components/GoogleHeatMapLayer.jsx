import { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

function GoogleHeatMapLayer({ data, options = {} }) {
  const map = useMap();
  const visualization = useMapsLibrary('visualization');
  const [heatmapLayer, setHeatmapLayer] = useState(null);

  useEffect(() => {
    if (!map || !visualization || !data || data.length === 0) return;

    try {
      // Create heat map data points (simple locations)
      const heatmapData = data.map(point => {
        if (point.lat && point.lng) {
          return new google.maps.LatLng(point.lat, point.lng);
        }
        return null;
      }).filter(point => point !== null);

      if (heatmapData.length === 0) return;

      // Create heat map layer
      const heatmap = new google.maps.visualization.HeatmapLayer({
        data: heatmapData,
        map: map,
        ...options
      });

      // Configure heat map appearance with density-based opacity
      heatmap.setOptions({
        radius: options.radius || 60, // Fixed radius
        opacity: 1.0, // Maximum opacity for proper density visualization
        gradient: options.gradient || [
          'rgba(255, 255, 0, 0)', // Transparent yellow (no activity)
          'rgba(255, 255, 0, 0.2)', // Very light yellow (minimal activity)
          'rgba(255, 200, 0, 0.4)', // Light orange (low activity)
          'rgba(255, 150, 0, 0.6)', // Orange (medium activity)
          'rgba(255, 100, 0, 0.8)', // Dark orange (high activity)
          'rgba(255, 50, 0, 0.9)', // Red-orange (very high activity)
          'rgba(255, 0, 0, 1.0)' // Full red (maximum activity)
        ],
        maxIntensity: options.maxIntensity || undefined, // Let Google Maps calculate based on data density
        dissipating: true // Enable natural heat dissipation
      });

      setHeatmapLayer(heatmap);

      // Cleanup function
      return () => {
        if (heatmap) {
          heatmap.setMap(null);
        }
      };
    } catch (error) {
      console.error('Error creating heat map layer:', error);
    }
  }, [map, visualization, data, options]);

  // Update heat map when data changes
  useEffect(() => {
    if (!heatmapLayer || !data) return;

    try {
      const heatmapData = data.map(point => {
        if (point.lat && point.lng) {
          return new google.maps.LatLng(point.lat, point.lng);
        }
        return null;
      }).filter(point => point !== null);

      heatmapLayer.setData(heatmapData);
    } catch (error) {
      console.warn('Error updating heat map data:', error);
    }
  }, [heatmapLayer, data]);

  return null; // This component doesn't render anything visible
}

export default GoogleHeatMapLayer;
