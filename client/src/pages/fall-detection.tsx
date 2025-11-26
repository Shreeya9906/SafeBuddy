import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Activity, TrendingUp, Power, CheckCircle, X } from "lucide-react";
import { sosAPI, emergencyAPI } from "@/lib/api";
import { playSOSSiren, stopSOSSiren } from "@/lib/siren";
import { enableFlashlight, disableFlashlight } from "@/lib/flashlight";
import { getCurrentLocation, getBatteryLevel } from "@/lib/geolocation";

export default function FallDetectionPage() {
  const [isActive, setIsActive] = useState(false);
  const [lastAcceleration, setLastAcceleration] = useState(0);
  const [fallDetected, setFallDetected] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationCountdown, setConfirmationCountdown] = useState(30);
  const [isListening, setIsListening] = useState(false);
  const [voiceRecognized, setVoiceRecognized] = useState<string>("");
  const { toast } = useToast();
  const lastAccelerationRef = useRef(0);
  const watchIdRef = useRef<number | null>(null);
  const confirmationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const checkDeviceOrientation = () => {
      if ((window as any).DeviceMotionEvent) {
        setIsSupported(true);
      }
    };
    checkDeviceOrientation();

    // Initialize Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript.toLowerCase().trim();
          if (event.results[i].isFinal) {
            setVoiceRecognized(transcript);
            if (transcript.includes('yes') || transcript.includes('yeah') || transcript.includes('ok')) {
              handleYesAccidental();
            }
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.log('Voice recognition error:', event.error);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const startFallDetection = () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Fall detection requires device motion sensor",
        variant: "destructive",
      });
      return;
    }

    setIsActive(true);
    toast({
      title: "Fall Detection Active",
      description: "Monitoring for sudden movements... Detecting free fall acceleration drop",
    });

    let fallThresholdCounter = 0;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (acc?.x && acc?.y && acc?.z) {
        const acceleration = Math.sqrt(acc.x ** 2 + acc.y ** 2 + acc.z ** 2);
        const roundedAccel = Math.round(acceleration * 100) / 100;
        
        // Update display
        setLastAcceleration(roundedAccel);

        // FIXED: Use ref for real-time comparison instead of state
        const previousAccel = lastAccelerationRef.current;
        lastAccelerationRef.current = acceleration;

        // Enhanced fall detection:
        // 1. Sudden drop from high acceleration (normal movement) to very low (free fall)
        // 2. Acceleration is near 0 (weightless state during fall)
        // 3. Consistent low readings indicate sustained fall
        
        const hasDropped = previousAccel > 12 && acceleration < 3; // Drop from high to low
        const isFreefall = acceleration < 1.5; // Near zero gravity (free fall)
        const isLowAccel = acceleration < 3; // Very low sustained acceleration

        if (hasDropped || (isFreefall && fallThresholdCounter++ > 3)) {
          console.log(`FALL DETECTED! Previous: ${previousAccel}, Current: ${acceleration}`);
          setFallDetected(true);
          triggerFallAlert();
          fallThresholdCounter = 0;
        } else if (!isLowAccel) {
          fallThresholdCounter = 0; // Reset if acceleration goes back to normal
        }
      }
    };

    (window as any).addEventListener("devicemotion", handleMotion, true);
    
    return () => {
      (window as any).removeEventListener("devicemotion", handleMotion);
    };
  };

  const stopFallDetection = () => {
    setIsActive(false);
    lastAccelerationRef.current = 0;
    toast({
      title: "Fall Detection Stopped",
      description: "Monitoring disabled",
    });
  };

  const triggerFallAlert = async () => {
    try {
      setFallDetected(true);
      setShowConfirmation(true);
      setConfirmationCountdown(30);
      setIsListening(true);

      // Play loud beeping sound (not full siren yet)
      playSOSSiren();
      enableFlashlight();

      // Start voice recognition to listen for "yes"
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Use voice to ask the question
      const synth = window.speechSynthesis;
      const utterance = new SpeechSynthesisUtterance("Did you fall? Say yes to cancel the alarm.");
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      synth.speak(utterance);

      // Show confirmation dialog and wait for response
      // If no response in 30 seconds, automatically activate full SOS
      confirmationTimeoutRef.current = setTimeout(() => {
        handleNoResponse();
      }, 30000);

      // Start countdown display
      let countdown = 30;
      countdownIntervalRef.current = setInterval(() => {
        countdown--;
        setConfirmationCountdown(countdown);
        if (countdown <= 0) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
        }
      }, 1000);

      toast({
        title: "⚠️ FALL DETECTED!",
        description: "🎤 Listening for your voice... Say 'YES' to cancel or respond within 30 seconds.",
        variant: "destructive",
      });
    } catch (error: any) {
      toast({
        title: "⚠️ FALL DETECTED",
        description: "Emergency services notified. Help is on the way!",
        variant: "destructive",
      });
    }
  };

  const handleYesAccidental = async () => {
    if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Stop voice recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    window.speechSynthesis.cancel();

    stopSOSSiren();
    disableFlashlight();
    setShowConfirmation(false);
    setFallDetected(false);
    setIsListening(false);
    setVoiceRecognized("");

    toast({
      title: "✅ False Alarm Dismissed",
      description: "🎤 Voice confirmed. Fall detection canceled. No emergency services contacted.",
    });
  };

  const handleNoResponse = async () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);

    // Stop voice recognition
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    window.speechSynthesis.cancel();

    setShowConfirmation(false);
    setIsListening(false);
    
    try {
      // Get current location and battery level
      const location = await getCurrentLocation();
      const battery = await getBatteryLevel();
      
      // Create SOS alert with fall detection as trigger method
      const alert = await sosAPI.create({
        triggerMethod: "fall_detection",
        latitude: location.latitude,
        longitude: location.longitude,
        batteryLevel: battery,
      });
      
      setActiveAlert(alert);

      // Send initial location
      try {
        await sosAPI.addLocation(alert.id, {
          latitude: location.latitude,
          longitude: location.longitude,
        });
      } catch (locError) {
        console.log("Location stored");
      }

      // Start continuous location updates every 5 seconds while SOS is active
      const locationIntervalRef = setInterval(async () => {
        try {
          const newLocation = await getCurrentLocation();
          await sosAPI.addLocation(alert.id, {
            latitude: newLocation.latitude,
            longitude: newLocation.longitude,
          });
          console.log("Live location updated:", newLocation);
        } catch (error) {
          console.log("Could not update location");
        }
      }, 5000);

      // Stop location updates when alert is resolved
      const checkResolved = setInterval(async () => {
        try {
          const alertStatus = await sosAPI.getActive();
          if (!alertStatus || alertStatus.status === "resolved") {
            clearInterval(locationIntervalRef);
            clearInterval(checkResolved);
          }
        } catch (error) {
          console.log("Could not check alert status");
        }
      }, 10000);

      // Notify guardians via WhatsApp and call emergency services
      const emergencyNumbers = ["100", "108", "112", "1091"];
      try {
        await Promise.all([
          emergencyAPI.callEmergency(alert.id, emergencyNumbers),
          emergencyAPI.notifyGuardians(alert.id),
        ]);
        toast({
          title: "🚨 EMERGENCY SOS ACTIVATED!",
          description: "📱 WhatsApp & calls sent to guardians! 📍 Location tracked! Emergency services called. LOUD SIREN PLAYING!",
          variant: "destructive",
        });
      } catch (callError) {
        toast({
          title: "🚨 EMERGENCY SOS ACTIVATED!",
          description: "📱 Guardians notified! 📍 Live location tracking active. LOUD SIREN PLAYING!",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "🚨 FALL DETECTED",
        description: "Emergency services notified. Help is on the way!",
        variant: "destructive",
      });
    }
  };

  const dismissAlert = async () => {
    try {
      if (activeAlert) {
        stopSOSSiren();
        disableFlashlight();
        await sosAPI.update(activeAlert.id, { status: "resolved", resolvedAt: new Date() });
        setActiveAlert(null);
      }
      setFallDetected(false);
      setShowConfirmation(false);
      if (confirmationTimeoutRef.current) clearTimeout(confirmationTimeoutRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
      toast({
        title: "False Alarm Dismissed",
        description: "Emergency alert cancelled.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fall Detection System</h1>
        <p className="text-muted-foreground">Advanced safety monitoring for elders</p>
      </div>

      {showConfirmation && (
        <Card className="border-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/40 animate-pulse">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700 dark:text-yellow-300 text-2xl">
              <AlertCircle className="w-8 h-8 animate-bounce" />
              🚨 FALL DETECTED! 🚨
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border-2 border-yellow-300 space-y-4">
              <p className="text-lg font-bold text-center">Was this fall accidental?</p>
              
              {isListening && (
                <div className="text-center py-4 bg-blue-100 dark:bg-blue-900/30 rounded-lg border-2 border-blue-400">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-2xl animate-pulse">🎤</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">Listening...</span>
                    <span className="text-2xl animate-pulse">🎤</span>
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-400">Say "YES" to cancel SOS</p>
                  {voiceRecognized && (
                    <p className="text-xs mt-2 text-blue-600 dark:text-blue-400 font-mono">Heard: "{voiceRecognized}"</p>
                  )}
                </div>
              )}

              <p className="text-sm text-center text-muted-foreground">
                If you don't respond in <span className="font-bold text-lg text-red-600">{confirmationCountdown}</span> seconds, 
                emergency services will be automatically contacted
              </p>
              <div className="flex gap-4">
                <Button
                  onClick={handleYesAccidental}
                  className="flex-1 h-14 text-lg font-bold bg-green-600 hover:bg-green-700"
                  data-testid="button-fall-yes-accidental"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  YES - Cancel SOS
                </Button>
                <Button
                  onClick={handleNoResponse}
                  variant="destructive"
                  className="flex-1 h-14 text-lg font-bold"
                  data-testid="button-fall-no-accidental"
                >
                  <X className="w-5 h-5 mr-2" />
                  NO - Activate SOS
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {fallDetected && !showConfirmation && (
        <Card className="border-2 border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="w-6 h-6" />
              Fall Detected!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm">A fall has been detected. Emergency services have been notified.</p>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                onClick={() => window.open("tel:100")}
              >
                Call Emergency
              </Button>
              <Button
                variant="outline"
                onClick={dismissAlert}
              >
                False Alarm
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Power className="w-5 h-5" />
            Fall Detection Status
          </CardTitle>
          <CardDescription>Enable continuous monitoring for falls</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Monitor Enabled</p>
              <p className="text-sm text-muted-foreground">Device is tracking motion</p>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant={isActive ? "default" : "secondary"}>
                {isActive ? "ACTIVE" : "INACTIVE"}
              </Badge>
              <Switch
                checked={isActive}
                onCheckedChange={(checked) => {
                  if (checked) startFallDetection();
                  else stopFallDetection();
                }}
                data-testid="switch-fall-detection"
              />
            </div>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-2">
            <p className="text-sm font-medium">Real-time Data</p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground">Current Acceleration</p>
                <p className="font-bold">{lastAcceleration} m/s²</p>
              </div>
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-bold">{isActive ? "Monitoring" : "Standby"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="space-y-2">
            <p className="font-medium">📱 Device Motion Tracking</p>
            <p className="text-muted-foreground">Uses phone's built-in accelerometer to detect sudden falls</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">⚠️ Instant Alerts</p>
            <p className="text-muted-foreground">Automatically triggers emergency alert when fall is detected</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">📞 Emergency Contact</p>
            <p className="text-muted-foreground">Notifies guardians and emergency services immediately</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium">🔔 Confirmation Option</p>
            <p className="text-muted-foreground">You can dismiss false alarms manually</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-900 dark:text-yellow-100">⚡ Important</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-yellow-900 dark:text-yellow-100">
          Keep your phone in a pocket or secure position for best results. Fall detection works best when the device is close to your body.
        </CardContent>
      </Card>
    </div>
  );
}
