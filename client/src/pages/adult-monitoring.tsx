import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { guardianAPI } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Heart, AlertCircle, Users, TrendingUp } from "lucide-react";
import type { Guardian } from "@shared/schema";

export default function AdultMonitoringPage() {
  const { user } = useAuth();
  const [dependents, setDependents] = useState<Guardian[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadDependents();
  }, []);

  const loadDependents = async () => {
    try {
      const data = await guardianAPI.getAll();
      setDependents(data);
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

  // Mock data for demonstration
  const childrenData = [
    {
      id: "1",
      name: "Arjun",
      relationship: "Son",
      age: 8,
      status: "safe",
      lastLocation: "School",
      battery: 85,
      lastUpdate: "2 mins ago",
    },
    {
      id: "2",
      name: "Priya",
      relationship: "Daughter",
      age: 12,
      status: "safe",
      lastLocation: "Home",
      battery: 92,
      lastUpdate: "5 mins ago",
    },
  ];

  const elderlyData = [
    {
      id: "3",
      name: "Grandmother",
      relationship: "Mother",
      age: 72,
      status: "monitored",
      lastLocation: "Home",
      heartRate: 72,
      bloodPressure: "120/80",
      battery: 78,
      lastUpdate: "1 min ago",
    },
    {
      id: "4",
      name: "Grandfather",
      relationship: "Father",
      age: 75,
      status: "monitored",
      lastLocation: "Park",
      heartRate: 68,
      bloodPressure: "118/78",
      battery: 65,
      lastUpdate: "10 mins ago",
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Family Monitoring Hub</h1>
        <p className="text-muted-foreground">Monitor the safety and health of your loved ones</p>
      </div>

      <Tabs defaultValue="children" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="children" data-testid="tab-children">Children Tracking</TabsTrigger>
          <TabsTrigger value="elderly" data-testid="tab-elderly">Elderly Monitoring</TabsTrigger>
        </TabsList>

        <TabsContent value="children" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {childrenData.map((child) => (
              <Card key={child.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        {child.name}
                      </CardTitle>
                      <CardDescription>{child.relationship}</CardDescription>
                    </div>
                    <Badge variant="secondary">{child.age} years</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-semibold flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {child.lastLocation}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Battery</p>
                      <p className="font-semibold mt-1">{child.battery}%</p>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Status</p>
                      <Badge variant="default" className="mt-1">
                        {child.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Last Update: {child.lastUpdate}</p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`tel:${child.id}`)}
                      data-testid={`button-call-child-${child.id}`}
                    >
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast({
                        title: "Map View",
                        description: `Viewing live location of ${child.name}`,
                      })}
                      data-testid={`button-map-child-${child.id}`}
                    >
                      View Map
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="elderly" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {elderlyData.map((elder) => (
              <Card key={elder.id} className="hover:shadow-lg transition-shadow border-2 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="w-5 h-5 text-red-500" />
                        {elder.name}
                      </CardTitle>
                      <CardDescription>{elder.relationship}</CardDescription>
                    </div>
                    <Badge variant="outline">{elder.age} years</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Location</p>
                      <p className="font-semibold flex items-center gap-1 mt-1">
                        <MapPin className="w-4 h-4" />
                        {elder.lastLocation}
                      </p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Heart Rate</p>
                      <p className="font-semibold mt-1 flex items-center gap-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        {elder.heartRate} bpm
                      </p>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">BP</p>
                      <p className="font-semibold mt-1">{elder.bloodPressure}</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <p className="text-xs text-muted-foreground">Battery</p>
                      <p className="font-semibold mt-1">{elder.battery}%</p>
                    </div>
                  </div>

                  <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Health Status: Good
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Last Update: {elder.lastUpdate}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`tel:${elder.id}`)}
                      data-testid={`button-call-elder-${elder.id}`}
                    >
                      Call
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast({
                        title: "Health Dashboard",
                        description: `Viewing health metrics for ${elder.name}`,
                      })}
                      data-testid={`button-health-elder-${elder.id}`}
                    >
                      Health
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast({
                        title: "Map View",
                        description: `Viewing live location of ${elder.name}`,
                      })}
                      data-testid={`button-map-elder-${elder.id}`}
                    >
                      Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 dark:bg-blue-900/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Alerts & Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm">No active alerts. All dependents are safe and healthy.</p>
        </CardContent>
      </Card>
    </div>
  );
}
