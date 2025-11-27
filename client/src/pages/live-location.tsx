import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Navigation, Copy, Share2, Loader2, Zap } from "lucide-react";
import { getCurrentLocation } from "@/lib/geolocation";

interface LiveLocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: Date;
  speed?: number;
  heading?: number;
}

export default function LiveLocationPage() {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<LiveLocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locations, setLocations] = useState<LiveLocationData[]>([]);

  const startTracking = async () => {
    setIsLoading(true);
    try {
      // Get initial location
      const initialLocation = await getCurrentLocation();
      const locationData: LiveLocationData = {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        accuracy: initialLocation.accuracy || 0,
        timestamp: new Date(),
      };
      
      setLocation(locationData);
      setLocations([locationData]);
      setIsTracking(true);

      // Watch position for continuous updates
      if ("geolocation" in navigator) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newLocation: LiveLocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date(),
              speed: position.coords.speed || undefined,
              heading: position.coords.heading || undefined,
            };
            
            setLocation(newLocation);
            setLocations(prev => [...prev, newLocation]);
            
            console.log("📍 Location updated:", newLocation);
          },
          (error) => {
            console.error("Geolocation error:", error);
            toast({
              title: "Location Error",
              description: error.message,
              variant: "destructive",
            });
          },
          {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000,
          }
        );
        
        setWatchId(id);
      }

      toast({
        title: "✅ Live Tracking Started",
        description: "Real-time location tracking is now active",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    setIsTracking(false);
    setWatchId(null);
    toast({
      title: "⏹️ Tracking Stopped",
      description: "Location tracking has been stopped",
    });
  };

  const copyLocationLink = () => {
    if (location) {
      const link = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      navigator.clipboard.writeText(link);
      toast({
        title: "✅ Copied",
        description: "Location link copied to clipboard",
      });
    }
  };

  const shareLocation = () => {
    if (location) {
      const link = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      if (navigator.share) {
        navigator.share({
          title: "My Current Location",
          text: `I'm currently at: ${location.latitude}, ${location.longitude}`,
          url: link,
        });
      } else {
        copyLocationLink();
      }
    }
  };

  const sendLocationViaSMS = () => {
    if (location) {
      const link = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
      const message = `📍 Live Location: ${link}`;
      window.open(`sms:?body=${encodeURIComponent(message)}`);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Navigation className="w-8 h-8 animate-pulse" />
          Live Location Tracker
        </h2>
        <p className="text-muted-foreground">
          Real-time GPS tracking with continuous location updates every 5 seconds
        </p>
      </div>

      {/* Main Status Card */}
      <Card className={isTracking ? "border-2 border-green-500" : ""}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tracking Status</CardTitle>
              <CardDescription>Real-time location monitoring</CardDescription>
            </div>
            <Badge variant={isTracking ? "default" : "secondary"} className="text-lg py-2 px-4">
              {isTracking ? "🟢 LIVE" : "⚫ IDLE"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {location ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Latitude</p>
                  <p className="text-lg font-mono font-bold">{location.latitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Longitude</p>
                  <p className="text-lg font-mono font-bold">{location.longitude.toFixed(6)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                  <p className="text-lg font-mono font-bold">±{location.accuracy.toFixed(0)}m</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Updated</p>
                  <p className="text-lg font-mono font-bold">{location.timestamp.toLocaleTimeString()}</p>
                </div>
              </div>

              {location.speed !== undefined && location.speed !== null && (
                <div>
                  <p className="text-sm text-muted-foreground">Speed</p>
                  <p className="text-lg font-mono font-bold">{(location.speed * 3.6).toFixed(1)} km/h</p>
                </div>
              )}

              <a
                href={`https://maps.google.com/?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button className="w-full" variant="outline" data-testid="button-open-map">
                  <MapPin className="mr-2 w-4 h-4" />
                  View on Google Maps
                </Button>
              </a>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Click "Start Tracking" to begin location monitoring
            </p>
          )}
        </CardContent>
      </Card>

      {/* Control Buttons */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={isTracking ? stopTracking : startTracking}
          disabled={isLoading}
          size="lg"
          className={isTracking ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
          data-testid={isTracking ? "button-stop-tracking" : "button-start-tracking"}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 w-4 h-4 animate-spin" />
              Loading...
            </>
          ) : isTracking ? (
            <>⏹️ Stop Tracking</>
          ) : (
            <>▶️ Start Tracking</>
          )}
        </Button>

        <Button
          onClick={copyLocationLink}
          disabled={!location}
          variant="outline"
          size="lg"
          data-testid="button-copy-location"
        >
          <Copy className="mr-2 w-4 h-4" />
          Copy Link
        </Button>
      </div>

      {/* Share Options */}
      {location && (
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={shareLocation}
            variant="outline"
            size="lg"
            data-testid="button-share-location"
          >
            <Share2 className="mr-2 w-4 h-4" />
            Share Location
          </Button>

          <Button
            onClick={sendLocationViaSMS}
            variant="outline"
            size="lg"
            data-testid="button-send-sms"
          >
            📱 Send via SMS
          </Button>
        </div>
      )}

      {/* Location History */}
      {locations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Location History</CardTitle>
            <CardDescription>{locations.length} update(s) received</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {locations
                .slice()
                .reverse()
                .slice(0, 10)
                .map((loc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 border rounded text-sm"
                    data-testid={`location-history-${idx}`}
                  >
                    <div>
                      <p className="font-mono">
                        {loc.latitude.toFixed(4)}, {loc.longitude.toFixed(4)}
                      </p>
                      <p className="text-xs text-muted-foreground">{loc.timestamp.toLocaleTimeString()}</p>
                    </div>
                    <Badge variant="secondary">±{loc.accuracy.toFixed(0)}m</Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-bold">✅ Real-time GPS Tracking</p>
            <p className="text-muted-foreground">Updates your location every few seconds using GPS</p>
          </div>
          <div>
            <p className="font-bold">✅ Instant Sharing</p>
            <p className="text-muted-foreground">Share your location via link, SMS, or direct messaging</p>
          </div>
          <div>
            <p className="font-bold">✅ Location History</p>
            <p className="text-muted-foreground">See all location updates in real-time</p>
          </div>
          <div>
            <p className="font-bold">✅ High Accuracy</p>
            <p className="text-muted-foreground">Get precise location with accuracy radius</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
