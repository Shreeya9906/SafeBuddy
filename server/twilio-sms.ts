// Twilio SMS integration - see blueprint for Twilio connector setup
import twilio from 'twilio';

let twilioClient: any = null;
let twilioPhoneNumber: string | null = null;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    console.log("⚠️ No Replit token found - Twilio SMS disabled");
    return null;
  }

  try {
    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=twilio',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    const data = await response.json();
    const connectionSettings = data.items?.[0];

    if (!connectionSettings?.settings?.account_sid || !connectionSettings?.settings?.api_key || !connectionSettings?.settings?.api_key_secret) {
      console.log("⚠️ Twilio credentials incomplete");
      return null;
    }

    return {
      accountSid: connectionSettings.settings.account_sid,
      apiKey: connectionSettings.settings.api_key,
      apiKeySecret: connectionSettings.settings.api_key_secret,
      phoneNumber: connectionSettings.settings.phone_number
    };
  } catch (error: any) {
    console.error("❌ Error fetching Twilio credentials:", error.message);
    return null;
  }
}

export async function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const creds = await getCredentials();
  if (!creds) return null;

  twilioClient = twilio(creds.apiKey, creds.apiKeySecret, { accountSid: creds.accountSid });
  twilioPhoneNumber = creds.phoneNumber;

  console.log("✅ Twilio SMS service initialized");
  return twilioClient;
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

    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `🚨 EMERGENCY ALERT!\n${userName} needs IMMEDIATE help!\n📍 Location: ${locationUrl}\n⏰ Time: ${new Date().toLocaleString()}`;

    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log(`✅ SMS sent to ${phoneNumber}`);
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

    let message = `⚠️ FALL DETECTION ALERT!\n${userName} may have fallen.\nImmediate assistance needed!`;
    
    if (latitude && longitude) {
      const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
      message += `\n📍 Location: ${locationUrl}`;
    }

    await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber
    });

    console.log(`✅ Fall detection SMS sent to ${phoneNumber}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Fall detection SMS failed to ${phoneNumber}:`, error.message);
    return false;
  }
}
