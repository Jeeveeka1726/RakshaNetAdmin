import { useEffect } from 'react';
import { useMap } from '@vis.gl/react-google-maps';

function MapController({ center, zoom, onZoomChange, onCenterChange }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    try {
      // Set up zoom change listener
      const zoomListener = map.addListener('zoom_changed', () => {
        const newZoom = map.getZoom();
        if (onZoomChange && newZoom !== undefined) {
          onZoomChange(newZoom);
        }
      });

      // Set up center change listener
      const centerListener = map.addListener('center_changed', () => {
        const newCenter = map.getCenter();
        if (onCenterChange && newCenter) {
          onCenterChange({
            lat: newCenter.lat(),
            lng: newCenter.lng()
          });
        }
      });

      // Cleanup listeners
      return () => {
        try {
          if (zoomListener) {
            google.maps.event.removeListener(zoomListener);
          }
          if (centerListener) {
            google.maps.event.removeListener(centerListener);
          }
        } catch (error) {
          console.warn('Error removing map listeners:', error);
        }
      };
    } catch (error) {
      console.warn('Error setting up map listeners:', error);
    }
  }, [map, onZoomChange, onCenterChange]);

  // Update map when props change
  useEffect(() => {
    if (!map || !center) return;

    try {
      const currentCenter = map.getCenter();
      if (!currentCenter ||
          Math.abs(currentCenter.lat() - center.lat) > 0.001 ||
          Math.abs(currentCenter.lng() - center.lng) > 0.001) {
        map.setCenter(center);
      }
    } catch (error) {
      console.warn('Error updating map center:', error);
    }
  }, [map, center]);

  useEffect(() => {
    if (!map || zoom === undefined) return;

    try {
      const currentZoom = map.getZoom();
      if (currentZoom !== zoom) {
        map.setZoom(zoom);
      }
    } catch (error) {
      console.warn('Error updating map zoom:', error);
    }
  }, [map, zoom]);

  return null; // This component doesn't render anything
}

export default MapController;
