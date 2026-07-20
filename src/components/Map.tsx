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

interface OsrmRouteResponse {
  code?: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry?: { coordinates?: Array<[number, number]> };
    legs?: Array<{
      steps?: Array<{
        name?: string;
        distance?: number;
        maneuver?: { type?: string; modifier?: string };
      }>;
    }>;
  }>;
}

interface RoutePanelState {
  hospital: HospitalMapItem | null;
  routeOrigin: Coordinate | null;
  loading: boolean;
  error: string | null;
  roadDistanceKm: number | null;
  roadDurationMinutes: number | null;
  directions: string[];
  routeCoordinates: Array<[number, number]>;
}

const defaultRoutePanel: RoutePanelState = {
  hospital: null,
  routeOrigin: null,
  loading: false,
  error: null,
  roadDistanceKm: null,
  roadDurationMinutes: null,
  directions: [],
  routeCoordinates: [],
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

function directionLabel(step: {
  name?: string;
  maneuver?: { type?: string; modifier?: string };
}): string {
  const road = step.name ? ` on ${step.name}` : "";
  const modifier = step.maneuver?.modifier
    ? ` ${step.maneuver.modifier.split("_").join(" ")}`
    : "";
  const action = step.maneuver?.type?.split("_").join(" ") ?? "continue";
  return `${action}${modifier}${road}`.replace(/^./, (letter) =>
    letter.toUpperCase(),
  );
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
    const routeLayerRef = useRef<L.LayerGroup | null>(null);
    const isochroneLayerRef = useRef<L.LayerGroup | null>(null);
    const searchRadiusLayerRef = useRef<L.LayerGroup | null>(null);
    const tileLayerRef = useRef<L.TileLayer | null>(null);
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

    const loadRoute = useCallback(async (hospital: HospitalMapItem) => {
      const origin = userLocationRef.current;
      const map = mapRef.current;
      const layer = routeLayerRef.current;
      setRoutePanel({
        ...defaultRoutePanel,
        hospital,
        routeOrigin: origin,
        loading: true,
      });

      if (!origin || !map || !layer) {
        setRoutePanel((current) => ({
          ...current,
          loading: false,
          error: "Share or select a start location first.",
        }));
        return;
      }

      try {
        const coordinates = `${origin.lng},${origin.lat};${hospital.lng},${hospital.lat}`;
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=true`,
        );
        if (!response.ok) throw new Error("route request failed");

        const payload = (await response.json()) as OsrmRouteResponse;
        const route = payload.routes?.[0];
        const routeCoordinates = route?.geometry?.coordinates;
        if (payload.code !== "Ok" || !route || !routeCoordinates?.length) {
          throw new Error("no route returned");
        }

        const directions = (route.legs?.[0]?.steps ?? [])
          .filter((step) => (step.distance ?? 0) > 20)
          .slice(0, 10)
          .map(directionLabel);
        setRoutePanel({
          hospital,
          routeOrigin: origin,
          loading: false,
          error: null,
          roadDistanceKm: route.distance / 1000,
          roadDurationMinutes: Math.max(1, Math.ceil(route.duration / 60)),
          directions,
          routeCoordinates,
        });
      } catch {
        setRoutePanel((current) => ({
          ...current,
          loading: false,
          error:
            "The public route service is unavailable. You can still open this hospital in your navigation app.",
        }));
      }
    }, [setRoutePanel]);

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
      routeLayerRef.current = L.layerGroup().addTo(map);
      isochroneLayerRef.current = L.layerGroup().addTo(map);
      searchRadiusLayerRef.current = L.layerGroup().addTo(map);
      setMapReady(true);

      return () => {
        map.remove();
        mapRef.current = null;
        tileLayerRef.current = null;
      };
    }, []);

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
        marker.on("click", () => void loadRoute(hospital));
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

      routeLayerRef.current?.clearLayers();
      setRoutePanel(defaultRoutePanel);
    }, [
      hospitals,
      routePanel.hospital,
      routePanel.routeOrigin,
      setRoutePanel,
      userLocation,
    ]);

    useEffect(() => {
      const map = mapRef.current;
      const layer = routeLayerRef.current;
      if (!mapReady || !map || !layer) return;

      layer.clearLayers();
      if (!routePanel.routeCoordinates.length) return;
      const path = L.polyline(
        routePanel.routeCoordinates.map(
          ([lng, lat]) => [lat, lng] as [number, number],
        ),
        { color: "#dc2626", weight: 6, opacity: 0.88 },
      ).addTo(layer);
      map.fitBounds(path.getBounds(), { padding: [32, 32] });
    }, [mapReady, routePanel.routeCoordinates]);

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
          if (hospital) void loadRoute(hospital);
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
          <Card className="p-5 overflow-y-auto">
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
                onClick={() => {
                  routeLayerRef.current?.clearLayers();
                  setRoutePanel(defaultRoutePanel);
                }}
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
                      Includes approximately {routePanel.hospital.trafficDelayMinutes} min of live delay.
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
                    <p className="text-xs text-muted-foreground">No-traffic path ETA</p>
                  </div>
                </div>
              )}

              {routePanel.directions.length > 0 && (
                <div>
                  <h4 className="mb-2 text-sm font-semibold">Route preview</h4>
                  <ol className="max-h-40 space-y-2 overflow-y-auto text-xs text-muted-foreground">
                    {routePanel.directions.map((direction, index) => (
                      <li key={`${direction}-${index}`} className="flex gap-2">
                        <span className="font-medium text-foreground">{index + 1}.</span>
                        {direction}
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
                QuickER is decision support, not an emergency service. Call local emergency services when needed.
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
