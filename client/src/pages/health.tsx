import { useState, useEffect } from "react";
import { healthAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Activity, Heart, Thermometer, Plus, TrendingUp } from "lucide-react";
import type { HealthVital } from "@shared/schema";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function HealthPage() {
  const { toast } = useToast();
  const [vitals, setVitals] = useState<HealthVital[]>([]);
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
  }, []);

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
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestVital?.heartRate || "--"}</div>
            <p className="text-xs text-muted-foreground">bpm</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
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
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestVital?.oxygenSaturation || "--"}</div>
            <p className="text-xs text-muted-foreground">%</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Temperature</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{latestVital?.temperature?.toFixed(1) || "--"}</div>
            <p className="text-xs text-muted-foreground">°C</p>
          </CardContent>
        </Card>
      </div>

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
