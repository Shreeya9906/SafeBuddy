import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sosAPI, guardianAPI, emergencyAPI, childrenAPI } from "@/lib/api";
import { getCurrentLocation, getBatteryLevel } from "@/lib/geolocation";
import { useToast } from "@/hooks/use-toast";
import { WeatherWidget } from "@/components/weather-widget";
import { playSOSSiren, stopSOSSiren, cleanupAudioContext } from "@/lib/siren";
import { enableFlashlight, disableFlashlight } from "@/lib/flashlight";
import {
  Shield,
  MapPin,
  Users,
  Activity,
  AlertCircle,
  Phone,
  Heart,
  Cloud,
  Lightbulb,
  Plus,
  User,
  User2,
  Activity as ActivityIcon,
} from "lucide-react";
import type { SOSAlert, Guardian } from "@shared/schema";

function ChildDashboard({ user, guardians, activeAlert, isSOSActive, handleSOSToggle, handleFlashlightToggle, isFlashlightOn }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Hi {user?.name}! Stay Safe 🛡️</h1>
        <p className="text-muted-foreground">Emergency help is just one tap away</p>
      </div>

      {isSOSActive && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 text-center">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse inline-block mr-2"></div>
            <span className="text-red-700 dark:text-red-300 font-bold">🚨 SIREN IS PLAYING!</span>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleSOSToggle}
          size="lg"
          className={`h-32 text-lg font-bold ${isSOSActive ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
          data-testid="button-sos-emergency"
        >
          <Shield className="mr-2 w-6 h-6" />
          {isSOSActive ? 'STOP SOS' : 'SOS'}
        </Button>
        
        <Button
          onClick={handleFlashlightToggle}
          size="lg"
          variant={isFlashlightOn ? "default" : "outline"}
          className="h-32 text-lg font-bold"
          data-testid="button-flashlight-toggle"
        >
          <Lightbulb className="w-6 h-6" />
        </Button>
      </div>

      {isSOSActive && (
        <Card className="border-2 border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-700 dark:text-red-300 font-semibold">🚨 SIREN ACTIVE - Emergency Alert Sent</span>
            </div>
            <Button
              onClick={handleSOSToggle}
              variant="destructive"
              size="sm"
            >
              Turn Off SOS
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            My Guardians
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guardians.length > 0 ? (
            <div className="space-y-2">
              {guardians.map((g: Guardian) => (
                <div key={g.id} className="p-2 bg-blue-50 dark:bg-blue-900 rounded text-sm">
                  <p className="font-medium">{g.name}</p>
                  <p className="text-xs text-muted-foreground">{g.phone}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No guardians added yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdultDashboard({ user, guardians, activeAlert, isSOSActive, handleSOSToggle, handleFlashlightToggle, isFlashlightOn }: any) {
  const [children, setChildren] = useState<any[]>([]);
  const [elders, setElders] = useState<any[]>([]);

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      const childrenData = await childrenAPI.getAll();
      setChildren(childrenData);
      const eldersData = await childrenAPI.getElders();
      setElders(eldersData);
    } catch (error) {
      console.error("Error loading family members:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}</h1>
        <p className="text-muted-foreground">Your personal safety hub</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Button
          onClick={handleSOSToggle}
          size="lg"
          className={`h-28 text-lg font-bold ${isSOSActive ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
          data-testid="button-sos-emergency"
        >
          <Shield className="mr-2 w-6 h-6" />
          {isSOSActive ? 'STOP' : 'SOS'}
        </Button>
        
        <Button
          onClick={handleFlashlightToggle}
          size="lg"
          variant={isFlashlightOn ? "default" : "outline"}
          className="h-28 text-lg font-bold"
          data-testid="button-flashlight-toggle"
        >
          <Lightbulb className="w-6 h-6" />
          Flashlight
        </Button>

        <Button
          size="lg"
          variant="outline"
          className="h-28 text-lg font-bold"
          onClick={() => window.open('tel:100')}
          data-testid="button-call-police"
        >
          <Phone className="mr-2 w-6 h-6" />
          Police
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-4 h-4" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{guardians.length}</p>
            <p className="text-sm text-muted-foreground">guardians added</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isSOSActive ? "destructive" : "secondary"}>
              {isSOSActive ? 'SOS Active' : 'Safe'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              My Children
            </CardTitle>
            <CardDescription>Monitor & manage child accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {children.length > 0 ? (
              <div className="space-y-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant="outline"
                    className="w-full justify-start text-left h-16"
                    data-testid={`button-child-${child.id}`}
                  >
                    <User className="mr-2 w-4 h-4" />
                    <div className="flex flex-col gap-0">
                      <span className="font-medium">{child.name}</span>
                      <span className="text-xs text-muted-foreground">Child Mode - Age {child.age}</span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-2 h-16"
                data-testid="button-add-child"
              >
                <Plus className="w-4 h-4" />
                Link Child Account
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 border-4">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl flex items-center gap-3">
              <User2 className="w-6 h-6 text-purple-600" />
              My Elders
            </CardTitle>
            <CardDescription className="text-base">Monitor & manage elder accounts</CardDescription>
          </CardHeader>
          <CardContent>
            {elders.length > 0 ? (
              <div className="space-y-4">
                {elders.map((elder) => (
                  <Button
                    key={elder.id}
                    variant="outline"
                    className="w-full justify-start text-left h-24 text-base"
                    data-testid={`button-elder-${elder.id}`}
                  >
                    <User2 className="mr-3 w-6 h-6 text-purple-600" />
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-lg">{elder.name}</span>
                      <span className="text-sm text-muted-foreground">Elder Mode - Age {elder.age}</span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full gap-3 h-24 text-base font-bold"
                data-testid="button-add-elder"
              >
                <Plus className="w-6 h-6" />
                Link Elder Account
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-orange-200 dark:border-orange-800 border-2">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-600" />
            Fall Detection System
          </CardTitle>
          <CardDescription>Automatic monitoring for elderly & health-at-risk users</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Continuously monitors device motion sensors to detect sudden falls and automatically alert emergency services.</p>
          <Button 
            className="w-full h-12 text-base font-bold gap-2"
            data-testid="button-enable-fall-detection"
          >
            <Activity className="w-5 h-5" />
            Enable Fall Detection
          </Button>
          <p className="text-xs text-muted-foreground text-center">💡 Pro Tip: Keep your phone in your pocket while moving for accurate detection</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ElderDashboard({ user, guardians, activeAlert, isSOSActive, handleSOSToggle, handleFlashlightToggle, isFlashlightOn }: any) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome {user?.name}!</h1>
        <p className="text-lg text-muted-foreground">Your safety is our priority</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Button
          onClick={handleSOSToggle}
          size="lg"
          className={`h-40 text-2xl font-bold rounded-lg ${isSOSActive ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'}`}
          data-testid="button-sos-emergency"
        >
          <Shield className="mr-3 w-10 h-10" />
          {isSOSActive ? 'STOP SOS' : 'EMERGENCY SOS'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleFlashlightToggle}
          size="lg"
          className="h-20 text-lg font-bold"
          variant={isFlashlightOn ? "default" : "outline"}
          data-testid="button-flashlight-toggle"
        >
          <Lightbulb className="w-6 h-6" />
        </Button>

        <Button
          size="lg"
          className="h-20 text-lg font-bold"
          onClick={() => window.open('tel:100')}
          data-testid="button-call-police"
        >
          <Phone className="w-6 h-6" />
        </Button>
      </div>

      <Card className="bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Users className="w-5 h-5" />
            Your Caregivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {guardians.length > 0 ? (
              guardians.map((g) => (
                <div key={g.id} className="p-3 bg-white dark:bg-gray-800 rounded border">
                  <p className="font-bold text-lg">{g.name}</p>
                  <p className="text-primary font-mono">{g.phone}</p>
                  {g.relationship && <p className="text-sm text-muted-foreground">{g.relationship}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm">Add caregivers in Settings</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeAlert, setActiveAlert] = useState<SOSAlert | null>(null);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [isSOSActive, setIsSOSActive] = useState(false);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);

  useEffect(() => {
    loadDashboardData();

    return () => {
      cleanupAudioContext();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [alert, guardianList] = await Promise.all([
        sosAPI.getActive(),
        guardianAPI.getAll(),
      ]);
      setActiveAlert(alert);
      setIsSOSActive(!!alert && alert.status === "active");
      setGuardians(guardianList);
    } catch (error) {
      console.error("Error loading dashboard:", error);
    }
  };

  const handleSOSToggle = async () => {
    if (isSOSActive && activeAlert) {
      try {
        stopSOSSiren();
        await sosAPI.update(activeAlert.id, { status: "resolved", resolvedAt: new Date() });
        setIsSOSActive(false);
        setActiveAlert(null);
        toast({
          title: "SOS Deactivated",
          description: "Your emergency alert has been resolved.",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      try {
        const location = await getCurrentLocation();
        const battery = await getBatteryLevel();
        
        const alert = await sosAPI.create({
          triggerMethod: "manual",
          latitude: location.latitude,
          longitude: location.longitude,
          batteryLevel: battery,
        });
        
        setActiveAlert(alert);
        setIsSOSActive(true);
        playSOSSiren();

        // Notify guardians via SMS and emergency services
        const emergencyNumbers = ["100", "108", "112", "1091"];
        try {
          await Promise.all([
            emergencyAPI.callEmergency(alert.id, emergencyNumbers),
            emergencyAPI.notifyGuardians(alert.id),
          ]);
          toast({
            title: "SOS Activated!",
            description: "SMS sent to guardians & emergency services called. Siren playing.",
            variant: "destructive",
          });
        } catch (callError) {
          toast({
            title: "SOS Activated!",
            description: "Emergency alert sent to guardians. Siren is playing.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        stopSOSSiren();
        toast({
          title: "SOS Error",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const handleFlashlightToggle = async () => {
    try {
      if (isFlashlightOn) {
        await disableFlashlight();
        setIsFlashlightOn(false);
        toast({
          title: "Flashlight Off",
          description: "Flashlight has been disabled.",
        });
      } else {
        await enableFlashlight();
        setIsFlashlightOn(true);
        toast({
          title: "Flashlight On",
          description: "Flashlight is now active.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case "child":
        return "bg-blue-500";
      case "adult":
        return "bg-green-500";
      case "elder":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Welcome, {user?.name}</h2>
          <p className="text-muted-foreground">Your safety dashboard</p>
        </div>
        <Badge className={getModeColor(user?.profileMode || "adult")}>
          {user?.profileMode?.toUpperCase() || "ADULT"} MODE
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/map")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Live Location</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Track</div>
            <p className="text-xs text-muted-foreground">View on map</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/settings")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Guardians</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{guardians.length}</div>
            <p className="text-xs text-muted-foreground">Emergency contacts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/health")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-safe">Good</div>
            <p className="text-xs text-muted-foreground">No alerts</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/weather")}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Weather</CardTitle>
            <Cloud className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Clear</div>
            <p className="text-xs text-muted-foreground">No warnings</p>
          </CardContent>
        </Card>

        <Card 
          className={`hover:shadow-lg transition-shadow cursor-pointer ${isFlashlightOn ? "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200" : ""}`}
          onClick={handleFlashlightToggle}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flashlight</CardTitle>
            <Lightbulb className={`h-4 w-4 ${isFlashlightOn ? "text-yellow-500" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isFlashlightOn ? "ON" : "OFF"}</div>
            <p className="text-xs text-muted-foreground">Tap to toggle</p>
          </CardContent>
        </Card>
      </div>

      <WeatherWidget />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-2 border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Emergency SOS
            </CardTitle>
            <CardDescription>
              {isSOSActive 
                ? "Your emergency alert is active. Tap to deactivate."
                : "Activate in case of emergency. Your guardians will be notified immediately."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              size="lg"
              variant={isSOSActive ? "outline" : "destructive"}
              className={`w-full h-20 text-xl font-bold ${isSOSActive ? "animate-pulse" : ""}`}
              onClick={handleSOSToggle}
              data-testid="button-sos-toggle"
            >
              {isSOSActive ? (
                <>
                  <AlertCircle className="mr-2 w-6 h-6" />
                  STOP SOS
                </>
              ) : (
                <>
                  <Shield className="mr-2 w-6 h-6" />
                  ACTIVATE SOS
                </>
              )}
            </Button>
            {isSOSActive && activeAlert && (
              <div className="p-4 bg-destructive/10 rounded-lg space-y-2">
                <p className="text-sm font-medium text-destructive">SOS Active</p>
                <p className="text-xs text-muted-foreground">
                  Started: {new Date(activeAlert.createdAt).toLocaleTimeString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Guardians notified: {guardians.length} contacts
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Quick Access
            </CardTitle>
            <CardDescription>Important features and helplines</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/mybuddy")}
              data-testid="button-mybuddy"
            >
              <Heart className="mr-2 w-4 h-4" />
              Talk to MyBuddy Assistant
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/women-safety")}
              data-testid="button-women-safety"
            >
              <Shield className="mr-2 w-4 h-4" />
              Women Safety Hub
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => navigate("/complaint")}
              data-testid="button-complaint"
            >
              <AlertCircle className="mr-2 w-4 h-4" />
              File Police Complaint
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
