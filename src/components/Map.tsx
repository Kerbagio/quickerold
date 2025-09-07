import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navigation, Clock, MapPin, X } from "lucide-react";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-routing-machine';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteOption {
  name: string;
  distance: number;
  baseTime: number;
  traffic: string;
  trafficDelay: number;
  color: string;
  description: string;
  icon: string;
}

interface MapProps {
  className?: string;
  showUserLocation?: boolean;
  showIsochrones?: boolean;
  hospitals?: Array<{
    id: string;
    name: string;
    lat: number;
    lng: number;
    eta?: string;
    distance?: string;
  }>;
  onLocationSelect?: (lat: number, lng: number) => void;
}

export interface MapRef {
  showRoutes: (hospitalLat: number, hospitalLng: number, hospitalName: string) => void;
}

const Map = forwardRef<MapRef, MapProps>(({ className, showUserLocation = true, showIsochrones = false, hospitals = [], onLocationSelect }, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const routesSidebar = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [routingControl, setRoutingControl] = useState<any>(null);
  const [currentRoutes, setCurrentRoutes] = useState<RouteOption[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<string>('');
  const [showRoutes, setShowRoutes] = useState(false);
  const [directions, setDirections] = useState<{text: string; distance: number}[]>([]);
  const [routeInfo, setRouteInfo] = useState<{
    totalDistance: number;
    totalTime: number;
  } | null>(null);
  const [isochroneLayers, setIsochroneLayers] = useState<L.Layer[]>([]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const generateRouteOptions = (hospitalLat: number, hospitalLng: number): RouteOption[] => {
    if (!userLocation) return [];
    
    const baseDistance = calculateDistance(userLocation.lat, userLocation.lng, hospitalLat, hospitalLng);
    
    return [
      {
        name: "Fastest Route",
        distance: baseDistance,
        baseTime: Math.round(baseDistance * 2.5),
        traffic: "Light",
        trafficDelay: 2,
        color: "hsl(var(--success))",
        description: "Direct route with minimal traffic",
        icon: "🚗"
      },
      {
        name: "Scenic Route", 
        distance: baseDistance * 1.3,
        baseTime: Math.round(baseDistance * 1.3 * 2.5),
        traffic: "Moderate",
        trafficDelay: 8,
        color: "hsl(var(--warning))",
        description: "Longer but more scenic path",
        icon: "🌳"
      },
      {
        name: "Highway Route",
        distance: baseDistance * 1.1,
        baseTime: Math.round(baseDistance * 1.1 * 2.5),
        traffic: "Heavy", 
        trafficDelay: 15,
        color: "hsl(var(--destructive))",
        description: "Fast highway but heavy traffic",
        icon: "🛣️"
      }
    ];
  };

  const createIsochroneOverlay = async (lat: number, lng: number) => {
    if (!map || !showIsochrones) return;

    // Clear existing isochrone layers
    isochroneLayers.forEach(layer => {
      map.removeLayer(layer);
    });
    setIsochroneLayers([]);

    try {
      // Create solid colored circles based on travel times
      const times = [15, 10, 5]; // minutes - reverse order so smaller circles appear on top
      const colors = ['#ef4444', '#f59e0b', '#22c55e']; // red, orange, green
      const newLayers: L.Layer[] = [];

      for (let i = 0; i < times.length; i++) {
        const time = times[i];
        const color = colors[i];
        
        // Approximate radius based on travel time (rough calculation)
        // Average urban speed: ~30km/h, so radius = (time/60) * 30 * 1000 meters
        const radiusMeters = (time / 60) * 30 * 1000;

        // Create solid colored circle
        const circle = L.circle([lat, lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.2,
          weight: 2,
          opacity: 0.6,
          radius: radiusMeters
        });

        circle.addTo(map);
        newLayers.push(circle);
      }

      setIsochroneLayers(newLayers);
    } catch (error) {
      console.error('Error creating isochrones:', error);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current) return;

    const mapInstance = L.map(mapContainer.current, {
      zoomControl: false
    }).setView([40.7128, -74.0060], 13);

    // Add beautiful tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© CartoDB',
      maxZoom: 19
    }).addTo(mapInstance);

    // Add zoom control to top right
    L.control.zoom({
      position: 'topright'
    }).addTo(mapInstance);

    setMap(mapInstance);
    return mapInstance;
  };

  const addUserLocation = (mapInstance: L.Map) => {
    if (!showUserLocation || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const location = { lat: latitude, lng: longitude };
        
        setUserLocation(location);
        
        // Create isochrone overlays if enabled
        if (showIsochrones) {
          createIsochroneOverlay(latitude, longitude);
        }
        
        // Create custom user icon
        const userIcon = L.divIcon({
          html: '<div style="background: hsl(var(--primary)); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          className: 'custom-user-marker'
        });

        L.marker([latitude, longitude], { icon: userIcon })
          .addTo(mapInstance)
          .bindPopup('Your Location');

        mapInstance.setView([latitude, longitude], 15);
        onLocationSelect?.(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
      }
    );
  };

  const addHospitalMarkers = (mapInstance: L.Map) => {
    console.log('Adding hospital markers:', hospitals.length, hospitals);
    hospitals.forEach(hospital => {
      const hospitalIcon = L.divIcon({
        html: '<div style="background: hsl(var(--destructive)); color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">🏥</div>',
        iconSize: [34, 34],
        iconAnchor: [17, 17],
        className: 'custom-hospital-marker'
      });

      const marker = L.marker([hospital.lat, hospital.lng], { icon: hospitalIcon })
        .addTo(mapInstance);

      marker.bindPopup(`
        <div style="text-align: center; padding: 8px;">
          <h3 style="margin: 0 0 8px 0; color: hsl(var(--foreground));">${hospital.name}</h3>
          ${hospital.eta ? `<p style="margin: 0 0 4px 0; color: hsl(var(--muted-foreground));">ETA: ${hospital.eta}</p>` : ''}
          ${hospital.distance ? `<p style="margin: 0 0 8px 0; color: hsl(var(--muted-foreground));">Distance: ${hospital.distance}</p>` : ''}
        </div>
      `);

      marker.on('click', () => {
        getAllRoutes(hospital.lat, hospital.lng, hospital.name);
      });
    });
  };

  const clearAllRoutes = () => {
    if (!map) return;
    
    // Remove routing control
    if (routingControl) {
      try {
        map.removeControl(routingControl);
      } catch (error) {
        console.log('Error removing routing control:', error);
      }
      setRoutingControl(null);
    }

    // Simple layer removal - only remove polylines (route paths)
    map.eachLayer((layer: any) => {
      if (layer instanceof L.Polyline) {
        // Don't remove user location or hospital markers, only route polylines
        try {
          map.removeLayer(layer);
        } catch (error) {
          console.log('Error removing polyline:', error);
        }
      }
    });
  };

  const clearAllRoutesAndHide = () => {
    clearAllRoutes();
    setShowRoutes(false);
    setCurrentRoutes([]);
    setSelectedHospital('');
    setDirections([]);
    setRouteInfo(null);
  };

  const getAllRoutes = (hospitalLat: number, hospitalLng: number, hospitalName: string) => {
    if (!userLocation) return;

    // Clear all existing routes completely
    clearAllRoutes();

    setSelectedHospital(hospitalName);
    setShowRoutes(true);

    // Generate route options
    const routes = generateRouteOptions(hospitalLat, hospitalLng);
    setCurrentRoutes(routes);

    // Show best route on map
    if (routes.length > 0) {
      showRouteOnMap(routes[0], hospitalLat, hospitalLng);
    }
  };

  const showRouteOnMap = (route: RouteOption, hospitalLat: number, hospitalLng: number) => {
    if (!map || !userLocation) return;

    console.log('Showing route for:', route.name, 'to hospital at:', hospitalLat, hospitalLng);

    // Clear all existing routes first
    clearAllRoutes();

    // Small delay to ensure clean slate
    setTimeout(() => {
      // Create new route
      const control = (L as any).Routing.control({
        waypoints: [
          L.latLng(userLocation.lat, userLocation.lng),
          L.latLng(hospitalLat, hospitalLng)
        ],
        routeWhileDragging: false,
        showAlternatives: false,
        fitSelectedRoutes: true,
        createMarker: () => null, // Don't create default markers
        lineOptions: {
          styles: [{ color: route.color, weight: 6, opacity: 0.9 }]
        },
        addWaypoints: false,
        show: false, // Hide the directions panel completely
        router: (L as any).Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1'
        }),
        // Completely disable any instruction displays on map
        instructionsContainer: null,
        summaryTemplate: '<div></div>',
        instructions: false
      }).addTo(map);
      
      // Remove any instruction containers that might appear
      setTimeout(() => {
        const containers = document.querySelectorAll('.leaflet-routing-container');
        containers.forEach(container => {
          if (container && container.parentNode) {
            container.parentNode.removeChild(container);
          }
        });
      }, 100);

      // Extract directions and route info when route is found
      control.on('routesfound', function(e: any) {
        const routes = e.routes;
        if (routes && routes[0]) {
          const route = routes[0];
          
          // Extract turn-by-turn directions
          if (route.instructions) {
            const instructions = route.instructions.map((instruction: any) => {
              return {
                text: instruction.text,
                distance: Math.round(instruction.distance || 0) // Distance in meters
              };
            });
            setDirections(instructions);
          }
          
          // Extract route summary information
          if (route.summary) {
            setRouteInfo({
              totalDistance: Math.round(route.summary.totalDistance / 1000 * 10) / 10, // Convert to km with 1 decimal
              totalTime: Math.round(route.summary.totalTime / 60) // Convert to minutes
            });
          }
        }
      });

      setRoutingControl(control);
      console.log('Route control created and added');
    }, 150);
  };

  const selectRoute = (routeIndex: number) => {
    if (currentRoutes[routeIndex] && selectedHospital) {
      const hospital = hospitals.find(h => h.name === selectedHospital);
      if (hospital) {
        showRouteOnMap(currentRoutes[routeIndex], hospital.lat, hospital.lng);
      }
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    showRoutes: getAllRoutes
  }));

  useEffect(() => {
    const mapInstance = initializeMap();
    if (mapInstance) {
      addUserLocation(mapInstance);
      addHospitalMarkers(mapInstance);
    }

    return () => {
      if (map) {
        map.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (map) {
      // Clear existing hospital markers
      map.eachLayer((layer) => {
        if (layer instanceof L.Marker && layer.options.icon?.options.className === 'custom-hospital-marker') {
          map.removeLayer(layer);
        }
      });
      addHospitalMarkers(map);
    }
  }, [hospitals]);

  // Add map click handler for location selection with isochrones
  useEffect(() => {
    if (map && showIsochrones && onLocationSelect) {
      const handleMapClick = (e: any) => {
        const { lat, lng } = e.latlng;
        onLocationSelect(lat, lng);
        createIsochroneOverlay(lat, lng);
        setUserLocation({ lat, lng });
        
        // Update user marker
        map.eachLayer((layer) => {
          if (layer instanceof L.Marker && layer.options.icon?.options.className === 'custom-user-marker') {
            map.removeLayer(layer);
          }
        });
        
        const userIcon = L.divIcon({
          html: '<div style="background: hsl(var(--primary)); width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>',
          iconSize: [22, 22],
          iconAnchor: [11, 11],
          className: 'custom-user-marker'
        });
        
        L.marker([lat, lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('Your Location');
      };
      
      map.on('click', handleMapClick);
      
      return () => {
        map.off('click', handleMapClick);
      };
    }
  }, [map, showIsochrones, onLocationSelect]);

  return (
    <div className={`flex gap-6 ${className}`}>
      {/* Map Container */}
      <div className="flex-[2] relative">
        <div ref={mapContainer} className="w-full h-full rounded-2xl shadow-md" />
      </div>
      
      {/* Routes Sidebar */}
      {showRoutes && (
        <div className="flex-1 min-w-[300px]">
          <Card className="p-6 h-full overflow-y-auto">
            <div className="mb-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Navigation className="w-5 h-5 text-primary" />
                    Route Options
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">to {selectedHospital}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllRoutesAndHide}
                  className="h-8 w-8 p-0 hover:bg-destructive/10"
                >
                  <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            </div>
            
            {/* Directions Section */}
            {directions.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-md font-semibold text-foreground flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    Turn-by-Turn Directions
                  </h4>
                </div>
                
                {/* Route Summary */}
                {routeInfo && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="font-bold text-primary">{routeInfo.totalDistance} km</div>
                      <div className="text-xs text-muted-foreground">Total Distance</div>
                    </div>
                    <div className="text-center p-3 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="font-bold text-primary">{routeInfo.totalTime} min</div>
                      <div className="text-xs text-muted-foreground">Estimated Time</div>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {directions.map((direction, index) => (
                    <div key={index} className="flex gap-3 text-sm p-3 bg-muted/50 rounded-lg border border-border">
                      <span className="text-primary font-semibold min-w-[28px] h-6 flex items-center justify-center bg-primary/10 rounded-full text-xs">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-foreground">{direction.text}</span>
                        {direction.distance > 0 && (
                          <span className="text-muted-foreground ml-2 text-xs">
                            ({direction.distance}m)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              {currentRoutes.map((route, index) => {
                const totalTime = route.baseTime + route.trafficDelay;
                const isBest = index === 0;
                
                return (
                  <div
                    key={index}
                    onClick={() => selectRoute(index)}
                    className={`p-4 rounded-xl cursor-pointer transition-all border-2 hover:shadow-md ${
                      isBest 
                        ? 'border-success bg-success/5' 
                        : 'border-border bg-card hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{route.icon}</span>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{route.name}</h4>
                        {isBest && (
                          <Badge variant="secondary" className="bg-success text-success-foreground text-xs">
                            BEST CHOICE
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-3">{route.description}</p>
                    
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <div className="font-bold text-foreground">{route.distance.toFixed(1)} km</div>
                        <div className="text-xs text-muted-foreground">Distance</div>
                      </div>
                      <div className="text-center p-2 bg-muted/50 rounded-lg">
                        <div className="font-bold text-foreground">{totalTime} min</div>
                        <div className="text-xs text-muted-foreground">Total Time</div>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Base: <strong>{route.baseTime} min</strong>
                      </span>
                      <Badge 
                        variant="outline" 
                        className={
                          route.traffic === 'Light' ? 'text-success border-success' :
                          route.traffic === 'Moderate' ? 'text-warning border-warning' :
                          'text-destructive border-destructive'
                        }
                      >
                        {route.traffic} (+{route.trafficDelay} min)
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {currentRoutes.length > 0 && (
              <div className="mt-6 pt-4 border-t border-border">
                <Button className="w-full shadow-emergency">
                  <Navigation className="w-4 h-4 mr-2" />
                  Start Navigation
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
});

export default Map;