/**
 * Automatic emergency notification service
 * Sends WhatsApp, SMS, and initiates calls automatically on SOS
 */

import { sosAPI, emergencyAPI } from "./api";
import { getCurrentLocation, getBatteryLevel } from "./geolocation";

export interface EmergencyContact {
  name: string;
  phone: string;
  email?: string;
  relationship?: string;
  isPrimary?: boolean;
}

export interface SOSMessage {
  userLocation: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  mapsLink: string;
  message: string;
  timestamp: string;
  batteryLevel: number;
  userName: string;
  mobileNumber: string;
}

/**
 * Format emergency message for WhatsApp
 */
export function formatWhatsAppMessage(
  userName: string,
  latitude: number,
  longitude: number
): string {
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const timestamp = new Date().toLocaleTimeString();

  return encodeURIComponent(
    `🚨 *EMERGENCY SOS ALERT* 🚨\n\n` +
    `*Name:* ${userName}\n` +
    `*Time:* ${timestamp}\n` +
    `*Status:* NEEDS IMMEDIATE HELP!\n\n` +
    `📍 *Live Location:*\n` +
    `${mapsLink}\n\n` +
    `*Coordinates:* ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n\n` +
    `⚠️ This is an automatic emergency notification from SafeBuddy Guardian app.\n` +
    `Please respond immediately!`
  );
}

/**
 * Format emergency message for SMS
 */
export function formatSMSMessage(
  userName: string,
  latitude: number,
  longitude: number
): string {
  const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
  const timestamp = new Date().toLocaleTimeString();

  return (
    `EMERGENCY SOS ALERT!\n` +
    `Name: ${userName}\n` +
    `Time: ${timestamp}\n` +
    `NEEDS IMMEDIATE HELP!\n` +
    `Location: ${mapsLink}\n` +
    `Coords: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n` +
    `SafeBuddy Guardian App`
  );
}

/**
 * Send WhatsApp message via WhatsApp Web URL
 */
export async function sendWhatsAppMessage(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    // WhatsApp Web URL format
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, "_blank");
    console.log(`✅ WhatsApp message initiated to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error(`❌ WhatsApp error:`, error);
    return false;
  }
}

/**
 * Send SMS via native SMS app
 */
export async function sendSMS(
  phoneNumber: string,
  message: string
): Promise<boolean> {
  try {
    const smsUrl = `sms:${phoneNumber}?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
    console.log(`✅ SMS initiated to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error(`❌ SMS error:`, error);
    return false;
  }
}

/**
 * Initiate phone call
 */
export async function initiatePhoneCall(phoneNumber: string): Promise<boolean> {
  try {
    window.location.href = `tel:${phoneNumber}`;
    console.log(`✅ Phone call initiated to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error(`❌ Phone call error:`, error);
    return false;
  }
}

/**
 * Send automatic emergency notifications to all guardians
 */
export async function sendAutomaticEmergencyNotifications(
  guardians: EmergencyContact[],
  userName: string,
  latitude: number,
  longitude: number,
  batteryLevel: number
): Promise<{
  whatsappSent: number;
  smsSent: number;
  callsInitiated: number;
}> {
  const stats = {
    whatsappSent: 0,
    smsSent: 0,
    callsInitiated: 0,
  };

  if (!guardians || guardians.length === 0) {
    console.warn("No guardians available for emergency notification");
    return stats;
  }

  const whatsappMsg = formatWhatsAppMessage(userName, latitude, longitude);
  const smsMsg = formatSMSMessage(userName, latitude, longitude);

  // Process each guardian
  for (const guardian of guardians) {
    if (!guardian.phone) continue;

    // Normalize phone number (remove spaces, dashes, etc.)
    const normalizedPhone = guardian.phone.replace(/\D/g, "");

    try {
      // Send WhatsApp (highest priority - most reliable)
      const whatsappSuccess = await sendWhatsAppMessage(
        normalizedPhone,
        whatsappMsg
      );
      if (whatsappSuccess) stats.whatsappSent++;

      // Small delay to prevent rapid URL opens
      await new Promise(resolve => setTimeout(resolve, 500));

      // Send SMS as backup
      const smsSuccess = await sendSMS(normalizedPhone, smsMsg);
      if (smsSuccess) stats.smsSent++;

      // Initiate call for primary contacts
      if (guardian.isPrimary) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const callSuccess = await initiatePhoneCall(normalizedPhone);
        if (callSuccess) stats.callsInitiated++;
      }
    } catch (error) {
      console.error(`Error notifying guardian ${guardian.name}:`, error);
    }
  }

  console.log(
    `📢 Emergency notifications sent - WhatsApp: ${stats.whatsappSent}, SMS: ${stats.smsSent}, Calls: ${stats.callsInitiated}`
  );
  return stats;
}

/**
 * Start continuous location updates during SOS
 */
export async function startContinuousLocationUpdates(
  sosId: string,
  interval: number = 5000 // 5 seconds
): Promise<NodeJS.Timeout> {
  const updateInterval = setInterval(async () => {
    try {
      const location = await getCurrentLocation();
      const battery = await getBatteryLevel();

      // Update location on server
      await sosAPI.addLocation(sosId, {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        batteryLevel: battery,
      });

      console.log(
        `📍 SOS location updated: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`
      );
    } catch (error) {
      console.error("Error updating SOS location:", error);
    }
  }, interval);

  return updateInterval;
}

/**
 * Stop continuous location updates
 */
export function stopContinuousLocationUpdates(
  interval: NodeJS.Timeout
): void {
  clearInterval(interval);
  console.log("⏹️ SOS location updates stopped");
}

/**
 * Complete automatic SOS activation workflow
 */
export async function activateAutomaticSOS(
  userId: string,
  guardians: EmergencyContact[],
  userName: string,
  onProgress?: (step: string) => void
): Promise<{
  sosId: string;
  notificationStats: {
    whatsappSent: number;
    smsSent: number;
    callsInitiated: number;
  };
  locationUpdateInterval: NodeJS.Timeout;
}> {
  try {
    // Step 1: Get current location and battery
    onProgress?.("Getting location...");
    const location = await getCurrentLocation();
    const battery = await getBatteryLevel();

    // Step 2: Create SOS alert
    onProgress?.("Creating SOS alert...");
    const sosAlert = await sosAPI.create({
      triggerMethod: "automatic_sos",
      latitude: location.latitude,
      longitude: location.longitude,
      batteryLevel: battery,
      address: "Live location tracking active",
    });

    // Step 3: Send notifications to all guardians
    onProgress?.("Sending emergency notifications...");
    const notificationStats = await sendAutomaticEmergencyNotifications(
      guardians,
      userName,
      location.latitude,
      location.longitude,
      battery
    );

    // Step 4: Start continuous location updates
    onProgress?.("Starting location tracking...");
    const locationUpdateInterval = await startContinuousLocationUpdates(
      sosAlert.id,
      5000
    );

    console.log("✅ Automatic SOS activation complete");

    return {
      sosId: sosAlert.id,
      notificationStats,
      locationUpdateInterval,
    };
  } catch (error) {
    console.error("❌ Error in automatic SOS activation:", error);
    throw error;
  }
}
