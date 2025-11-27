import axios from "axios";

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_BASE_URL = "https://www.fast2sms.com/dev/bulkV2";

export interface SMSOptions {
  numbers: string[]; // Array of phone numbers
  message: string;
  sender_id?: string;
  route?: string;
}

/**
 * Send SMS using Fast2SMS API
 * Works for Indian numbers (Jio, Airtel, VI, etc.)
 */
export async function sendSMS(options: SMSOptions): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
  response?: any;
}> {
  try {
    if (!FAST2SMS_API_KEY) {
      console.error("❌ FAST2SMS_API_KEY not configured");
      return {
        success: false,
        error: "Fast2SMS API key not configured",
      };
    }

    // Format numbers - ensure they are without +91 prefix for Fast2SMS
    const formattedNumbers = options.numbers
      .map((num) => {
        // Remove +91 if present, remove any spaces or dashes
        return num.replace(/^\+91/, "").replace(/[\s-]/g, "");
      })
      .join(",");

    const payload = {
      route: options.route || "v3",
      sender_id: options.sender_id || "TXTIND",
      message: options.message,
      numbers: formattedNumbers,
    };

    console.log(`📤 Sending SMS via Fast2SMS to ${options.numbers.length} numbers:`, payload);

    const response = await axios.post(FAST2SMS_BASE_URL, payload, {
      headers: {
        authorization: FAST2SMS_API_KEY,
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    console.log(`✅ Fast2SMS Response:`, response.data);

    if (response.data.return) {
      return {
        success: true,
        messageId: response.data.message_id,
        response: response.data,
      };
    } else {
      return {
        success: false,
        error: response.data.message || "SMS send failed",
        response: response.data,
      };
    }
  } catch (error: any) {
    console.error("❌ Fast2SMS Error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to send SMS",
      response: error.response?.data,
    };
  }
}

/**
 * Send emergency SOS SMS to multiple guardians
 */
export async function sendSOSSMS(
  guardianPhones: string[],
  userName: string,
  latitude: number,
  longitude: number,
  battery: number
): Promise<{ success: boolean; sent: number; failed: number; error?: string }> {
  try {
    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const timestamp = new Date().toLocaleString();

    const message = `🚨 EMERGENCY SOS ALERT 🚨

${userName} needs IMMEDIATE help!

📍 Location: ${locationUrl}

🔋 Battery: ${battery}%
⏰ Time: ${timestamp}

📞 Emergency: 100/108/112/1091

⚠️ Help is on the way!`;

    if (guardianPhones.length === 0) {
      return {
        success: false,
        sent: 0,
        failed: 0,
        error: "No guardian phone numbers provided",
      };
    }

    const result = await sendSMS({
      numbers: guardianPhones,
      message,
      sender_id: "SOSAPP",
      route: "v3",
    });

    if (result.success) {
      console.log(`✅ SOS SMS sent successfully to ${guardianPhones.length} guardians`);
      return {
        success: true,
        sent: guardianPhones.length,
        failed: 0,
      };
    } else {
      console.error(`❌ SOS SMS failed:`, result.error);
      return {
        success: false,
        sent: 0,
        failed: guardianPhones.length,
        error: result.error,
      };
    }
  } catch (error: any) {
    console.error("❌ Error sending SOS SMS:", error.message);
    return {
      success: false,
      sent: 0,
      failed: guardianPhones.length,
      error: error.message,
    };
  }
}
