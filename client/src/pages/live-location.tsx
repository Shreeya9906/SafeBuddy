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
  source?: string;
}

interface ManualLocationInput {
  latitude: string;
  longitude: string;
}

export default function LiveLocationPage() {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState<LiveLocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [watchId, setWatchId] = useState<number | null>(null);
  const [locations, setLocations] = useState<LiveLocationData[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualInput, setManualInput] = useState<ManualLocationInput>({ latitude: "", longitude: "" });

  const startTracking = async () => {
    setIsLoading(true);
    try {
      console.log("🚀 Starting GPS tracking from your phone...");
      
      // Get initial location
      const initialLocation = await getCurrentLocation();
      const locationData: LiveLocationData = {
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
        accuracy: initialLocation.accuracy || 0,
        timestamp: new Date(),
        source: "gps",
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
              source: "gps",
            };
            
            setLocation(newLocation);
            setLocations(prev => [...prev, newLocation]);
            
            console.log("📍 GPS location updated:", {
              lat: newLocation.latitude,
              lon: newLocation.longitude,
              accuracy: `±${newLocation.accuracy.toFixed(0)}m`
            });
          },
          (error) => {
            console.error("❌ GPS error:", error);
            let errorMsg = error.message;
            if (error.code === 1) {
              errorMsg = "GPS permission denied. Please enable location in your phone settings.";
            } else if (error.code === 2) {
              errorMsg = "GPS is not available. Enable Location Services on your phone.";
            }
            toast({
              title: "GPS Error",
              description: errorMsg,
              variant: "destructive",
            });
          },
          {
            enableHighAccuracy: true,  // Request actual GPS, not IP-based
            maximumAge: 0,             // Get fresh location every time
            timeout: 10000,
          }
        );
        
        setWatchId(id);
      }

      toast({
        title: "✅ GPS Tracking Started",
        description: "Using your phone's GPS for accurate location",
      });
    } catch (error: any) {
      console.error("❌ Tracking error:", error);
      toast({
        title: "GPS Error",
        description: error.message || "Could not access GPS. Please check your phone's location settings.",
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

  const setManualLocation = () => {
    try {
      const lat = parseFloat(manualInput.latitude);
      const lon = parseFloat(manualInput.longitude);

      if (isNaN(lat) || isNaN(lon)) {
        toast({
          title: "Invalid Input",
          description: "Please enter valid latitude and longitude numbers",
          variant: "destructive",
        });
        return;
      }

      const manualLocation: LiveLocationData = {
        latitude: lat,
        longitude: lon,
        accuracy: 10,
        timestamp: new Date(),
        source: "manual",
      };

      setLocation(manualLocation);
      setLocations([manualLocation]);
      setShowManualInput(false);
      setManualInput({ latitude: "", longitude: "" });

      toast({
        title: "✅ Location Set",
        description: `Location set to ${lat}, ${lon}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
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

      {/* Manual Location Input */}
      {showManualInput && (
        <Card>
          <CardHeader>
            <CardTitle>Set Manual Location (For Testing)</CardTitle>
            <CardDescription>Enter exact latitude and longitude</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Latitude</label>
                <input
                  type="text"
                  placeholder="e.g., 13.0827"
                  value={manualInput.latitude}
                  onChange={(e) => setManualInput({ ...manualInput, latitude: e.target.value })}
                  className="w-full px-3 py-2 border rounded mt-1"
                  data-testid="input-latitude"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Longitude</label>
                <input
                  type="text"
                  placeholder="e.g., 80.2707"
                  value={manualInput.longitude}
                  onChange={(e) => setManualInput({ ...manualInput, longitude: e.target.value })}
                  className="w-full px-3 py-2 border rounded mt-1"
                  data-testid="input-longitude"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={setManualLocation} className="bg-blue-600 hover:bg-blue-700" data-testid="button-set-location">
                ✓ Set Location
              </Button>
              <Button onClick={() => setShowManualInput(false)} variant="outline" data-testid="button-cancel-manual">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
          onClick={() => setShowManualInput(!showManualInput)}
          variant="outline"
          size="lg"
          data-testid="button-manual-location"
        >
          ✏️ Manual Location
        </Button>
      </div>

      {/* Copy and Share Buttons */}
      <div className="grid grid-cols-2 gap-4">
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

        <Button
          onClick={shareLocation}
          disabled={!location}
          variant="outline"
          size="lg"
          data-testid="button-share-location"
        >
          <Share2 className="mr-2 w-4 h-4" />
          Share Location
        </Button>
      </div>

      {/* SMS Option */}
      {location && (
        <Button
          onClick={sendLocationViaSMS}
          variant="outline"
          size="lg"
          className="w-full"
          data-testid="button-send-sms"
        >
          📱 Send via SMS
        </Button>
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
