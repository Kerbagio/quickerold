import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  Clock,
  ExternalLink,
  MapPin,
  Navigation,
  X,
} from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import { useTheme } from "next-themes";
import type { AvailabilityStatus } from "@/services/availability";
import { availabilityLabel } from "@/services/availability";
import {
  fetchRoadIsochrones,
  type IsochroneSource,
} from "@/services/isochrones";
import type { Coordinate, EtaSource } from "@/services/routing";
import { usePageMemory } from "@/hooks/usePageMemory";

interface HospitalMapItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
  eta?: string;
  etaSource?: EtaSource;
  distance?: string;
  trafficDelayMinutes?: number;
  availability?: { status: AvailabilityStatus };
}

interface MapProps {
  memoryKey: string;
  className?: string;
  showUserLocation?: boolean;
  showIsochrones?: boolean;
  hospitals?: HospitalMapItem[];
  userLocation?: Coordinate | null;
  searchRadiusKm?: number;
  onLocationSelect?: (lat: number, lng: number) => void;
  onIsochroneSourceChange?: (source: IsochroneSource) => void;
}

export interface MapRef {
  showRoutes: (
    hospitalLat: number,
    hospitalLng: number,
    hospitalName: string,
  ) => void;
}

interface RoutePanelState {
  hospital: HospitalMapItem | null;
  routeOrigin: Coordinate | null;
  loading: boolean;
  error: string | null;
  roadDistanceKm: number | null;
  roadDurationMinutes: number | null;
  directions: Array<{ text: string; distance: number }>;
}

const defaultRoutePanel: RoutePanelState = {
  hospital: null,
  routeOrigin: null,
  loading: false,
  error: null,
  roadDistanceKm: null,
  roadDurationMinutes: null,
  directions: [],
};

const sourceLabel: Record<EtaSource, string> = {
  "live-traffic": "Live traffic ETA",
  "road-network": "Road-network ETA",
  "distance-estimate": "Distance estimate",
};

const isochroneColors: Record<number, string> = {
  5: "#22c55e",
  10: "#f59e0b",
  15: "#ef4444",
};

function tileUrl(dark: boolean): string {
  return `https://{s}.basemaps.cartocdn.com/${dark ? "dark_all" : "light_all"}/{z}/{x}/{y}{r}.png`;
}

function hideRoutingMachineUi() {
  document.querySelectorAll(".leaflet-routing-container").forEach((node) => {
    node.parentNode?.removeChild(node);
  });
}

const Map = forwardRef<MapRef, MapProps>(
  (
    {
      memoryKey,
      className,
      showUserLocation = true,
      showIsochrones = false,
      hospitals = [],
      userLocation,
      searchRadiusKm,
      onLocationSelect,
      onIsochroneSourceChange,
    },
    ref,
  ) => {
    const { resolvedTheme } = useTheme();
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const userLocationRef = useRef<Coordinate | null>(null);
    const userMarkerRef = useRef<L.Marker | null>(null);
    const hospitalLayerRef = useRef<L.LayerGroup | null>(null);
    const isochroneLayerRef = useRef<L.LayerGroup | null>(null);
    const searchRadiusLayerRef = useRef<L.LayerGroup | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
    const routingControlRef = useRef<L.Routing.Control | null>(null);
    const onLocationSelectRef = useRef(onLocationSelect);
    const onIsochroneSourceChangeRef = useRef(onIsochroneSourceChange);
    const [mapReady, setMapReady] = useState(false);
    const [routePanel, setRoutePanel] = usePageMemory<RoutePanelState>(
      `${memoryKey}.routePanel`,
      defaultRoutePanel,
    );

    useEffect(() => {
      onLocationSelectRef.current = onLocationSelect;
    }, [onLocationSelect]);

    useEffect(() => {
      onIsochroneSourceChangeRef.current = onIsochroneSourceChange;
    }, [onIsochroneSourceChange]);

    const clearRoutingControl = useCallback(() => {
      const map = mapRef.current;
      const control = routingControlRef.current;
      if (map && control) {
        try {
          map.removeControl(control);
        } catch {
          // Control may already be detached during remounts.
        }
      }
      routingControlRef.current = null;
      hideRoutingMachineUi();
    }, []);

    const placeUserMarker = useCallback(
      (location: Coordinate, recenter = true) => {
        const map = mapRef.current;
        if (!map) return;

        userLocationRef.current = location;
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([location.lat, location.lng]);
        } else {
          const icon = L.divIcon({
            html: '<div style="background:#2563eb;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.35)"></div>',
            iconSize: [22, 22],
            iconAnchor: [11, 11],
            className: "custom-user-marker",
          });
          userMarkerRef.current = L.marker([location.lat, location.lng], {
            icon,
          })
            .addTo(map)
            .bindPopup("Selected start location");
        }

        if (recenter) map.setView([location.lat, location.lng], 14);
      },
      [],
    );

    const renderIsochrones = useCallback(async (location: Coordinate) => {
      const map = mapRef.current;
      const layer = isochroneLayerRef.current;
      if (!map || !layer) return;
      layer.clearLayers();

      const roadIsochrones = await fetchRoadIsochrones(location);
      if (roadIsochrones?.length) {
        [...roadIsochrones]
          .sort((first, second) => second.minutes - first.minutes)
          .forEach((feature) => {
            const outerRing = feature.coordinates[0] ?? [];
            const points = outerRing.map(
              ([lng, lat]) => [lat, lng] as [number, number],
            );
            L.polygon(points, {
              color: isochroneColors[feature.minutes] ?? "#2563eb",
              fillColor: isochroneColors[feature.minutes] ?? "#2563eb",
              fillOpacity: 0.16,
              opacity: 0.7,
              weight: 2,
            }).addTo(layer);
          });
        onIsochroneSourceChangeRef.current?.("road-network");
        return;
      }

      [15, 10, 5].forEach((minutes) => {
        L.circle([location.lat, location.lng], {
          color: isochroneColors[minutes],
          fillColor: isochroneColors[minutes],
          fillOpacity: 0.14,
          opacity: 0.65,
          weight: 2,
          radius: (minutes / 60) * 30 * 1000,
        }).addTo(layer);
      });
      onIsochroneSourceChangeRef.current?.("distance-estimate");
    }, []);

    const loadRoute = useCallback(
      (hospital: HospitalMapItem) => {
        const origin = userLocationRef.current;
        const map = mapRef.current;

        clearRoutingControl();
        setRoutePanel({
          ...defaultRoutePanel,
          hospital,
          routeOrigin: origin,
          loading: true,
        });

        if (!origin || !map) {
          setRoutePanel((current) => ({
            ...current,
            loading: false,
            error: "Share or select a start location first.",
          }));
          return;
        }

        const waypoints = [
          L.latLng(origin.lat, origin.lng),
          L.latLng(hospital.lat, hospital.lng),
        ];

        const control = L.Routing.control({
          waypoints,
          plan: L.Routing.plan(waypoints, {
            createMarker: () => false,
            addWaypoints: false,
            draggableWaypoints: false,
          }),
          routeWhileDragging: false,
          showAlternatives: false,
          fitSelectedRoutes: true,
          addWaypoints: false,
          show: false,
          lineOptions: {
            styles: [{ color: "#dc2626", weight: 6, opacity: 0.9 }],
            extendToWaypoints: true,
            missingRouteTolerance: 10,
          },
          router: L.Routing.osrmv1({
            serviceUrl: "https://router.project-osrm.org/route/v1",
          }),
        }).addTo(map);

        routingControlRef.current = control;
        window.setTimeout(hideRoutingMachineUi, 100);

        control.on("routesfound", (event: L.Routing.RoutingResultEvent) => {
          const route = event.routes?.[0];
          if (!route) {
            setRoutePanel((current) => ({
              ...current,
              loading: false,
              error:
                "The public route service is unavailable. You can still open this hospital in your navigation app.",
            }));
            return;
          }

          const directions = (route.instructions ?? [])
            .filter((step) => (step.distance ?? 0) > 20)
            .slice(0, 10)
            .map((step) => ({
              text: step.text,
              distance: Math.round(step.distance ?? 0),
            }));

          setRoutePanel({
            hospital,
            routeOrigin: origin,
            loading: false,
            error: null,
            roadDistanceKm:
              Math.round(((route.summary?.totalDistance ?? 0) / 1000) * 10) / 10,
            roadDurationMinutes: Math.max(
              1,
              Math.round((route.summary?.totalTime ?? 0) / 60),
            ),
            directions,
          });
          hideRoutingMachineUi();
        });

        control.on("routingerror", () => {
          setRoutePanel((current) => ({
            ...current,
            loading: false,
            error:
              "The public route service is unavailable. You can still open this hospital in your navigation app.",
          }));
          hideRoutingMachineUi();
        });
      },
      [clearRoutingControl, setRoutePanel],
    );

    useEffect(() => {
      if (!mapContainerRef.current || mapRef.current) return;

      const map = L.map(mapContainerRef.current, { zoomControl: false }).setView(
        [33.8938, 35.5018],
        12,
      );
      const startsDark = document.documentElement.classList.contains("dark");
      tileLayerRef.current = L.tileLayer(tileUrl(startsDark), {
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
        maxZoom: 19,
      }).addTo(map);
      L.control.zoom({ position: "topright" }).addTo(map);

      mapRef.current = map;
      hospitalLayerRef.current = L.layerGroup().addTo(map);
      isochroneLayerRef.current = L.layerGroup().addTo(map);
      searchRadiusLayerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);

      return () => {
        clearRoutingControl();
        map.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
        userMarkerRef.current = null;
      };
    }, [clearRoutingControl]);

    useEffect(() => {
      if (!resolvedTheme || !tileLayerRef.current) return;
      tileLayerRef.current.setUrl(tileUrl(resolvedTheme === "dark"));
    }, [mapReady, resolvedTheme]);

    useEffect(() => {
      if (!mapReady || !userLocation || !showUserLocation) return;
      placeUserMarker(userLocation);
      if (showIsochrones) void renderIsochrones(userLocation);
    }, [
      mapReady,
      placeUserMarker,
      renderIsochrones,
      showIsochrones,
      showUserLocation,
      userLocation,
    ]);

    // Restore a remembered route drawing once the Leaflet map is ready.
    useEffect(() => {
      if (!mapReady || !routePanel.hospital || routingControlRef.current) return;
      loadRoute(routePanel.hospital);
      // Intentionally run only when the map first becomes ready.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mapReady]);

    useEffect(() => {
      const layer = searchRadiusLayerRef.current;
      if (!mapReady || !layer) return;
      layer.clearLayers();
      if (!userLocation || !searchRadiusKm) return;

      const boundary = L.circle([userLocation.lat, userLocation.lng], {
        color: "#2563eb",
        fill: false,
        opacity: 0.9,
        weight: 2,
        dashArray: "7 7",
        radius: searchRadiusKm * 1000,
      })
        .bindTooltip(`${searchRadiusKm} km hospital search boundary`)
        .addTo(layer);
      mapRef.current?.fitBounds(boundary.getBounds(), {
        padding: [24, 24],
        maxZoom: 14,
      });
    }, [mapReady, searchRadiusKm, userLocation]);

    useEffect(() => {
      const layer = hospitalLayerRef.current;
      if (!mapReady || !layer) return;
      layer.clearLayers();

      hospitals.forEach((hospital) => {
        const icon = L.divIcon({
          html: '<div style="background:#dc2626;color:white;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)">H</div>',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
          className: "custom-hospital-marker",
        });
        const marker = L.marker([hospital.lat, hospital.lng], { icon }).addTo(
          layer,
        );
        const popup = document.createElement("div");
        const title = document.createElement("strong");
        title.textContent = hospital.name;
        const details = document.createElement("p");
        details.style.margin = "6px 0 0";
        details.textContent = [hospital.eta, hospital.distance]
          .filter(Boolean)
          .join(" • ");
        popup.append(title, details);
        marker.bindPopup(popup);
        marker.on("click", () => loadRoute(hospital));
      });
    }, [hospitals, loadRoute, mapReady]);

    useEffect(() => {
      if (!routePanel.hospital) return;
      const hospitalStillListed = hospitals.some(
        (hospital) => hospital.id === routePanel.hospital?.id,
      );
      const originStillCurrent =
        !routePanel.routeOrigin ||
        (userLocation?.lat === routePanel.routeOrigin.lat &&
          userLocation?.lng === routePanel.routeOrigin.lng);
      if (hospitalStillListed && originStillCurrent) return;

      clearRoutingControl();
      setRoutePanel(defaultRoutePanel);
    }, [
      clearRoutingControl,
      hospitals,
      routePanel.hospital,
      routePanel.routeOrigin,
      setRoutePanel,
      userLocation,
    ]);

    useEffect(() => {
      const map = mapRef.current;
      if (!mapReady || !map || !showIsochrones) return;

      const handleClick = (event: L.LeafletMouseEvent) => {
        const location = { lat: event.latlng.lat, lng: event.latlng.lng };
        placeUserMarker(location, false);
        onLocationSelectRef.current?.(location.lat, location.lng);
        void renderIsochrones(location);
      };
      map.on("click", handleClick);
      return () => {
        map.off("click", handleClick);
      };
    }, [mapReady, placeUserMarker, renderIsochrones, showIsochrones]);

    useImperativeHandle(
      ref,
      () => ({
        showRoutes: (hospitalLat, hospitalLng, hospitalName) => {
          const hospital = hospitals.find(
            (candidate) =>
              candidate.name === hospitalName &&
              candidate.lat === hospitalLat &&
              candidate.lng === hospitalLng,
          );
          if (hospital) loadRoute(hospital);
        },
      }),
      [hospitals, loadRoute],
    );

    const openNavigation = () => {
      const hospital = routePanel.hospital;
      if (!hospital) return;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}&travelmode=driving`;
      window.open(url, "_blank", "noopener,noreferrer");
    };

    const closeRoutePanel = () => {
      clearRoutingControl();
      setRoutePanel(defaultRoutePanel);
    };

    return (
      <div
        className={`grid gap-4 ${
          routePanel.hospital ? "lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]" : ""
        }`}
      >
        <div className={`relative min-h-64 ${className ?? "h-80"}`}>
          <div ref={mapContainerRef} className="h-full w-full rounded-2xl shadow-md" />
        </div>

        {routePanel.hospital && (
          <Card className="overflow-y-auto p-5">
            <div className="flex items-start justify-between gap-3 border-b pb-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Route to
                </p>
                <h3 className="font-semibold">{routePanel.hospital.name}</h3>
              </div>
              <Button
                aria-label="Close route"
                size="icon"
                variant="ghost"
                onClick={closeRoutePanel}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 pt-4">
              {routePanel.hospital.eta && (
                <div className="rounded-xl bg-primary/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm text-muted-foreground">Ranked ETA</span>
                    <strong className="text-2xl text-primary">
                      {routePanel.hospital.eta}
                    </strong>
                  </div>
                  {routePanel.hospital.etaSource && (
                    <Badge className="mt-2" variant="outline">
                      {sourceLabel[routePanel.hospital.etaSource]}
                    </Badge>
                  )}
                  {(routePanel.hospital.trafficDelayMinutes ?? 0) > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Includes approximately {routePanel.hospital.trafficDelayMinutes}{" "}
                      min of live delay.
                    </p>
                  )}
                </div>
              )}

              {routePanel.hospital.availability && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4" />
                  {availabilityLabel(routePanel.hospital.availability.status)}
                </div>
              )}

              {routePanel.loading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 animate-spin" /> Loading road path…
                </div>
              )}

              {routePanel.error && (
                <div className="flex gap-2 rounded-xl bg-warning/10 p-3 text-sm">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                  <span>{routePanel.error}</span>
                </div>
              )}

              {routePanel.roadDistanceKm != null && (
                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="rounded-xl bg-muted/50 p-3">
                    <strong>{routePanel.roadDistanceKm.toFixed(1)} km</strong>
                    <p className="text-xs text-muted-foreground">Road distance</p>
                  </div>
                  <div className="rounded-xl bg-muted/50 p-3">
                    <strong>{routePanel.roadDurationMinutes} min</strong>
                    <p className="text-xs text-muted-foreground">
                      No-traffic path ETA
                    </p>
                  </div>
                </div>
              )}

              {routePanel.directions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Route preview</h4>
                  <ol className="max-h-40 space-y-2 overflow-y-auto text-xs text-muted-foreground">
                    {routePanel.directions.map((direction, index) => (
                      <li
                        key={`${direction.text}-${index}`}
                        className="flex gap-2"
                      >
                        <span className="font-medium text-foreground">
                          {index + 1}.
                        </span>
                        <span>
                          {direction.text}
                          {direction.distance > 0
                            ? ` (${direction.distance}m)`
                            : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <Button className="w-full" onClick={openNavigation}>
                <Navigation className="mr-2 h-4 w-4" />
                Open navigation
                <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
              <p className="text-xs text-muted-foreground">
                QuickER is decision support, not an emergency service. Call local
                emergency services when needed.
              </p>
            </div>
          </Card>
        )}
      </div>
    );
  },
);

Map.displayName = "Map";

export default Map;
