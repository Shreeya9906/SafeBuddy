import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, CloudDrizzle, AlertTriangle, Wind, Droplets, Thermometer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getCurrentLocation } from "@/lib/geolocation";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  apparentTemperature: number;
  location: { lat: number; lon: number; name: string };
}

export function WeatherWidget() {
  const { toast } = useToast();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadWeather();
    const interval = setInterval(loadWeather, 600000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, []);

  const loadWeather = async () => {
    try {
      const location = await getCurrentLocation();
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,apparent_temperature,wind_speed_10m&timezone=auto`
      );
      const data = await response.json();
      
      if (data.current) {
        setWeather({
          temperature: data.current.temperature_2m,
          humidity: data.current.relative_humidity_2m,
          windSpeed: data.current.wind_speed_10m,
          weatherCode: data.current.weather_code,
          apparentTemperature: data.current.apparent_temperature,
          location: {
            lat: location.latitude,
            lon: location.longitude,
            name: data.timezone || "Your Location",
          },
        });
      }
    } catch (error: any) {
      console.error("Weather fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeatherDescription = (code: number): string => {
    if (code === 0) return "Clear sky";
    if (code === 1 || code === 2) return "Mostly clear";
    if (code === 3) return "Overcast";
    if (code === 45 || code === 48) return "Foggy";
    if (code >= 51 && code <= 67) return "Drizzle/Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code >= 85 && code <= 86) return "Snow showers";
    if (code >= 80 && code <= 99) return "Thunderstorm";
    return "Unknown";
  };

  const getHeatAlertLevel = (temp: number, humidity: number): string => {
    const heatIndex = temp + (0.5555 * ((humidity / 100) * (6.112 * Math.pow(1.8 * temp + 32 + 459.67, 0.5) - 10.0)));
    if (heatIndex > 41) return "Extreme Heat";
    if (heatIndex > 35) return "Severe Heat";
    if (heatIndex > 29) return "Moderate Heat";
    return "Normal";
  };

  const getWindAlertLevel = (speed: number): string => {
    if (speed > 40) return "Severe";
    if (speed > 25) return "Strong";
    if (speed > 15) return "Moderate";
    return "Light";
  };

  const getSafetyInstructions = (temp: number, windSpeed: number, humidity: number): string[] => {
    const instructions: string[] = [];
    const heatAlert = getHeatAlertLevel(temp, humidity);
    
    if (heatAlert === "Extreme Heat") {
      instructions.push("🔴 Extreme heat: Stay indoors in air-conditioned areas");
      instructions.push("🔴 Drink plenty of water, avoid caffeine and alcohol");
      instructions.push("🔴 Never leave children or pets in vehicles");
    } else if (heatAlert === "Severe Heat") {
      instructions.push("🟠 Severe heat: Minimize outdoor activities");
      instructions.push("🟠 Wear light, loose clothing and sunscreen");
      instructions.push("🟠 Stay hydrated throughout the day");
    } else if (heatAlert === "Moderate Heat") {
      instructions.push("🟡 Moderate heat: Use sun protection when outside");
      instructions.push("🟡 Take frequent breaks in shade");
      instructions.push("🟡 Carry water bottle");
    }

    const windAlert = getWindAlertLevel(windSpeed);
    if (windAlert === "Severe") {
      instructions.push("⚠️ Dangerous winds: Avoid going outside");
      instructions.push("⚠️ Secure loose items around your home");
    } else if (windAlert === "Strong") {
      instructions.push("⚠️ Strong winds: Exercise caution outdoors");
      instructions.push("⚠️ Use secure foothold when walking");
    }

    if (humidity > 80) {
      instructions.push("💧 High humidity: Heat feels more intense");
      instructions.push("💧 Risk of heat-related illness is higher");
    }

    if (instructions.length === 0) {
      instructions.push("✅ Weather conditions are favorable");
      instructions.push("✅ Normal outdoor activities are safe");
    }

    return instructions;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!weather) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CloudDrizzle className="w-5 h-5" />
            Live Weather
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Enable location services to see live weather</p>
        </CardContent>
      </Card>
    );
  }

  const heatAlert = getHeatAlertLevel(weather.temperature, weather.humidity);
  const windAlert = getWindAlertLevel(weather.windSpeed);
  const safetyInstructions = getSafetyInstructions(weather.temperature, weather.windSpeed, weather.humidity);

  const getHeatAlertColor = (level: string) => {
    if (level === "Extreme Heat") return "bg-red-500";
    if (level === "Severe Heat") return "bg-orange-500";
    if (level === "Moderate Heat") return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CloudDrizzle className="w-5 h-5" />
              Live Weather - {weather.location.name}
            </CardTitle>
            <CardDescription>Real-time conditions from your location</CardDescription>
          </div>
          <Badge className={getHeatAlertColor(heatAlert)}>
            {heatAlert}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Weather Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="w-4 h-4 text-red-500" />
              <p className="text-xs font-medium text-muted-foreground">Temperature</p>
            </div>
            <p className="text-2xl font-bold">{weather.temperature.toFixed(1)}°C</p>
            <p className="text-xs text-muted-foreground">Feels like {weather.apparentTemperature.toFixed(1)}°C</p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Droplets className="w-4 h-4 text-blue-500" />
              <p className="text-xs font-medium text-muted-foreground">Humidity</p>
            </div>
            <p className="text-2xl font-bold">{weather.humidity}%</p>
            <p className="text-xs text-muted-foreground">{weather.humidity > 70 ? "High" : weather.humidity > 50 ? "Moderate" : "Low"}</p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="w-4 h-4 text-cyan-500" />
              <p className="text-xs font-medium text-muted-foreground">Wind Speed</p>
            </div>
            <p className="text-2xl font-bold">{weather.windSpeed.toFixed(1)} km/h</p>
            <p className="text-xs text-muted-foreground">{windAlert}</p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CloudDrizzle className="w-4 h-4 text-purple-500" />
              <p className="text-xs font-medium text-muted-foreground">Condition</p>
            </div>
            <p className="text-lg font-bold">{getWeatherDescription(weather.weatherCode)}</p>
          </div>
        </div>

        {/* Safety Instructions */}
        <Alert className={heatAlert === "Normal" || heatAlert.includes("Normal") ? "bg-green-50 dark:bg-green-950/20 border-green-200" : "bg-orange-50 dark:bg-orange-950/20 border-orange-200"}>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong className="block mb-2">Safety Instructions:</strong>
            <ul className="space-y-1 text-sm">
              {safetyInstructions.map((instruction, idx) => (
                <li key={idx}>{instruction}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
