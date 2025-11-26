import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Bell, RefreshCw, MapPin, Clock, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DisasterAlert {
  id: string;
  type: "earthquake" | "flood" | "cyclone" | "landslide" | "tsunami" | "wildfire";
  title: string;
  description: string;
  severity: "critical" | "severe" | "moderate";
  affectedAreas: string[];
  location: string;
  coordinates: { lat: number; lon: number };
  timestamp: Date;
  instructions: string[];
  safetyTips: string[];
}

const disasterIcons: Record<string, string> = {
  earthquake: "🌍",
  flood: "🌊",
  cyclone: "🌪️",
  landslide: "⛏️",
  tsunami: "🌀",
  wildfire: "🔥",
};

const mockDisasterAlerts: DisasterAlert[] = [
  {
    id: "1",
    type: "cyclone",
    title: "Severe Cyclone Warning",
    description: "A severe cyclonic storm is forming over the Bay of Bengal. Wind speeds expected to reach 150 km/h. Heavy rainfall expected.",
    severity: "critical",
    affectedAreas: ["West Bengal", "Odisha", "Andhra Pradesh"],
    location: "Bay of Bengal",
    coordinates: { lat: 18.5, lon: 88.0 },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    instructions: [
      "Secure loose objects outside",
      "Stock food, water, and medicines for 7 days",
      "Keep emergency contact numbers handy",
      "Move to safer higher ground if instructed",
      "Follow local authority instructions",
    ],
    safetyTips: [
      "Stay indoors during the cyclone",
      "Keep away from windows and doors",
      "Use battery-powered radio/mobile for updates",
      "Don't venture out unless absolutely necessary",
    ],
  },
  {
    id: "2",
    type: "flood",
    title: "Flash Flood Alert",
    description: "Heavy monsoon rains have triggered flash flood conditions in low-lying areas. Water levels rising rapidly.",
    severity: "severe",
    affectedAreas: ["Kerala", "Tamil Nadu", "Karnataka"],
    location: "Western Ghats Region",
    coordinates: { lat: 10.5, lon: 76.5 },
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    instructions: [
      "Move to higher ground immediately",
      "Avoid crossing flooded roads and bridges",
      "Do not attempt to wade through water",
      "Contact emergency services if trapped",
      "Wait for rescue teams if stranded",
    ],
    safetyTips: [
      "Never drive through flooded areas",
      "Keep important documents in waterproof containers",
      "Have emergency supply kit ready",
      "Know your evacuation route",
    ],
  },
  {
    id: "3",
    type: "earthquake",
    title: "Moderate Seismic Activity",
    description: "Earthquake aftershocks reported in Himalayan region. Magnitude 5.2 recorded. Continue to remain alert.",
    severity: "moderate",
    affectedAreas: ["Himachal Pradesh", "Uttarakhand", "Jammu & Kashmir"],
    location: "Himalayan Region",
    coordinates: { lat: 32.5, lon: 78.0 },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    instructions: [
      "If indoors: Take cover under sturdy furniture",
      "If outdoors: Move away from buildings and power lines",
      "Don't use elevators",
      "Stay tuned to emergency broadcasts",
      "Report any structural damage to authorities",
    ],
    safetyTips: [
      "Keep an earthquake survival kit ready",
      "Know how to turn off gas and electricity",
      "Practice Drop, Cover, Hold On technique",
      "Keep phone charged and emergency numbers saved",
    ],
  },
];

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-500 text-white";
    case "severe":
      return "bg-orange-500 text-white";
    case "moderate":
      return "bg-yellow-500 text-white";
    default:
      return "bg-blue-500 text-white";
  }
};

const getSeverityBgColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900";
    case "severe":
      return "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900";
    case "moderate":
      return "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900";
    default:
      return "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900";
  }
};

export default function DisasterAlertsPage() {
  const { toast } = useToast();
  const [alerts, setAlerts] = useState<DisasterAlert[]>(mockDisasterAlerts);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active");

  const criticalAlerts = alerts.filter(a => a.severity === "critical");
  const severeAlerts = alerts.filter(a => a.severity === "severe");
  const moderateAlerts = alerts.filter(a => a.severity === "moderate");

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Alerts Updated",
        description: "Disaster alerts have been refreshed",
      });
    }, 1500);
  };

  const AlertCard = ({ alert }: { alert: DisasterAlert }) => (
    <Card className={`border-2 ${getSeverityBgColor(alert.severity)}`} data-testid={`card-disaster-${alert.id}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <span className="text-3xl">{disasterIcons[alert.type]}</span>
            <div>
              <CardTitle className="text-lg">{alert.title}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {alert.location}
              </CardDescription>
            </div>
          </div>
          <Badge className={getSeverityColor(alert.severity)} data-testid={`badge-severity-${alert.id}`}>
            {alert.severity.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{alert.description}</p>

        {alert.affectedAreas.length > 0 && (
          <div>
            <p className="text-sm font-semibold mb-2">Affected Areas:</p>
            <div className="flex flex-wrap gap-2">
              {alert.affectedAreas.map((area, idx) => (
                <Badge key={idx} variant="outline" data-testid={`area-badge-${alert.id}-${idx}`}>
                  {area}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-muted-foreground flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Updated {alert.timestamp.toLocaleString()}
        </div>

        <Alert className="border-l-4 border-l-orange-500">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="ml-2">
            <strong>What to do:</strong>
            <ul className="mt-2 space-y-1">
              {alert.instructions.map((instr, idx) => (
                <li key={idx} className="text-xs">• {instr}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>

        <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg">
          <p className="text-xs font-semibold mb-2 text-blue-900 dark:text-blue-100">💡 Safety Tips:</p>
          <ul className="space-y-1 text-xs text-blue-800 dark:text-blue-200">
            {alert.safetyTips.map((tip, idx) => (
              <li key={idx}>✓ {tip}</li>
            ))}
          </ul>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`tel:112`)}
            data-testid={`button-emergency-${alert.id}`}
          >
            Call Emergency (112)
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => toast({
              title: "Location: " + alert.location,
              description: `Coordinates: ${alert.coordinates.lat}°N, ${alert.coordinates.lon}°E`,
            })}
            data-testid={`button-location-${alert.id}`}
          >
            View Location
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            Disaster Alerts
          </h1>
          <p className="text-muted-foreground">Real-time emergency and disaster warnings for India</p>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isLoading}
          variant="outline"
          data-testid="button-refresh-disasters"
        >
          <RefreshCw className={`mr-2 w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4" data-testid="tabs-disaster-severity">
          <TabsTrigger value="active" data-testid="tab-all-alerts">
            All ({alerts.length})
          </TabsTrigger>
          <TabsTrigger value="critical" className={criticalAlerts.length > 0 ? "text-red-600 font-bold" : ""} data-testid="tab-critical">
            Critical ({criticalAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="severe" className={severeAlerts.length > 0 ? "text-orange-600 font-bold" : ""} data-testid="tab-severe">
            Severe ({severeAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="moderate" className={moderateAlerts.length > 0 ? "text-yellow-600 font-bold" : ""} data-testid="tab-moderate">
            Moderate ({moderateAlerts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4 mt-6">
          {alerts.length === 0 ? (
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-8 text-center">
                <Bell className="mx-auto mb-4 w-12 h-12 text-green-600" />
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">All Clear</h3>
                <p className="text-sm text-green-700 dark:text-green-300 mt-1">No active disaster alerts. Stay safe!</p>
              </CardContent>
            </Card>
          ) : (
            alerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
          )}
        </TabsContent>

        <TabsContent value="critical" className="space-y-4 mt-6">
          {criticalAlerts.length === 0 ? (
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-8 text-center">
                <Bell className="mx-auto mb-4 w-12 h-12 text-green-600" />
                <p className="text-sm text-green-700 dark:text-green-300">No critical alerts</p>
              </CardContent>
            </Card>
          ) : (
            criticalAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
          )}
        </TabsContent>

        <TabsContent value="severe" className="space-y-4 mt-6">
          {severeAlerts.length === 0 ? (
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-green-700 dark:text-green-300">No severe alerts</p>
              </CardContent>
            </Card>
          ) : (
            severeAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
          )}
        </TabsContent>

        <TabsContent value="moderate" className="space-y-4 mt-6">
          {moderateAlerts.length === 0 ? (
            <Card className="bg-green-50 dark:bg-green-950/20">
              <CardContent className="p-8 text-center">
                <p className="text-sm text-green-700 dark:text-green-300">No moderate alerts</p>
              </CardContent>
            </Card>
          ) : (
            moderateAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600" />
            Emergency Contacts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              onClick={() => window.open("tel:112")}
              className="w-full bg-red-600 hover:bg-red-700"
              data-testid="button-call-112"
            >
              Call 112 (Emergency)
            </Button>
            <Button
              onClick={() => window.open("tel:108")}
              className="w-full bg-orange-600 hover:bg-orange-700"
              data-testid="button-call-108"
            >
              Call 108 (Disaster Relief)
            </Button>
            <Button
              onClick={() => window.open("tel:1070")}
              className="w-full bg-blue-600 hover:bg-blue-700"
              data-testid="button-call-1070"
            >
              Call 1070 (Disaster Helpline)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
