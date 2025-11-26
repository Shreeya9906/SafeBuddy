import { useState, useEffect } from "react";
import { weatherAPI } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CloudDrizzle, Wind, Eye, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WeatherAlert } from "@shared/schema";

const weatherIcons: Record<string, React.ReactNode> = {
  "heavy_rain": <CloudDrizzle className="w-8 h-8 text-blue-500" />,
  "storm": <AlertTriangle className="w-8 h-8 text-purple-500" />,
  "fog": <Eye className="w-8 h-8 text-gray-500" />,
  "wind": <Wind className="w-8 h-8 text-cyan-500" />,
  "default": <CloudDrizzle className="w-8 h-8 text-blue-400" />,
};

export default function WeatherPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, []);

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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
          <p className="text-muted-foreground">Stay safe with real-time weather information</p>
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

      {alerts.length === 0 ? (
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
