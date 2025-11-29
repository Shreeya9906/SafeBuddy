// Twilio SMS integration
import twilio from 'twilio';

let twilioClient: any = null;
let twilioPhoneNumber: string | null = null;

export async function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !phoneNumber) {
    console.error("❌ Missing Twilio credentials in environment variables:");
    console.error("   TWILIO_ACCOUNT_SID:", accountSid ? "✓" : "❌");
    console.error("   TWILIO_AUTH_TOKEN:", authToken ? "✓" : "❌");
    console.error("   TWILIO_PHONE_NUMBER:", phoneNumber ? "✓" : "❌");
    return null;
  }

  try {
    twilioClient = twilio(accountSid, authToken);
    twilioPhoneNumber = phoneNumber;
    console.log("✅ Twilio SMS service initialized with account:", accountSid.substring(0, 5) + "...");
    return twilioClient;
  } catch (error: any) {
    console.error("❌ Error initializing Twilio:", error.message);
    return null;
  }
}

function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // If it starts with 91 or is 10-12 digits, assume Indian number
  if (cleaned.startsWith('91') || (cleaned.length >= 10 && cleaned.length <= 12)) {
    // Remove leading 91 if present and add it back
    const withoutCountry = cleaned.startsWith('91') ? cleaned.substring(2) : cleaned;
    return `+91${withoutCountry.slice(-10)}`;
  }
  
  // Otherwise assume it's already formatted or needs +91
  if (!cleaned.startsWith('91')) {
    return `+91${cleaned.slice(-10)}`;
  }
  
  return `+${cleaned}`;
}

export async function sendEmergencySMS(
  phoneNumber: string,
  userName: string,
  latitude: number,
  longitude: number
): Promise<boolean> {
  try {
    const client = await getTwilioClient();
    if (!client || !twilioPhoneNumber) {
      console.log("⚠️ Twilio SMS not available");
      return false;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `🚨 EMERGENCY ALERT!\n${userName} needs IMMEDIATE help!\n📍 Location: ${locationUrl}\n⏰ Time: ${new Date().toLocaleString()}`;

    console.log(`📱 Sending SMS to ${formattedPhone} (from ${phoneNumber})...`);
    
    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log(`✅ SMS sent to ${formattedPhone}`);
    return true;
  } catch (error: any) {
    console.error(`❌ SMS sending failed to ${phoneNumber}:`, error.message);
    return false;
  }
}

export async function sendFallDetectionSMS(
  phoneNumber: string,
  userName: string,
  latitude?: number,
  longitude?: number
): Promise<boolean> {
  try {
    const client = await getTwilioClient();
    if (!client || !twilioPhoneNumber) {
      console.log("⚠️ Twilio SMS not available");
      return false;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    let message = `⚠️ FALL DETECTION ALERT!\n${userName} may have fallen.\nImmediate assistance needed!`;
    
    if (latitude && longitude) {
      const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      message += `\n📍 Location: ${locationUrl}`;
    }

    console.log(`📱 Sending fall detection SMS to ${formattedPhone}...`);

    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone
    });

    console.log(`✅ Fall detection SMS sent to ${formattedPhone}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Fall detection SMS failed to ${phoneNumber}:`, error.message);
    return false;
  }
}
