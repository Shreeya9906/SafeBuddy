import { useState, useEffect } from "react";
import { weatherAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CloudDrizzle, Wind, Eye, RefreshCw, Search, Droplets, Gauge, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherAlert } from "@shared/schema";
import { indianCities, searchCities } from "@/data/indian-cities";

const weatherIcons: Record<string, React.ReactNode> = {
  "heavy_rain": <CloudDrizzle className="w-8 h-8 text-blue-500" />,
  "storm": <AlertTriangle className="w-8 h-8 text-purple-500" />,
  "fog": <Eye className="w-8 h-8 text-gray-500" />,
  "wind": <Wind className="w-8 h-8 text-cyan-500" />,
  "heat_wave": <Thermometer className="w-8 h-8 text-red-500" />,
  "cold_wave": <AlertTriangle className="w-8 h-8 text-blue-600" />,
  "snow": <CloudDrizzle className="w-8 h-8 text-white" />,
  "default": <CloudDrizzle className="w-8 h-8 text-blue-400" />,
};

export default function WeatherPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<typeof indianCities>([]);
  const [selectedCity, setSelectedCity] = useState<typeof indianCities[0] | null>(null);
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      setSearchResults(searchCities(searchQuery));
      setShowSearchResults(true);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const data = await weatherAPI.getAlerts();
      setAlerts(data);
      
      if (data.length === 0) {
        toast({
          title: "All Clear",
          description: "No active weather alerts in your area.",
        });
      }
    } catch (error: any) {
      console.error("Error loading alerts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadLiveWeather = async (city: typeof indianCities[0]) => {
    setIsLoading(true);
    try {
      const data = await weatherAPI.getLiveWeather(city.lat, city.lon, city.name);
      setLiveWeather(data);
      toast({
        title: "Weather Updated",
        description: `Live weather for ${city.name} loaded`,
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

  const handleCitySelect = async (city: typeof indianCities[0]) => {
    setSelectedCity(city);
    setSearchQuery(city.name);
    setShowSearchResults(false);
    await loadLiveWeather(city);
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case "critical":
        return "bg-red-500";
      case "severe":
        return "bg-orange-500";
      case "moderate":
        return "bg-yellow-500";
      default:
        return "bg-blue-500";
    }
  };

  const getWeatherIcon = (type?: string) => {
    return weatherIcons[type?.toLowerCase() || ""] || weatherIcons.default;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CloudDrizzle className="w-8 h-8" />
            Weather & Disaster Alerts
          </h2>
          <p className="text-muted-foreground">Stay safe with real-time weather information across India</p>
        </div>
        <Button
          onClick={loadAlerts}
          disabled={isLoading}
          variant="outline"
          data-testid="button-refresh-alerts"
        >
          <RefreshCw className={`mr-2 w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Search Cities & Districts
          </CardTitle>
          <CardDescription>Find weather alerts for any city or district across India</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              placeholder="Search for a city or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              data-testid="input-search-city"
              className="w-full"
            />
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 border rounded-md bg-background shadow-lg z-10">
                <div className="max-h-64 overflow-y-auto">
                  {searchResults.map((city, index) => (
                    <button
                      key={index}
                      onClick={() => handleCitySelect(city)}
                      className="w-full text-left px-4 py-2 hover:bg-muted transition-colors"
                      data-testid={`button-city-${city.name}`}
                    >
                      <div className="font-medium">{city.name}</div>
                      <div className="text-xs text-muted-foreground">{city.state}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {selectedCity && (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm"><strong>Selected:</strong> {selectedCity.name}, {selectedCity.state}</p>
              <p className="text-xs text-muted-foreground mt-1">Coordinates: {selectedCity.lat.toFixed(2)}°N, {selectedCity.lon.toFixed(2)}°E</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {indianCities.slice(0, 12).map((city, index) => (
              <Button
                key={index}
                variant={selectedCity?.name === city.name ? "default" : "outline"}
                size="sm"
                onClick={() => handleCitySelect(city)}
                data-testid={`button-quick-city-${city.name}`}
                className="text-xs"
              >
                {city.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {liveWeather && (
        <Card className="border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                {getWeatherIcon(liveWeather.alertType)}
                <div className="flex-1">
                  <CardTitle className="text-2xl">{liveWeather.title}</CardTitle>
                  <CardDescription className="mt-1">Last updated: {new Date(liveWeather.timestamp).toLocaleTimeString()}</CardDescription>
                </div>
              </div>
              <Badge className={getSeverityColor(liveWeather.severity)}>
                {liveWeather.severity?.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{liveWeather.description}</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-semibold text-muted-foreground">Temperature</span>
                </div>
                <p className="text-2xl font-bold">{liveWeather.temperature}°C</p>
                <p className="text-xs text-muted-foreground">Feels like {liveWeather.feelsLike}°C</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-semibold text-muted-foreground">Humidity</span>
                </div>
                <p className="text-2xl font-bold">{liveWeather.humidity}%</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Wind className="w-4 h-4 text-cyan-500" />
                  <span className="text-xs font-semibold text-muted-foreground">Wind Speed</span>
                </div>
                <p className="text-2xl font-bold">{liveWeather.windSpeed}</p>
                <p className="text-xs text-muted-foreground">m/s</p>
              </div>

              <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="w-4 h-4 text-gray-500" />
                  <span className="text-xs font-semibold text-muted-foreground">Pressure</span>
                </div>
                <p className="text-2xl font-bold">{liveWeather.pressure}</p>
                <p className="text-xs text-muted-foreground">hPa</p>
              </div>
            </div>

            {liveWeather.instructions && liveWeather.instructions.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Safety Recommendations:</strong>
                  <ul className="mt-2 space-y-1">
                    {liveWeather.instructions.map((instruction: string, i: number) => (
                      <li key={i} className="text-sm">• {instruction}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {alerts.length === 0 && !liveWeather ? (
        <Card className="bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-8 text-center">
            <CloudDrizzle className="mx-auto mb-4 w-12 h-12 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
              No Active Alerts
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Weather conditions in your area are normal. Stay safe!
            </p>
          </CardContent>
        </Card>
      ) : liveWeather ? (
        <div>
          <h3 className="text-xl font-bold mb-4">Active Weather Alerts in Your Area</h3>
          <div className="grid gap-4">
          {alerts.map((alert, index) => (
            <Card key={alert.id || index} className="border-2 border-orange-200 dark:border-orange-900">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getWeatherIcon(alert.alertType)}
                    <div className="flex-1">
                      <CardTitle className="text-xl">{alert.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {alert.affectedAreas?.join(", ") || "Your area"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.severity?.toUpperCase() || "ALERT"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-foreground">
                  {alert.description}
                </p>

                {alert.instructions && alert.instructions.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>What to do:</strong>
                      <ul className="mt-2 space-y-1">
                        {alert.instructions.map((instruction, i) => (
                          <li key={i} className="text-sm">• {instruction}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-2 gap-4 pt-2 text-xs text-muted-foreground">
                  {alert.startTime && (
                    <div>
                      <p className="font-semibold">Started</p>
                      <p>{new Date(alert.startTime).toLocaleString()}</p>
                    </div>
                  )}
                  {alert.endTime && (
                    <div>
                      <p className="font-semibold">Expected End</p>
                      <p>{new Date(alert.endTime).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {alerts.map((alert, index) => (
            <Card key={alert.id || index} className="border-2 border-orange-200 dark:border-orange-900">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {getWeatherIcon(alert.alertType)}
                    <div className="flex-1">
                      <CardTitle className="text-xl">{alert.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {alert.affectedAreas?.join(", ") || "Your area"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getSeverityColor(alert.severity)}>
                    {alert.severity?.toUpperCase() || "ALERT"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm leading-relaxed text-foreground">
                  {alert.description}
                </p>

                {alert.instructions && alert.instructions.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>What to do:</strong>
                      <ul className="mt-2 space-y-1">
                        {alert.instructions.map((instruction, i) => (
                          <li key={i} className="text-sm">• {instruction}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-blue-50 dark:bg-blue-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Safety Tips During Weather Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li>• Stay indoors and away from windows during severe weather</li>
            <li>• Keep your phone charged and connected to your guardians</li>
            <li>• Listen to official weather updates and emergency alerts</li>
            <li>• Avoid driving or traveling during severe conditions</li>
            <li>• Use the SOS feature if you encounter an emergency</li>
            <li>• Inform your guardians of your location and status</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
