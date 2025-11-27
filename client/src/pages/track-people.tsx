import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, MapPin, Phone, User, Zap, AlertTriangle, Wind, Users } from "lucide-react";
import { weatherAPI } from "@/lib/api";
import L from "leaflet";

export default function TrackPeoplePage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [trackedPeople, setTrackedPeople] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([28.7041, 77.1025]); // Default: New Delhi
  const [weatherData, setWeatherData] = useState<any>(null);
  const [pollutionData, setPollutionData] = useState<any>(null);
  const [cycloneAlert, setCycloneAlert] = useState<any>(null);
  const [pollutionAlert, setPollutionAlert] = useState<any>(null);
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const { toast } = useToast();
  const liveTrackingInterval = useRef<NodeJS.Timeout | null>(null);
  const trackedPhoneRef = useRef<string>("");
  const weatherInterval = useRef<NodeJS.Timeout | null>(null);

  // Refresh location data and fetch weather + pollution
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
          
          // Fetch weather and pollution for the location
          try {
            const [weather, pollution] = await Promise.all([
              weatherAPI.getLiveWeather(person.latitude, person.longitude, person.address || "Location"),
              fetch(`/api/pollution?city=${encodeURIComponent(person.address?.split(',')[0] || person.phone)}`, {
                credentials: "include",
              }).then(r => r.json()).catch(() => null)
            ]);

            setWeatherData(weather);
            if (pollution) {
              setPollutionData(pollution);
              if (pollution.warning) {
                setPollutionAlert({
                  severity: pollution.aqi > 200 ? "critical" : "warning",
                  message: pollution.warningMessage,
                  aqi: pollution.aqi
                });
              } else {
                setPollutionAlert(null);
              }
            }
            
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
            console.error("Weather/Pollution fetch error:", error);
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

  // Load family members on mount
  useEffect(() => {
    loadFamilyMembers();
  }, []);

  // Load family members (children)
  const loadFamilyMembers = async () => {
    try {
      const response = await fetch("/api/children", { credentials: "include" });
      if (response.ok) {
        const children = await response.json();
        setFamilyMembers(children);
      }
    } catch (error) {
      console.error("Error loading family members:", error);
    }
  };

  // Quick track a family member
  const trackFamilyMember = async (member: any) => {
    if (!member.phone) {
      toast({ title: "Error", description: "Family member has no phone number", variant: "destructive" });
      return;
    }
    
    setPhoneNumber(member.phone);
    // Trigger search after setting phone number
    setTimeout(() => performSearch(member.phone), 100);
  };

  // Perform actual search
  const performSearch = async (phone: string) => {
    if (!phone.trim()) {
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
      const response = await fetch(`/api/track/search?phone=${encodeURIComponent(phone)}`, {
        credentials: "include",
      });
      
      if (!response.ok) throw new Error("Person not found");
      
      const person = await response.json();
      
      if (person.latitude && person.longitude) {
        trackedPhoneRef.current = phone;
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
          refreshLocation(phone);
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
    performSearch(phoneNumber);
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

      {/* Pollution Alert */}
      {pollutionAlert && (
        <Alert className={`border-2 ${pollutionAlert.severity === "critical" ? "border-red-600 bg-red-50 dark:bg-red-950/50" : "border-orange-500 bg-orange-50 dark:bg-orange-950/50"}`}>
          <Wind className={`h-6 w-6 ${pollutionAlert.severity === "critical" ? "text-red-600" : "text-orange-600"}`} />
          <AlertDescription className={`${pollutionAlert.severity === "critical" ? "text-red-700 dark:text-red-300" : "text-orange-700 dark:text-orange-300"} font-bold text-lg ml-2`}>
            {pollutionAlert.message} (AQI: {pollutionAlert.aqi})
          </AlertDescription>
        </Alert>
      )}

      {/* Family Members Quick Track */}
      {familyMembers.length > 0 && (
        <Card className="border-2 border-purple-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              My Family Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {familyMembers.map((member) => (
                <Button
                  key={member.id}
                  onClick={() => trackFamilyMember(member)}
                  variant="outline"
                  className="h-24 flex flex-col justify-center items-center gap-1 border-purple-300 hover:bg-purple-50"
                  data-testid={`button-track-${member.id}`}
                >
                  <span className="text-2xl">👤</span>
                  <span className="text-xs font-medium text-center line-clamp-2">{member.name}</span>
                  <span className="text-xs text-muted-foreground">{member.phone || "No phone"}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map - Always Visible and Large */}
      <Card className="overflow-hidden border-2 border-blue-300">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white pb-3">
          <CardTitle className="flex items-center gap-2 text-white justify-between flex-wrap">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6" />
              Live Map {isLiveTracking && <Badge className="bg-red-600 animate-pulse ml-2">🔴 LIVE</Badge>}
            </div>
            <div className="flex items-center gap-3">
              {weatherData && (
                <div className="text-sm">
                  {getWeatherEmoji()}
                  <span className="text-xs ml-1">{weatherData?.temp || "N/A"}°C</span>
                </div>
              )}
              {pollutionData && (
                <Badge className={`${pollutionData.aqi > 200 ? "bg-red-600" : pollutionData.aqi > 150 ? "bg-orange-600" : pollutionData.aqi > 100 ? "bg-yellow-600" : "bg-green-600"}`}>
                  🌫️ AQI: {pollutionData.aqi}
                </Badge>
              )}
            </div>
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

      {/* Weather & Pollution Details Card */}
      {(weatherData || pollutionData) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {weatherData && (
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getWeatherEmoji()} Live Weather
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

          {pollutionData && (
            <Card className={`border-2 ${pollutionData.aqi > 200 ? "border-red-400 bg-red-50 dark:bg-red-950/20" : pollutionData.aqi > 150 ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20" : pollutionData.aqi > 100 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20" : "border-green-400 bg-green-50 dark:bg-green-950/20"}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🌫️ Air Quality (AQI)
                  <Badge className={`${pollutionData.aqi > 200 ? "bg-red-600" : pollutionData.aqi > 150 ? "bg-orange-600" : pollutionData.aqi > 100 ? "bg-yellow-600" : "bg-green-600"}`}>
                    {pollutionData.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">AQI Index</p>
                  <p className={`text-2xl font-bold ${pollutionData.aqi > 200 ? "text-red-600" : pollutionData.aqi > 150 ? "text-orange-600" : pollutionData.aqi > 100 ? "text-yellow-600" : "text-green-600"}`}>
                    {pollutionData.aqi}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PM2.5</p>
                  <p className="text-lg font-bold">{pollutionData.pm25 || "N/A"} µg/m³</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">PM10</p>
                  <p className="text-lg font-bold">{pollutionData.pm10 || "N/A"} µg/m³</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">NO₂</p>
                  <p className="text-lg font-bold">{pollutionData.no2 || "N/A"} µg/m³</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Tracked Person Info */}
      {trackedPeople.length > 0 && (
        <Card className="border-2 border-green-300 bg-green-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              📊 Live Tracking Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {trackedPeople.map((person) => (
              <div key={person.id} className="space-y-2 p-3 bg-white rounded border border-green-200">
                <p><strong>Name:</strong> {person.name}</p>
                <p><strong>Phone:</strong> {person.phone}</p>
                <p><strong>Latitude:</strong> {person.latitude}</p>
                <p><strong>Longitude:</strong> {person.longitude}</p>
                <p><strong>Address:</strong> {person.address || "No address"}</p>
                <p><strong>Time:</strong> {new Date(person.timestamp).toLocaleTimeString()}</p>
                <p className="text-xs text-gray-500">ID: {person.id}</p>
              </div>
            ))}
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
