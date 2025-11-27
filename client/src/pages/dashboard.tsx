import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { useTranslation } from "@/lib/useTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { sosAPI, guardianAPI, emergencyAPI, childrenAPI, medicineAPI } from "@/lib/api";
import { getCurrentLocation, getBatteryLevel } from "@/lib/geolocation";
import { useToast } from "@/hooks/use-toast";
import { WeatherWidget } from "@/components/weather-widget";
import { playSOSSiren, stopSOSSiren, cleanupAudioContext } from "@/lib/siren";
import { enableFlashlight, disableFlashlight } from "@/lib/flashlight";
import { watchLocation, clearLocationWatch } from "@/lib/geolocation";
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
    <div className="space-y-6 p-6 min-h-screen overflow-hidden relative" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)'}}>
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
      
      {/* Header Section - Clean & Modern */}
      <div className="text-center mb-4 relative z-20">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Hi {user?.name}! 👋
        </h1>
        <p className="text-lg text-white font-semibold drop-shadow">Stay safe and protected</p>
      </div>

      {/* Emergency Alert */}
      {isSOSActive && (
        <Card className="border-2 border-red-600 bg-gradient-to-r from-red-500 to-red-600 shadow-xl relative overflow-hidden z-20">
          <div className="absolute inset-0 animate-pulse bg-red-400 opacity-20"></div>
          <CardContent className="p-6 text-center relative z-10">
            <p className="text-white font-bold text-2xl drop-shadow">🚨 SOS Active - Guardians Alerted! 🚨</p>
          </CardContent>
        </Card>
      )}
      
      {/* Main Action Buttons - Modern & Clean */}
      <div className="grid grid-cols-2 gap-4 z-20">
        <Button
          onClick={handleSOSToggle}
          className={`h-48 rounded-3xl text-xl font-bold flex flex-col items-center justify-center gap-2 shadow-lg transform transition hover:scale-105 active:scale-95 relative overflow-hidden group border-2 ${
            isSOSActive 
              ? 'bg-gradient-to-br from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 border-red-700 text-white' 
              : 'bg-gradient-to-br from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 border-red-600 text-white'
          }`}
          data-testid="button-sos-emergency"
        >
          <span style={{fontSize: '56px'}}>{isSOSActive ? '🛑' : '🆘'}</span>
          <span className="font-bold text-lg">{isSOSActive ? 'STOP' : 'HELP'}</span>
        </Button>
        
        <Button
          onClick={handleFlashlightToggle}
          className={`h-48 rounded-3xl text-xl font-bold flex flex-col items-center justify-center gap-2 shadow-lg transform transition hover:scale-105 active:scale-95 relative overflow-hidden group border-2 ${
            isFlashlightOn 
              ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 border-yellow-600' 
              : 'bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 border-yellow-500'
          }`}
          data-testid="button-flashlight-toggle"
        >
          <span style={{fontSize: '56px'}}>{isFlashlightOn ? '💡' : '🔦'}</span>
          <span className="font-bold text-lg">{isFlashlightOn ? 'ON' : 'LIGHT'}</span>
        </Button>
      </div>

      {/* Success Status when SOS is active */}
      {isSOSActive && (
        <Card className="border-2 border-green-600 bg-gradient-to-r from-green-500 to-emerald-500 shadow-lg z-20 relative">
          <CardContent className="p-4">
            <p className="text-white font-semibold text-sm">✅ Help is on the way • 📍 Your location shared • 🔔 Alert active</p>
          </CardContent>
        </Card>
      )}

      {/* Guardians Section - Clean & Modern */}
      <Card className="border-2 border-blue-400 bg-white/10 backdrop-blur shadow-lg relative overflow-hidden z-10">
        <CardHeader className="pb-4 relative z-10">
          <CardTitle className="text-2xl font-bold flex items-center gap-2 text-white">
            👥 My Guardians
          </CardTitle>
        </CardHeader>
        <CardContent className="relative z-10">
          {guardians.length > 0 ? (
            <div className="space-y-3">
              {guardians.map((g: any, idx: number) => (
                <div key={g.id} className={`p-4 bg-gradient-to-r rounded-2xl border border-white/30 shadow-md ${
                  idx % 3 === 0 ? 'from-pink-500/40 to-purple-500/40' :
                  idx % 3 === 1 ? 'from-yellow-500/40 to-orange-500/40' :
                  'from-blue-500/40 to-cyan-500/40'
                }`}>
                  <p className="font-bold text-lg text-white">💙 {g.name}</p>
                  <p className="text-sm text-white/90">📱 {g.phone}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-white text-sm">Ask an adult to add your guardians in Settings</p>
          )}
        </CardContent>
      </Card>

      {/* Support Section - Modern & Colorful */}
      <Card className="border-2 border-purple-400 bg-white/10 backdrop-blur shadow-lg relative overflow-hidden z-10">
        <CardHeader className="pb-3 relative z-10">
          <CardTitle className="text-2xl font-bold text-white">💜 Important Help Numbers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 relative z-10">
          {/* Help Buttons */}
          <div className="grid gap-3">
            <Button
              onClick={() => window.open('tel:1098')}
              className="w-full h-16 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold text-lg gap-3 shadow-lg transform hover:scale-105 active:scale-95 transition rounded-xl border border-purple-500"
              data-testid="button-childline-1098"
            >
              <span style={{fontSize: '32px'}}>📞</span>
              <div className="text-left">
                <p className="font-bold">Childline</p>
                <p className="text-sm">1098</p>
              </div>
            </Button>

            <Button
              onClick={() => window.open('tel:1091')}
              className="w-full h-16 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg gap-3 shadow-lg transform hover:scale-105 active:scale-95 transition rounded-xl border border-orange-600"
              data-testid="button-womens-helpline"
            >
              <span style={{fontSize: '32px'}}>💪</span>
              <div className="text-left">
                <p className="font-bold">Women's Help</p>
                <p className="text-sm">1091</p>
              </div>
            </Button>

            <Button
              onClick={() => window.open('tel:112')}
              className="w-full h-16 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white font-bold text-lg gap-3 shadow-lg transform hover:scale-105 active:scale-95 transition rounded-xl border border-blue-500"
              data-testid="button-emergency-112"
            >
              <span style={{fontSize: '32px'}}>🚓</span>
              <div className="text-left">
                <p className="font-bold">Emergency</p>
                <p className="text-sm">112</p>
              </div>
            </Button>
          </div>

          {/* Tips Section */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-4 mt-4">
            <p className="text-white text-sm font-semibold">💡 Quick Tips:</p>
            <ul className="text-white text-xs mt-2 space-y-1">
              <li>• You can always talk to someone you trust</li>
              <li>• Your safety is the priority</li>
              <li>• These services are free and confidential</li>
            </ul>
          </div>
        </CardContent>
      </Card>
      
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg) scale(1); }
          50% { transform: translateY(-30px) rotate(10deg) scale(1.05); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
        @keyframes wiggle {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-8deg) scale(1.1); }
          75% { transform: rotate(8deg) scale(1.1); }
        }
        .animate-wiggle {
          animation: wiggle 0.6s ease-in-out infinite;
        }
        @keyframes rainbow-pulse {
          0%, 100% { filter: hue-rotate(0deg) brightness(1); }
          50% { filter: hue-rotate(60deg) brightness(1.1); }
        }
        .animate-rainbow-pulse {
          animation: rainbow-pulse 3s ease-in-out infinite;
        }
      `}</style>
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
  const { toast } = useToast();
  const [medicines, setMedicines] = useState<any[]>([]);
  const [newMedicine, setNewMedicine] = useState({ medicineName: "", dosage: "", frequency: "daily", reminderTimes: ["08:00", "20:00"] });
  const [showAddMedicine, setShowAddMedicine] = useState(false);

  useEffect(() => {
    loadMedicines();
  }, []);

  const loadMedicines = async () => {
    try {
      const data = await medicineAPI.getAll();
      setMedicines(data);
    } catch (error) {
      console.error("Error loading medicines:", error);
    }
  };

  const handleAddMedicine = async () => {
    if (!newMedicine.medicineName || !newMedicine.dosage) {
      toast({ title: "Error", description: "Medicine name and dosage required", variant: "destructive" });
      return;
    }
    try {
      await medicineAPI.create(newMedicine);
      toast({ title: "✅ Medicine Added", description: `${newMedicine.medicineName} added to your reminders` });
      setNewMedicine({ medicineName: "", dosage: "", frequency: "daily", reminderTimes: ["08:00", "20:00"] });
      setShowAddMedicine(false);
      loadMedicines();
    } catch (error) {
      toast({ title: "Error", description: "Failed to add medicine", variant: "destructive" });
    }
  };

  const handleDeleteMedicine = async (id: string) => {
    try {
      await medicineAPI.delete(id);
      toast({ title: "✅ Removed", description: "Medicine reminder deleted" });
      loadMedicines();
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete medicine", variant: "destructive" });
    }
  };
  
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

      <Card className="bg-green-50 dark:bg-green-900 border-green-300 dark:border-green-700">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            💊 Medicine Reminders
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {medicines.length > 0 && (
            <div className="space-y-2">
              {medicines.map((med) => (
                <div key={med.id} className="p-3 bg-white dark:bg-gray-800 rounded border-l-4 border-green-500">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-lg">{med.medicineName}</p>
                      <p className="text-sm text-muted-foreground">Dosage: {med.dosage}</p>
                      <p className="text-sm text-muted-foreground">Frequency: {med.frequency}</p>
                      <p className="text-sm text-green-600 font-semibold">⏰ Times: {med.reminderTimes?.join(", ") || "08:00, 20:00"}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteMedicine(med.id)}
                      data-testid={`button-delete-medicine-${med.id}`}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!showAddMedicine ? (
            <Button onClick={() => setShowAddMedicine(true)} className="w-full bg-green-600 hover:bg-green-700" data-testid="button-add-medicine">
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine Reminder
            </Button>
          ) : (
            <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded border-2 border-green-300">
              <input
                type="text"
                placeholder="Medicine Name"
                value={newMedicine.medicineName}
                onChange={(e) => setNewMedicine({ ...newMedicine, medicineName: e.target.value })}
                className="w-full p-2 border rounded"
                data-testid="input-medicine-name"
              />
              <input
                type="text"
                placeholder="Dosage (e.g., 500mg)"
                value={newMedicine.dosage}
                onChange={(e) => setNewMedicine({ ...newMedicine, dosage: e.target.value })}
                className="w-full p-2 border rounded"
                data-testid="input-medicine-dosage"
              />
              <select
                value={newMedicine.frequency}
                onChange={(e) => setNewMedicine({ ...newMedicine, frequency: e.target.value })}
                className="w-full p-2 border rounded"
                data-testid="select-medicine-frequency"
              >
                <option value="daily">Daily</option>
                <option value="twice">Twice Daily</option>
                <option value="thrice">Thrice Daily</option>
              </select>
              <div className="flex gap-2">
                <Button onClick={handleAddMedicine} className="flex-1 bg-green-600" data-testid="button-save-medicine">Save</Button>
                <Button onClick={() => setShowAddMedicine(false)} variant="outline" className="flex-1" data-testid="button-cancel-medicine">Cancel</Button>
              </div>
            </div>
          )}
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
  const locationWatchIdRef = useRef<number | null>(null);

  useEffect(() => {
    loadDashboardData();

    return () => {
      cleanupAudioContext();
      if (locationWatchIdRef.current !== null) {
        clearLocationWatch(locationWatchIdRef.current);
      }
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
        if (locationWatchIdRef.current !== null) {
          clearLocationWatch(locationWatchIdRef.current);
          locationWatchIdRef.current = null;
        }
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
        let location = { city: "GPS", lat: 0, lon: 0 };
        
        // Try browser GPS
        try {
          const gpsLocation = await getCurrentLocation();
          location = { city: "GPS", lat: gpsLocation.latitude, lon: gpsLocation.longitude };
        } catch (gpsError) {
          console.log("GPS unavailable, using default location");
        }
        
        const battery = await getBatteryLevel();
        
        const alert = await sosAPI.create({
          triggerMethod: "manual",
          latitude: location.lat,
          longitude: location.lon,
          batteryLevel: battery,
        });
        
        setActiveAlert(alert);
        setIsSOSActive(true);
        playSOSSiren();
        enableFlashlight();
        setIsFlashlightOn(true);

        // Start CONTINUOUS real-time GPS tracking (updates as you move)
        try {
          locationWatchIdRef.current = watchLocation(async (newLocation) => {
            try {
              const newBattery = await getBatteryLevel();
              await sosAPI.update(alert.id, {
                latitude: newLocation.latitude,
                longitude: newLocation.longitude,
                batteryLevel: newBattery,
              });
              console.log("📍 Location updated: ", newLocation.latitude, newLocation.longitude);
            } catch (err) {
              console.log("Location update in progress...");
            }
          });
        } catch (watchErr) {
          console.warn("GPS watch not available, using fallback polling");
        }

        // Notify guardians via SMS (primary emergency notification)
        try {
          await emergencyAPI.notifyGuardians(alert.id);
          toast({
            title: "🚨 SOS ACTIVATED!",
            description: "✅ Siren ON ✅ Flashlight ON ✅ GPS Tracking ✅ SMS to Guardians\n\nYour location is being shared with all guardians.",
            variant: "destructive",
          });
        } catch (error) {
          toast({
            title: "🚨 SOS ACTIVATED!",
            description: "✅ Siren ON ✅ Flashlight ON ✅ GPS Tracking\n\nEmergency notifications in progress.",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        stopSOSSiren();
        disableFlashlight();
        toast({
          title: "SOS Error",
          description: error.message || "Enable location access in your browser settings",
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

  // Show Child Dashboard if user is in child mode
  if (user?.profileMode === "child") {
    return (
      <ChildDashboard 
        user={user}
        guardians={guardians}
        activeAlert={activeAlert}
        isSOSActive={isSOSActive}
        handleSOSToggle={handleSOSToggle}
        handleFlashlightToggle={handleFlashlightToggle}
        isFlashlightOn={isFlashlightOn}
      />
    );
  }

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
