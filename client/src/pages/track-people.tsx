import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, MapPin, Phone, User, Zap, AlertTriangle } from "lucide-react";
import { weatherAPI } from "@/lib/api";
import L from "leaflet";

export default function TrackPeoplePage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [trackedPeople, setTrackedPeople] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.7041, 77.1025]); // Default: New Delhi
  const [weatherData, setWeatherData] = useState<any>(null);
  const [cycloneAlert, setCycloneAlert] = useState<any>(null);
  const { toast } = useToast();
  const liveTrackingInterval = useRef<NodeJS.Timeout | null>(null);
  const trackedPhoneRef = useRef<string>("");
  const weatherInterval = useRef<NodeJS.Timeout | null>(null);

  // Refresh location data and fetch weather
  const refreshLocation = async (phone: string) => {
    try {
      const response = await fetch(`/api/track/search?phone=${encodeURIComponent(phone)}`, {
        credentials: "include",
      });
      
      if (response.ok) {
        const person = await response.json();
        if (person.latitude && person.longitude) {
          setTrackedPeople([person]);
          setMapCenter([person.latitude, person.longitude]);
          
          // Fetch weather for the location
          try {
            const weather = await weatherAPI.getLiveWeather(person.latitude, person.longitude, person.address || "Location");
            setWeatherData(weather);
            
            // Check for cyclone in weather conditions
            if (weather?.conditions?.includes("cyclone") || weather?.conditions?.includes("storm")) {
              setCycloneAlert({
                severity: "critical",
                message: "⚠️ CYCLONE WARNING: Severe weather detected in this area!"
              });
            } else {
              setCycloneAlert(null);
            }
          } catch (error) {
            console.error("Weather fetch error:", error);
          }
        }
      }
    } catch (error) {
      console.error("Live tracking error:", error);
    }
  };

  // Start live tracking
  const startLiveTracking = () => {
    setIsLiveTracking(true);
    toast({
      title: "🔴 LIVE TRACKING ACTIVE",
      description: "Location updates every 3 seconds",
    });
    
    // Refresh immediately
    refreshLocation(trackedPhoneRef.current);
    
    // Then set interval for continuous updates
    liveTrackingInterval.current = setInterval(() => {
      refreshLocation(trackedPhoneRef.current);
    }, 3000); // Update every 3 seconds
  };

  // Stop live tracking
  const stopLiveTracking = () => {
    setIsLiveTracking(false);
    if (liveTrackingInterval.current) {
      clearInterval(liveTrackingInterval.current);
      liveTrackingInterval.current = null;
    }
    toast({
      title: "Live tracking stopped",
      description: "Showing last known location",
    });
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveTrackingInterval.current) {
        clearInterval(liveTrackingInterval.current);
      }
      if (weatherInterval.current) {
        clearInterval(weatherInterval.current);
      }
    };
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      toast({ title: "Error", description: "Please enter a phone number", variant: "destructive" });
      return;
    }

    // Stop any existing live tracking
    if (liveTrackingInterval.current) {
      clearInterval(liveTrackingInterval.current);
      liveTrackingInterval.current = null;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/track/search?phone=${encodeURIComponent(phoneNumber)}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Person not found");
      
      const person = await response.json();
      
      if (person.latitude && person.longitude) {
        trackedPhoneRef.current = phoneNumber; // Store for live tracking
        setTrackedPeople([person]);
        setMapCenter([person.latitude, person.longitude]);
        
        // Automatically start live tracking
        setIsLiveTracking(true);
        toast({
          title: "🔴 LIVE TRACKING STARTED!",
          description: `📍 ${person.name} - Location updating every 3 seconds`,
        });
        
        // Start the tracking interval
        liveTrackingInterval.current = setInterval(() => {
          refreshLocation(phoneNumber);
        }, 3000);
      } else {
        toast({
          title: "No Location",
          description: "This person hasn't shared their location yet",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Not Found",
        description: "No person found with this phone number",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Get weather emoji based on conditions
  const getWeatherEmoji = () => {
    if (!weatherData) return "🌍";
    const conditions = weatherData?.conditions?.toLowerCase() || "";
    
    if (conditions.includes("cyclone") || conditions.includes("storm")) return "🌪️";
    if (conditions.includes("rain")) return "🌧️";
    if (conditions.includes("cloud")) return "☁️";
    if (conditions.includes("clear") || conditions.includes("sunny")) return "☀️";
    if (conditions.includes("wind")) return "💨";
    if (conditions.includes("snow")) return "❄️";
    return "🌤️";
  };

  // Custom marker icons
  const personIcon = L.divIcon({
    html: '<div class="text-2xl">👤</div>',
    iconSize: [40, 40],
    className: "custom-marker",
  });
  
  // Weather overlay icon
  const weatherIcon = L.divIcon({
    html: `<div class="text-4xl drop-shadow-lg">${getWeatherEmoji()}</div>`,
    iconSize: [50, 50],
    className: "weather-marker",
  });

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">🗺️ Live Location Tracker</h1>
        <p className="text-lg text-muted-foreground">Track people in real-time on map</p>
      </div>

      {/* Cyclone/Weather Alert */}
      {cycloneAlert && (
        <Alert className="border-2 border-red-500 bg-red-50 dark:bg-red-950/50">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <AlertDescription className="text-red-700 dark:text-red-300 font-bold text-lg ml-2">
            {cycloneAlert.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Map - Always Visible and Large */}
      <Card className="overflow-hidden border-2 border-blue-300">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-3">
          <CardTitle className="flex items-center gap-2 text-white justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Live Map {isLiveTracking && <Badge className="bg-red-600 animate-pulse ml-2">🔴 LIVE</Badge>}
            </div>
            {weatherData && (
              <div className="text-2xl">
                {getWeatherEmoji()}
                <span className="text-xs ml-1">{weatherData?.temp || "N/A"}°C</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[600px] rounded-lg overflow-hidden border relative">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: "100%", width: "100%" }}
              key={`map-${mapCenter.join('-')}`}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              
              {/* Show all tracked people */}
              {trackedPeople.map((person) => (
                <div key={person.id}>
                  {/* Weather overlay */}
                  <Marker position={[person.latitude, person.longitude - 0.003]} icon={weatherIcon}>
                    <Popup>
                      <div className="p-2 min-w-[160px]">
                        <p className="font-semibold text-sm">{getWeatherEmoji()} Weather at Location</p>
                        {weatherData && (
                          <>
                            <p className="text-xs">🌡️ {weatherData.temp}°C</p>
                            <p className="text-xs">💨 Wind: {weatherData.wind || "N/A"} km/h</p>
                            <p className="text-xs">💧 Humidity: {weatherData.humidity || "N/A"}%</p>
                            <p className="text-xs">☁️ {weatherData.conditions || "No data"}</p>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>

                  {/* Person marker */}
                  <Marker position={[person.latitude, person.longitude]} icon={personIcon}>
                    <Popup>
                      <div className="p-3 min-w-[200px]">
                        <p className="font-bold text-lg">👤 {person.name}</p>
                        <p className="text-sm">📱 {person.phone}</p>
                        <p className="text-sm font-semibold text-green-600 mt-2">
                          📍 {person.latitude.toFixed(4)}, {person.longitude.toFixed(4)}
                        </p>
                        {person.address && <p className="text-xs mt-1">{person.address}</p>}
                        <p className="text-xs text-gray-600 mt-2">
                          🕐 {new Date(person.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                  
                  {/* Accuracy circle */}
                  {person.accuracy && (
                    <Circle
                      center={[person.latitude, person.longitude]}
                      radius={person.accuracy}
                      pathOptions={{
                        color: "red",
                        weight: 2,
                        opacity: 0.5,
                        fillOpacity: 0.1,
                      }}
                    />
                  )}
                </div>
              ))}
            </MapContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weather Details Card */}
      {weatherData && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getWeatherEmoji()} Live Weather Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Temperature</p>
              <p className="text-2xl font-bold">{weatherData.temp}°C</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Conditions</p>
              <p className="text-lg font-semibold">{weatherData.conditions || "No data"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wind Speed</p>
              <p className="text-lg font-bold">{weatherData.wind || "N/A"} km/h</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Humidity</p>
              <p className="text-lg font-bold">{weatherData.humidity || "N/A"}%</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Card */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5" />
            Enter Phone Number to Track
          </CardTitle>
          <CardDescription>Get real-time location on the map above</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Enter phone number (e.g., 9876543210)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isSearching || isLiveTracking}
              className="text-lg py-6"
              data-testid="input-phone-search"
            />
            <Button
              type="submit"
              disabled={isSearching || isLiveTracking}
              className="bg-green-600 hover:bg-green-700 text-white font-bold text-lg px-8"
              data-testid="button-search-person"
            >
              {isSearching ? "🔍 Searching..." : isLiveTracking ? "🔴 TRACKING" : "▶️ Start Track"}
            </Button>
          </form>
          
          {/* Stop Tracking Button */}
          {isLiveTracking && (
            <Button
              onClick={stopLiveTracking}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-6 gap-2"
              data-testid="button-stop-live-tracking"
            >
              <AlertCircle className="w-5 h-5" />
              🛑 STOP LIVE TRACKING
            </Button>
          )}
          
          {/* Live Tracking Status */}
          {isLiveTracking && (
            <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <Badge className="bg-red-600 text-white animate-pulse px-3 py-1">🔴 LIVE TRACKING</Badge>
                <span className="text-sm font-bold text-red-700 dark:text-red-300">
                  Location updating every 3 seconds • Zoom map to see details
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tracked People List */}
      {trackedPeople.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Found {trackedPeople.length} Person
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trackedPeople.map((person) => (
                <div key={person.id} className="p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-lg">👤 {person.name}</p>
                      <p className="text-sm text-muted-foreground">📱 {person.phone}</p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                        ✅ Last Location: {person.latitude.toFixed(4)}, {person.longitude.toFixed(4)}
                      </p>
                      {person.address && (
                        <p className="text-xs text-muted-foreground mt-1">📍 {person.address}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        🕐 {new Date(person.timestamp).toLocaleString()}
                      </p>
                      {person.accuracy && (
                        <p className="text-xs text-muted-foreground">📏 Accuracy: ±{Math.round(person.accuracy)}m</p>
                      )}
                    </div>
                    <div className="text-3xl">📍</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help Card */}
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">💡 How it works</p>
            <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
              Track is enabled when you or your contacts use SOS, fall detection, or enable continuous location sharing. Last known location is updated every time a location event occurs.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
