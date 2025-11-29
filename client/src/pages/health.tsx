import { useState, useEffect } from "react";
import { healthAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Activity, Heart, Thermometer, Plus, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";
import type { HealthVital, HealthAlert } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function HealthPage() {
  const { toast } = useToast();
  const [vitals, setVitals] = useState<HealthVital[]>([]);
  const [alerts, setAlerts] = useState<HealthAlert[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newVital, setNewVital] = useState({
    heartRate: "",
    bloodPressureSystolic: "",
    bloodPressureDiastolic: "",
    oxygenSaturation: "",
    temperature: "",
  });

  useEffect(() => {
    loadVitals();
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await healthAPI.getAlerts(20);
      setAlerts(data);
    } catch (error: any) {
      console.error("Error loading health alerts:", error);
    }
  };

  const loadVitals = async () => {
    try {
      const data = await healthAPI.getVitals(30);
      setVitals(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddVital = async () => {
    try {
      await healthAPI.addVital({
        heartRate: newVital.heartRate ? parseInt(newVital.heartRate) : undefined,
        bloodPressureSystolic: newVital.bloodPressureSystolic ? parseInt(newVital.bloodPressureSystolic) : undefined,
        bloodPressureDiastolic: newVital.bloodPressureDiastolic ? parseInt(newVital.bloodPressureDiastolic) : undefined,
        oxygenSaturation: newVital.oxygenSaturation ? parseInt(newVital.oxygenSaturation) : undefined,
        temperature: newVital.temperature ? parseFloat(newVital.temperature) : undefined,
        source: "manual",
      });
      
      await loadVitals();
      await loadAlerts();
      setIsAddDialogOpen(false);
      setNewVital({
        heartRate: "",
        bloodPressureSystolic: "",
        bloodPressureDiastolic: "",
        oxygenSaturation: "",
        temperature: "",
      });
      
      toast({
        title: "Vital Signs Recorded",
        description: "Your health data has been saved.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const latestVital = vitals[0];
  
  const chartData = vitals.slice(0, 10).reverse().map(v => ({
    time: new Date(v.recordedAt).toLocaleDateString(),
    hr: v.heartRate || 0,
    spo2: v.oxygenSaturation || 0,
  }));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Activity className="w-8 h-8" />
            Health Monitor
          </h2>
          <p className="text-muted-foreground">Track your vital signs and health metrics</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-vital">
              <Plus className="mr-2 w-4 h-4" />
              Add Vitals
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Record Vital Signs</DialogTitle>
              <DialogDescription>Enter your current health measurements</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-xs">
              <p className="font-semibold text-blue-900 dark:text-blue-100">📋 Normal Ranges (Reference):</p>
              <div className="grid grid-cols-2 gap-2 text-blue-800 dark:text-blue-200">
                <div>• Heart Rate: 60-100 bpm</div>
                <div>• BP: 120/80 mmHg</div>
                <div>• SpO2: 95-100%</div>
                <div>• Temp: 36.5-37.5°C</div>
              </div>
            </div>
            <div className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  placeholder="72"
                  value={newVital.heartRate}
                  onChange={(e) => setNewVital({ ...newVital, heartRate: e.target.value })}
                  data-testid="input-heart-rate"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="grid gap-2">
                  <Label htmlFor="systolic">Systolic BP</Label>
                  <Input
                    id="systolic"
                    type="number"
                    placeholder="120"
                    value={newVital.bloodPressureSystolic}
                    onChange={(e) => setNewVital({ ...newVital, bloodPressureSystolic: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="diastolic">Diastolic BP</Label>
                  <Input
                    id="diastolic"
                    type="number"
                    placeholder="80"
                    value={newVital.bloodPressureDiastolic}
                    onChange={(e) => setNewVital({ ...newVital, bloodPressureDiastolic: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="spo2">Oxygen Saturation (%)</Label>
                <Input
                  id="spo2"
                  type="number"
                  placeholder="98"
                  value={newVital.oxygenSaturation}
                  onChange={(e) => setNewVital({ ...newVital, oxygenSaturation: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="temp">Temperature (°C)</Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="37.0"
                  value={newVital.temperature}
                  onChange={(e) => setNewVital({ ...newVital, temperature: e.target.value })}
                />
              </div>
              <Button onClick={handleAddVital} className="w-full" data-testid="button-save-vital">
                Save Vital Signs
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Normal: 60-100</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestVital?.heartRate || "--"}</div>
            <p className="text-xs text-muted-foreground">bpm</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Normal: 120/80</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {latestVital?.bloodPressureSystolic || "--"}/{latestVital?.bloodPressureDiastolic || "--"}
            </div>
            <p className="text-xs text-muted-foreground">mmHg</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">SpO2</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Normal: 95-100</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestVital?.oxygenSaturation || "--"}</div>
            <p className="text-xs text-muted-foreground">%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Normal: 36.5-37.5</p>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestVital?.temperature?.toFixed(1) || "--"}</div>
            <p className="text-xs text-muted-foreground">°C</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="text-sm">📚 Understanding Your Vital Signs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">Heart Rate (60-100 bpm)</p>
            <p className="text-amber-800 dark:text-amber-200 text-xs">Measure: Count pulse for 60 seconds or check pulse on wrist/neck</p>
          </div>
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">Blood Pressure (120/80 mmHg)</p>
            <p className="text-amber-800 dark:text-amber-200 text-xs">Measure: Use a digital BP cuff or monitor. Top number is Systolic, bottom is Diastolic</p>
          </div>
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">Oxygen Saturation (95-100%)</p>
            <p className="text-amber-800 dark:text-amber-200 text-xs">Measure: Use a pulse oximeter on your finger - shows blood oxygen level</p>
          </div>
          <div>
            <p className="font-semibold text-amber-900 dark:text-amber-100">Temperature (36.5-37.5°C)</p>
            <p className="text-amber-800 dark:text-amber-200 text-xs">Measure: Use a digital thermometer under tongue, armpit, or forehead</p>
          </div>
          <div className="pt-2 border-t border-amber-200 dark:border-amber-900">
            <p className="text-amber-900 dark:text-amber-100"><strong>⚠️ Alert:</strong> If any value is significantly outside normal range, consult MyBuddy or contact your doctor.</p>
          </div>
        </CardContent>
      </Card>

      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-900 dark:text-red-100">
              <AlertTriangle className="w-5 h-5" />
              Health Alerts
            </CardTitle>
            <CardDescription className="text-red-800 dark:text-red-200">Abnormal readings detected and reported to guardians</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3 bg-white dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {alert.guardianNotificationsSent ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                      <p className="font-semibold text-red-900 dark:text-red-100">
                        {new Date(alert.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">
                      {alert.alertMessage}
                    </div>
                    {alert.guardianNotificationsSent && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-2">✅ Guardians notified via SMS</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {vitals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Health Trends
            </CardTitle>
            <CardDescription>Your vital signs over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="hr" stroke="#3b82f6" name="Heart Rate" />
                  <Line type="monotone" dataKey="spo2" stroke="#10b981" name="SpO2" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
