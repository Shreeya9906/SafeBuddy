import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useAuth } from "@/lib/auth-context";
import { sosAPI } from "@/lib/api";
import { getCurrentLocation, watchLocation, clearLocationWatch } from "@/lib/geolocation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, AlertCircle, Loader2 } from "lucide-react";
import type { SOSAlert } from "@shared/schema";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface LocationState {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, 15);
  }, [center, map]);
  return null;
}

export default function MapPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location, setLocation] = useState<LocationState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTracking, setIsTracking] = useState(false);
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    loadInitialLocation();
    checkActiveAlert();
    
    return () => {
      if (watchIdRef.current !== null) {
        clearLocationWatch(watchIdRef.current);
      }
    };
  }, []);

  const loadInitialLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
    } catch (error: any) {
      toast({
        title: "Location Error",
        description: "Could not get your location. Please enable location services.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkActiveAlert = async () => {
    try {
      const alert = await sosAPI.getActive();
      setActiveAlert(alert);
      if (alert && alert.status === "active") {
        startTracking(alert.id);
      }
    } catch (error) {
      console.error("Error checking active alert:", error);
    }
  };

  const startTracking = (sosId: string) => {
    if (watchIdRef.current !== null) return;

    setIsTracking(true);
    watchIdRef.current = watchLocation(async (loc) => {
      setLocation(loc);
      
      try {
        await sosAPI.addLocation(sosId, {
          latitude: loc.latitude,
          longitude: loc.longitude,
          accuracy: loc.accuracy,
        });
      } catch (error) {
        console.error("Error updating location:", error);
      }
    });
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      clearLocationWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const refreshLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setLocation(loc);
      toast({
        title: "Location Updated",
        description: `Accuracy: ${loc.accuracy?.toFixed(0)}m`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Location Not Available</CardTitle>
            <CardDescription>Please enable location services to use the map.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={loadInitialLocation}>
              <Navigation className="mr-2 w-4 h-4" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 bg-card border-b space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Live Map</h2>
            <p className="text-sm text-muted-foreground">
              Current location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </p>
          </div>
          {activeAlert && activeAlert.status === "active" && (
            <Badge variant="destructive" className="animate-pulse">
              <AlertCircle className="w-3 h-3 mr-1" />
              SOS ACTIVE
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshLocation} data-testid="button-refresh-location">
            <Navigation className="mr-2 w-4 h-4" />
            Refresh Location
          </Button>
          {isTracking ? (
            <Button variant="outline" size="sm" onClick={stopTracking}>
              Stop Tracking
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => activeAlert && startTracking(activeAlert.id)}>
              Start Tracking
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        <MapContainer
          center={[location.latitude, location.longitude]}
          zoom={15}
          className="h-full w-full"
          data-testid="map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapUpdater center={[location.latitude, location.longitude]} />
          <Marker position={[location.latitude, location.longitude]}>
            <Popup>
              <div className="text-sm">
                <strong>{user?.name}</strong>
                <br />
                Your current location
                <br />
                Accuracy: {location.accuracy?.toFixed(0)}m
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}
