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
  HelpCircle,
} from "lucide-react";
import type { SOSAlert, Guardian } from "@shared/schema";

function ChildDashboard({ user, guardians, activeAlert, isSOSActive, handleSOSToggle, handleFlashlightToggle, isFlashlightOn }: any) {
  return (
    <div className="space-y-4 p-4 bg-gradient-to-b from-purple-100/50 dark:from-purple-900/20 to-pink-100/50 dark:to-pink-900/20 min-h-screen">
      <div className="text-center mb-4">
        <div className="text-6xl mb-2 animate-bounce">👋✨</div>
        <h1 className="text-5xl font-black bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
          Hi {user?.name}!
        </h1>
        <p className="text-xl font-bold text-purple-700 dark:text-purple-300">🛡️ You Are Safe! 🛡️</p>
        <p className="text-sm text-muted-foreground">One tap = help is on the way!</p>
      </div>

      {isSOSActive && (
        <Card className="border-4 border-red-500 bg-gradient-to-r from-red-400 to-orange-400 shadow-2xl animate-pulse">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <span className="text-4xl animate-bounce">🚨</span>
              <span className="text-white font-black text-2xl">SIREN IS PLAYING!</span>
              <span className="text-4xl animate-bounce" style={{animationDelay: '0.2s'}}>🚨</span>
            </div>
            <p className="text-white font-bold text-base">✅ Your guardians know you need help!</p>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={handleSOSToggle}
          className={`h-48 rounded-3xl text-2xl font-black flex flex-col items-center justify-center gap-3 shadow-2xl transform transition hover:scale-105 ${
            isSOSActive 
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800' 
              : 'bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600'
          }`}
          data-testid="button-sos-emergency"
        >
          <span className="text-5xl">{isSOSActive ? '🛑' : '🆘'}</span>
          <span>{isSOSActive ? 'STOP\nSOS' : 'CALL\nSOS'}</span>
        </Button>
        
        <Button
          onClick={handleFlashlightToggle}
          className={`h-48 rounded-3xl text-2xl font-black flex flex-col items-center justify-center gap-3 shadow-2xl transform transition hover:scale-105 ${
            isFlashlightOn 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600' 
              : 'bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500'
          }`}
          data-testid="button-flashlight-toggle"
        >
          <span className="text-5xl">{isFlashlightOn ? '💡' : '🔦'}</span>
          Light
        </Button>
      </div>

      {isSOSActive && (
        <Card className="border-4 border-green-500 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/50 dark:to-emerald-900/50">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl animate-pulse">✅</span>
              <span className="text-green-700 dark:text-green-300 font-black text-lg">✨ HELP IS COMING! ✨</span>
            </div>
            <Button
              onClick={handleSOSToggle}
              className="bg-green-600 hover:bg-green-700 font-black"
              size="sm"
            >
              Stop
            </Button>
          </CardContent>
        </Card>
      )}

      <Card className="border-4 border-blue-400 bg-gradient-to-br from-blue-100/80 to-cyan-100/80 dark:from-blue-900/40 dark:to-cyan-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-black flex items-center gap-3">
            <span className="text-3xl">👥</span>
            My Guardians
          </CardTitle>
          <CardDescription className="text-base font-bold text-blue-700 dark:text-blue-300">People who love & protect you!</CardDescription>
        </CardHeader>
        <CardContent>
          {guardians.length > 0 ? (
            <div className="space-y-3">
              {guardians.map((g: Guardian) => (
                <div key={g.id} className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/50 dark:to-cyan-900/50 rounded-2xl border-3 border-blue-300 dark:border-blue-600 shadow-md transform hover:scale-105 transition">
                  <p className="font-black text-lg text-blue-900 dark:text-blue-100">💙 {g.name}</p>
                  <p className="text-sm font-bold text-blue-700 dark:text-blue-300">📱 {g.phone}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <div className="text-4xl mb-2">🤔</div>
              <p className="text-sm font-bold text-blue-700 dark:text-blue-300">Ask an adult to add your guardians!</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-4 border-purple-400 bg-gradient-to-br from-purple-100/80 to-pink-100/80 dark:from-purple-900/40 dark:to-pink-900/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-2xl font-black flex items-center gap-3 text-purple-700 dark:text-purple-300">
            <span className="text-3xl">💜</span>
            Need Help?
          </CardTitle>
          <CardDescription className="text-base font-bold text-purple-700 dark:text-purple-300">You're never alone. We're here for you!</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border-3 border-purple-300 dark:border-purple-600">
            <p className="text-sm font-bold text-foreground mb-3">If something feels wrong or unsafe:</p>
            <ul className="text-sm space-y-2 font-bold">
              <li className="flex items-center gap-2"><span className="text-xl">😊</span> You can talk to someone</li>
              <li className="flex items-center gap-2"><span className="text-xl">🙏</span> You can ask for help</li>
              <li className="flex items-center gap-2"><span className="text-xl">🤐</span> Your secret is safe with them</li>
              <li className="flex items-center gap-2"><span className="text-xl">⭐</span> It's 100% FREE</li>
            </ul>
          </div>
          
          <div className="grid gap-3">
            <Button
              onClick={() => window.open('tel:1098')}
              className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-black text-base gap-3 shadow-lg transform hover:scale-105 transition"
              data-testid="button-childline-1098"
            >
              <span className="text-2xl">📞</span>
              Childline India: 1098
            </Button>

            <Button
              onClick={() => window.open('tel:1091')}
              className="w-full h-16 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-black text-base gap-3 shadow-lg transform hover:scale-105 transition"
              data-testid="button-womens-helpline"
            >
              <span className="text-2xl">💪</span>
              Women's Helpline: 1091
            </Button>

            <Button
              onClick={() => window.open('tel:112')}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-black text-base gap-3 shadow-lg transform hover:scale-105 transition"
              data-testid="button-emergency-112"
            >
              <span className="text-2xl">🚓</span>
              Emergency: 112
            </Button>
          </div>

          <p className="text-base text-center font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            ✨ You are brave & strong! ✨
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function AdultDashboard({ user, guardians, activeAlert, isSOSActive, handleSOSToggle, handleFlashlightToggle, isFlashlightOn }: any) {
  const [, navigate] = useLocation();
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
          <CardDescription>⚠️ MUST BE ENABLED ON FALL DETECTION PAGE</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm font-medium text-orange-700 dark:text-orange-300">🔔 Fall detection requires device motion sensors and must be explicitly enabled to work. When a fall is detected, it automatically:</p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Plays emergency siren at maximum volume</li>
            <li>Turns on flashlight</li>
            <li>Calls emergency services (100, 108, 112, 1091)</li>
            <li>Notifies all guardians via SMS</li>
          </ul>
          <Button 
            onClick={() => navigate("/fall-detection")}
            className="w-full h-12 text-base font-bold gap-2 bg-orange-600 hover:bg-orange-700"
            data-testid="button-enable-fall-detection"
          >
            <Activity className="w-5 h-5" />
            Go to Fall Detection Page
          </Button>
          <p className="text-xs text-center text-orange-600 dark:text-orange-400 font-semibold">👉 Toggle switch ON to start monitoring</p>
        </CardContent>
      </Card>
    </div>
  );
}

function ElderDashboard({ user, guardians, activeAlert, isSOSActive, handleSOSToggle, handleFlashlightToggle, isFlashlightOn }: any) {
  const [, navigate] = useLocation();
  
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Welcome {user?.name}!</h1>
        <p className="text-lg text-muted-foreground">Your safety is our priority</p>
      </div>

      <Card className="border-orange-500 border-4 bg-orange-50 dark:bg-orange-950/30">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2 text-orange-700">
            <AlertCircle className="w-6 h-6" />
            🚨 ENABLE FALL DETECTION
          </CardTitle>
          <CardDescription className="text-base">Automatic protection during falls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm font-medium">When enabled, your phone automatically detects if you fall and:</p>
          <ul className="text-sm space-y-1 list-disc list-inside">
            <li>Plays loud emergency siren</li>
            <li>Turns on flashlight</li>
            <li>Calls emergency services</li>
            <li>Notifies caregivers</li>
          </ul>
          <Button 
            onClick={() => navigate("/fall-detection")}
            className="w-full h-14 text-lg font-bold bg-orange-600 hover:bg-orange-700"
            data-testid="button-elder-fall-detection"
          >
            <Activity className="w-5 h-5 mr-2" />
            Enable Fall Detection NOW
          </Button>
        </CardContent>
      </Card>

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
        disableFlashlight();
        setIsFlashlightOn(false);
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
        enableFlashlight();
        setIsFlashlightOn(true);

        // Notify guardians via SMS and emergency services
        const emergencyNumbers = ["100", "108", "112", "1091"];
        try {
          await Promise.all([
            emergencyAPI.callEmergency(alert.id, emergencyNumbers),
            emergencyAPI.notifyGuardians(alert.id),
          ]);
          toast({
            title: "SOS Activated!",
            description: "💡 Flashlight ON 🚨 Siren playing. SMS sent to guardians & emergency services called.",
            variant: "destructive",
          });
        } catch (callError) {
          toast({
            title: "SOS Activated!",
            description: "💡 Flashlight ON 🚨 Siren playing. Emergency alert sent to guardians.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        stopSOSSiren();
        disableFlashlight();
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
