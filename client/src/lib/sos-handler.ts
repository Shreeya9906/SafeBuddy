import { sosAPI, emergencyAPI, trackingAPI } from "./api";
import { playSOSSiren, stopSOSSiren } from "./siren";
import { enableFlashlight, disableFlashlight } from "./flashlight";
import { getCurrentLocation, getBatteryLevel } from "./geolocation";

export interface SOSState {
  isActive: boolean;
  sosId: string | null;
  locationWatchId: number | null;
  myBuddyIntervalId: number | null;
  retryAttempts: number;
}

let sosState: SOSState = {
  isActive: false,
  sosId: null,
  locationWatchId: null,
  myBuddyIntervalId: null,
  retryAttempts: 0,
};

// Stream GPS location every 5 seconds
async function startLocationStreaming(sosId: string) {
  if (sosState.locationWatchId !== null) return;

  const streamLocation = async () => {
    try {
      const location = await getCurrentLocation();
      const battery = await getBatteryLevel();

      if (location) {
        await sosAPI.addLocation(sosId, {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          batteryLevel: battery || 100,
        });

        // Also update live tracking location
        await trackingAPI.updateLiveLocation(
          location.latitude,
          location.longitude,
          `Live Location - ${new Date().toLocaleTimeString()}`
        );

        console.log(`📍 Location updated: ${location.latitude}, ${location.longitude}`);
      }
    } catch (error) {
      console.error("Location streaming error:", error);
    }
  };

  // Stream immediately and then every 5 seconds
  await streamLocation();
  const interval = window.setInterval(streamLocation, 5000);
  sosState.locationWatchId = interval;
}

// Start MyBuddy support messages every 2 minutes
async function startMyBuddyMessages() {
  if (sosState.myBuddyIntervalId !== null) return;

  const messages = [
    "Help is on the way. Stay calm.",
    "Your guardians have been notified.",
    "Emergency services are being contacted.",
    "Hold tight, someone will help you soon.",
    "You're not alone. Help is coming.",
  ];

  let messageIndex = 0;

  // Send first message immediately
  const sendMessage = async () => {
    try {
      const message = messages[messageIndex % messages.length];
      // Use browser's speech synthesis for emergency TTS
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 1;
        utterance.volume = 1;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
      console.log(`🤖 MyBuddy: ${message}`);
      messageIndex++;
    } catch (error) {
      console.error("MyBuddy message error:", error);
    }
  };

  await sendMessage();
  const interval = window.setInterval(sendMessage, 120000); // Every 2 minutes
  sosState.myBuddyIntervalId = interval;
}

// Auto-call emergency numbers (opens dial links for web)
async function triggerEmergencyCalls(sosId: string) {
  try {
    await emergencyAPI.callEmergency(sosId, ["112", "100", "108", "1091"]);

    // For web: provide dial links
    setTimeout(() => {
      console.log("📞 Opening emergency dialer...");
      window.open("tel:112");
    }, 500);

    setTimeout(() => {
      console.log("📞 Queuing police call...");
      window.open("tel:100");
    }, 8000);

    console.log("✅ Emergency calls initiated");
  } catch (error) {
    console.error("Emergency call error:", error);
  }
}

// Send SMS to all guardians (fallback to SMS protocol)
async function sendSMSToGuardians(sosId: string) {
  try {
    const response = await fetch(`/api/sos/${sosId}/send-sms`, { 
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    const data = await response.json();
    console.log("📱 SMS data received:", data);

    if (data.smsData && data.smsData.length > 0) {
      // Open SMS app for each guardian with pre-filled message
      data.smsData.forEach((sms: any, index: number) => {
        setTimeout(() => {
          const encodedMessage = encodeURIComponent(sms.message);
          const smsLink = `sms:${sms.phone}?body=${encodedMessage}`;
          console.log(`📤 Opening SMS link for ${sms.name}: ${sms.phone}`);
          // This will open the default SMS app on mobile, or show options on desktop
          window.open(smsLink);
        }, index * 1000); // Stagger the SMS opens
      });
    }
    return data;
  } catch (error) {
    console.error("SMS sending error:", error);
  }
}

// Notify all guardians via Firebase push
async function notifyAllGuardians(sosId: string) {
  try {
    const response = await emergencyAPI.notifyGuardians(sosId);
    console.log("✅ Guardians notified via Firebase:", response);
    
    // ALSO send SMS (fallback mechanism)
    if (response.smsData) {
      console.log("📱 Initiating SMS notifications...");
      response.smsData.forEach((sms: any, index: number) => {
        setTimeout(() => {
          const encodedMessage = encodeURIComponent(sms.message);
          const smsLink = `sms:${sms.phone}?body=${encodedMessage}`;
          console.log(`📤 Sending SMS to ${sms.phone}`);
          window.open(smsLink, "_self");
        }, index * 1500);
      });
    }
    
    return response;
  } catch (error) {
    console.error("Guardian notification error:", error);
    // Retry after 10 seconds
    setTimeout(() => notifyAllGuardians(sosId), 10000);
  }
}

// Main SOS activation handler
export async function activateSOS(): Promise<{ success: boolean; sosId?: string; message: string }> {
  try {
    if (sosState.isActive) {
      return { success: false, message: "SOS already active" };
    }

    console.log("🚨 ACTIVATING SOS EMERGENCY SYSTEM...");

    // Get current location
    const location = await getCurrentLocation();
    if (!location) {
      return { success: false, message: "Unable to get location. Please enable GPS." };
    }

    const battery = await getBatteryLevel();

    // Create SOS alert in database
    const sosAlert = await sosAPI.create({
      triggerMethod: "manual",
      latitude: location.latitude,
      longitude: location.longitude,
      address: `Emergency Location - ${new Date().toLocaleTimeString()}`,
      batteryLevel: battery || 100,
    });

    sosState.isActive = true;
    sosState.sosId = sosAlert.id;
    sosState.retryAttempts = 0;

    console.log("✅ SOS Alert created:", sosAlert.id);

    // PARALLEL ACTIVATION OF ALL SYSTEMS
    Promise.all([
      // 1. Start loud siren (loops forever)
      playSOSSiren(),

      // 2. Enable flashlight (immediate)
      enableFlashlight(),

      // 3. Start GPS location streaming every 5 seconds
      startLocationStreaming(sosAlert.id),

      // 4. Start MyBuddy support messages every 2 minutes
      startMyBuddyMessages(),

      // 5. Notify all guardians via Firebase + SMS
      notifyAllGuardians(sosAlert.id),

      // 6. Trigger emergency calls
      triggerEmergencyCalls(sosAlert.id),

      // 7. Send SMS as backup
      sendSMSToGuardians(sosAlert.id),
    ]).catch((error) => {
      console.error("Error in parallel SOS operations:", error);
    });

    return {
      success: true,
      sosId: sosAlert.id,
      message: "🚨 SOS ACTIVATED! Siren, flashlight, GPS, and guardians notified!",
    };
  } catch (error: any) {
    console.error("SOS activation error:", error);
    return { success: false, message: error.message || "Failed to activate SOS" };
  }
}

// Deactivate SOS
export async function deactivateSOS(): Promise<{ success: boolean; message: string }> {
  try {
    if (!sosState.isActive || !sosState.sosId) {
      return { success: false, message: "SOS not active" };
    }

    console.log("🛑 Deactivating SOS...");

    // Stop all systems
    stopSOSSiren();
    disableFlashlight();

    if (sosState.locationWatchId !== null) {
      clearInterval(sosState.locationWatchId);
      sosState.locationWatchId = null;
    }

    if (sosState.myBuddyIntervalId !== null) {
      clearInterval(sosState.myBuddyIntervalId);
      sosState.myBuddyIntervalId = null;
    }

    // Mark SOS as resolved
    await sosAPI.update(sosState.sosId, {
      resolvedAt: new Date(),
    });

    // Cancel speech synthesis
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    sosState = {
      isActive: false,
      sosId: null,
      locationWatchId: null,
      myBuddyIntervalId: null,
      retryAttempts: 0,
    };

    console.log("✅ SOS Deactivated");
    return { success: true, message: "SOS deactivated" };
  } catch (error: any) {
    console.error("SOS deactivation error:", error);
    return { success: false, message: error.message || "Failed to deactivate SOS" };
  }
}

export function getSOSState() {
  return sosState;
}
