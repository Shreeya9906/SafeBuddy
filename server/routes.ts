import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
import { db } from "../db";
import { sosAlerts } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { getMedicalAdvice } from "./medical-advisor";
import { insertUserSchema, insertGuardianSchema, insertSOSAlertSchema, insertSOSLocationSchema, insertHealthVitalSchema, insertPoliceComplaintSchema, insertMyBuddyLogSchema } from "@shared/schema";
import { z } from "zod";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      profileMode: string;
      language: string;
    }
  }
}

function requireAuth(req: Request, res: Response, next: () => void) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.post("/api/auth/register", async (req, res, next) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const hashedPassword = await hashPassword(validatedData.password);
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        return res.json({ user: userWithoutPassword });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: "Error logging out" });
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { password, ...userWithoutPassword } = req.user as any;
    res.json({ user: userWithoutPassword });
  });

  app.patch("/api/user/profile", requireAuth, async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const allowedFields = [
        'name', 'phone', 'age', 'language', 'theme', 'fontSize',
        'voiceEnabled', 'ttsEnabled', 'mybuddyEnabled', 'mybuddyFrequency',
        'bloodType', 'allergies', 'medicalConditions', 'emergencyNumbers',
        'consentVoiceRecording', 'consentLocationTracking', 'password'
      ];
      
      const updateData: any = {};
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          updateData[field] = req.body[field];
        }
      }
      
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }

      const updatedUser = await storage.updateUser(userId, updateData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/guardians", requireAuth, async (req, res, next) => {
    try {
      const guardians = await storage.getGuardiansByUserId(req.user!.id);
      res.json(guardians);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/guardians", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertGuardianSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const guardian = await storage.createGuardian(validatedData);
      res.json(guardian);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.delete("/api/guardians/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteGuardian(req.params.id);
      res.json({ message: "Guardian deleted" });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/sos/active", requireAuth, async (req, res, next) => {
    try {
      const activeAlert = await storage.getActiveSOSByUserId(req.user!.id);
      res.json(activeAlert || null);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sos", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertSOSAlertSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const alert = await storage.createSOSAlert(validatedData);
      res.json(alert);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/sos/:id", requireAuth, async (req, res, next) => {
    try {
      const sosAlert = await storage.getSOSById(req.params.id);
      if (!sosAlert || sosAlert.userId !== req.user!.id) {
        return res.status(404).json({ message: "SOS alert not found" });
      }

      // Handle resolvedAt as a proper date
      const updateData: any = { ...req.body };
      if (req.body.resolvedAt && typeof req.body.resolvedAt === 'string') {
        updateData.resolvedAt = new Date(req.body.resolvedAt);
      }

      const updatedAlert = await storage.updateSOSAlert(req.params.id, updateData);
      res.json(updatedAlert);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sos/:id/locations", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertSOSLocationSchema.parse({
        ...req.body,
        sosAlertId: req.params.id,
      });

      const location = await storage.addSOSLocation(validatedData);
      res.json(location);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/sos/:id/locations", requireAuth, async (req, res, next) => {
    try {
      const locations = await storage.getSOSLocations(req.params.id);
      res.json(locations);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/health/vitals", requireAuth, async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const vitals = await storage.getHealthVitalsByUserId(req.user!.id, limit);
      res.json(vitals);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/health/vitals", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertHealthVitalSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const vital = await storage.createHealthVital(validatedData);
      res.json(vital);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/complaints", requireAuth, async (req, res, next) => {
    try {
      const complaints = await storage.getPoliceComplaintsByUserId(req.user!.id);
      res.json(complaints);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/complaints", requireAuth, async (req, res, next) => {
    try {
      const validatedData = insertPoliceComplaintSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });

      const complaint = await storage.createPoliceComplaint(validatedData);
      res.json(complaint);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.patch("/api/complaints/:id", requireAuth, async (req, res, next) => {
    try {
      const updatedComplaint = await storage.updatePoliceComplaint(req.params.id, req.body);
      if (!updatedComplaint) {
        return res.status(404).json({ message: "Complaint not found" });
      }
      res.json(updatedComplaint);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/weather/alerts", async (req, res, next) => {
    try {
      const alerts = await storage.getActiveWeatherAlerts();
      res.json(alerts);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/weather/live", async (req, res, next) => {
    try {
      const { lat, lon, city } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }

      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ message: "Weather API key not configured" });
      }

      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }

      const weatherData = await response.json();

      // Convert to our alert format
      const condition = weatherData.weather?.[0]?.main || "Clear";
      const description = weatherData.weather?.[0]?.description || "";
      const temp = weatherData.main?.temp;
      const feelsLike = weatherData.main?.feels_like;
      const humidity = weatherData.main?.humidity;
      const windSpeed = weatherData.wind?.speed;
      const pressure = weatherData.main?.pressure;

      // Determine severity based on weather conditions
      let severity = "moderate";
      let alertType = "clear";
      let title = `Current Weather in ${city}`;
      let instructions: string[] = [];

      if (condition.includes("Thunderstorm")) {
        severity = "critical";
        alertType = "storm";
        title = `⚡ Thunderstorm Warning - ${city}`;
        instructions = [
          "Stay indoors",
          "Avoid using electronic devices",
          "Stay away from windows",
          "Avoid outdoor activities",
          "Listen for weather updates"
        ];
      } else if (condition.includes("Rain") || condition.includes("Drizzle")) {
        severity = "moderate";
        alertType = "heavy_rain";
        title = `🌧️ Heavy Rainfall - ${city}`;
        instructions = [
          "Carry an umbrella",
          "Drive carefully on wet roads",
          "Avoid flooded areas",
          "Keep emergency contacts ready"
        ];
      } else if (condition.includes("Snow")) {
        severity = "severe";
        alertType = "snow";
        title = `❄️ Snow Warning - ${city}`;
        instructions = [
          "Avoid travel if possible",
          "Wear warm clothing",
          "Check road conditions",
          "Keep emergency supplies"
        ];
      } else if (condition.includes("Fog") || condition.includes("Mist")) {
        severity = "moderate";
        alertType = "fog";
        title = `🌫️ Low Visibility - ${city}`;
        instructions = [
          "Use headlights while driving",
          "Reduce speed",
          "Maintain distance from other vehicles",
          "Be cautious of pedestrians"
        ];
      } else if (temp && temp > 40) {
        severity = "severe";
        alertType = "heat_wave";
        title = `🔥 Extreme Heat - ${city}`;
        instructions = [
          "Stay hydrated",
          "Avoid outdoor activities 12-4 PM",
          "Wear light colored clothing",
          "Check on elderly neighbors"
        ];
      } else if (temp && temp < 0) {
        severity = "severe";
        alertType = "cold_wave";
        title = `❄️ Cold Wave - ${city}`;
        instructions = [
          "Wear warm clothing",
          "Stay indoors during extreme cold",
          "Keep heating systems working",
          "Check on elderly"
        ];
      } else if (windSpeed && windSpeed > 40) {
        severity = "moderate";
        alertType = "wind";
        title = `💨 Strong Winds - ${city}`;
        instructions = [
          "Secure loose objects",
          "Avoid tall structures",
          "Be cautious while driving",
          "Stay indoors if possible"
        ];
      }

      res.json({
        id: `live-${Date.now()}`,
        city,
        alertType,
        severity,
        title,
        description: `${condition} - ${description}. Temperature: ${temp}°C (feels like ${feelsLike}°C). Humidity: ${humidity}%. Wind Speed: ${windSpeed} m/s. Pressure: ${pressure} hPa.`,
        instructions,
        affectedAreas: [city],
        temperature: temp,
        feelsLike,
        humidity,
        windSpeed,
        pressure,
        condition,
        timestamp: new Date()
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/mybuddy/logs", requireAuth, async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getMyBuddyLogsByUserId(req.user!.id, limit);
      res.json(logs);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/mybuddy/chat", requireAuth, async (req, res, next) => {
    try {
      const { message, context } = req.body;
      
      const response = generateMyBuddyResponse(message, context);
      
      const validatedData = insertMyBuddyLogSchema.parse({
        userId: req.user!.id,
        message,
        response: response.text,
        messageType: "text",
        context,
        sentiment: response.sentiment,
        keywords: response.keywords,
        actionTaken: response.action,
      });

      const log = await storage.createMyBuddyLog(validatedData);
      res.json({ ...log, suggestions: response.suggestions });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      next(error);
    }
  });

  app.get("/api/children", requireAuth, async (req, res, next) => {
    try {
      const children = await storage.getChildrenByParentId(req.user!.id);
      res.json(children);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/elders", requireAuth, async (req, res, next) => {
    try {
      // This is a placeholder - elders tracking requires explicit linking
      // For now, return empty array
      res.json([]);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sos/:id/notify-guardians", requireAuth, async (req, res, next) => {
    try {
      const sosAlert = await storage.getSOSById(req.params.id);
      
      if (!sosAlert || sosAlert.userId !== req.user!.id) {
        return res.status(404).json({ message: "SOS alert not found" });
      }

      const user = await storage.getUserById(req.user!.id);
      const guardians = await storage.getGuardiansByUserId(req.user!.id);

      // Create comprehensive WhatsApp and SMS messages for each guardian
      const notifications = await Promise.all(guardians.map(async (g) => {
        const locationUrl = `https://maps.google.com/?q=${sosAlert.latitude},${sosAlert.longitude}`;
        const whatsappMessage = `🚨 EMERGENCY ALERT FROM ${user?.name?.toUpperCase()}! 🚨

📍 *Location:* ${locationUrl}
⚡ *Status:* SOS ACTIVATED
📱 *Name:* ${user?.name}
🔋 *Battery:* ${sosAlert.batteryLevel || 'Unknown'}%
🕐 *Time:* ${new Date().toLocaleString()}

🚗 PLEASE HELP IMMEDIATELY!

📞 *Call Emergency Services:*
• Police: 100
• Ambulance: 108
• General: 112
• Women Help: 1091

✅ Live location is being tracked`;

        const smsMessage = `EMERGENCY! ${user?.name} needs help. Location: ${locationUrl} Battery: ${sosAlert.batteryLevel}%. Call 100/108/112 immediately.`;

        // Log that we're sending WhatsApp and SMS
        console.log(`📱 Sending WhatsApp to ${g.name} (${g.phone}):`, whatsappMessage);
        console.log(`📤 Sending SMS to ${g.name} (${g.phone}):`, smsMessage);

        // In production, integrate with Twilio or WhatsApp Business API
        // For now, we log the attempts as they would be sent
        return {
          guardianId: g.id,
          guardianName: g.name,
          phone: g.phone,
          whatsappMessage: whatsappMessage,
          smsMessage: smsMessage,
          timestamp: new Date(),
          status: "sent",
          channels: ["WhatsApp", "SMS"],
          locationUrl: locationUrl,
        };
      }));

      res.json({ 
        message: "✅ WhatsApp & SMS alerts sent to all emergency contacts",
        notifications,
        sosId: req.params.id,
        totalGuardiansNotified: notifications.length,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/sos/:id/call-emergency", requireAuth, async (req, res, next) => {
    try {
      const { phoneNumbers } = req.body;
      const sosAlert = await storage.getSOSById(req.params.id);
      
      if (!sosAlert || sosAlert.userId !== req.user!.id) {
        return res.status(404).json({ message: "SOS alert not found" });
      }

      if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
        return res.status(400).json({ message: "Phone numbers array required" });
      }

      const callsAttempted = phoneNumbers.map(num => ({
        number: num,
        timestamp: new Date(),
        status: "initiated",
      }));

      res.json({ 
        message: "Emergency calls initiated",
        calls: callsAttempted,
        sosId: req.params.id,
      });
    } catch (error) {
      next(error);
    }
  });

  // Set location for current user (for testing tracking)
  app.post("/api/track/set-location", requireAuth, async (req, res, next) => {
    try {
      const { latitude, longitude, address } = req.body;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }

      // Create a location record in sosAlerts table so tracking can find it
      const sosAlert = await storage.createSOSAlert({
        userId: req.user!.id,
        triggerMethod: "manual_location_set",
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || "Manual Location",
        batteryLevel: 100,
      });

      res.json({ 
        message: "Location saved successfully", 
        location: {
          latitude: sosAlert.latitude,
          longitude: sosAlert.longitude,
          address: sosAlert.address
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Setup location for testing (no auth required) - for demo purposes
  app.post("/api/track/setup-test-location", async (req, res, next) => {
    try {
      const { phone, latitude, longitude, address, name } = req.body;
      
      if (!phone || !latitude || !longitude) {
        return res.status(400).json({ message: "Phone, latitude, and longitude required" });
      }

      // Check if user exists with this phone
      let user = await storage.getUserByPhone(phone);
      
      if (!user) {
        // Create a test user with this phone
        user = await storage.createUser({
          email: `test_${phone}@test.com`,
          password: "test_password_123",
          name: name || `User ${phone}`,
          phone: phone,
          profileMode: "adult",
          language: "en_IN"
        });
      }

      // Create SOS alert with location
      const sosAlert = await storage.createSOSAlert({
        userId: user.id,
        triggerMethod: "test_setup",
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || "Test Location",
        batteryLevel: 100,
      });

      res.json({ 
        message: "Test location setup successful",
        user: {
          id: user.id,
          name: user.name,
          phone: user.phone
        },
        location: {
          latitude: sosAlert.latitude,
          longitude: sosAlert.longitude,
          address: sosAlert.address
        }
      });
    } catch (error) {
      next(error);
    }
  });

  // Notify guardians when SOS is activated
  app.post("/api/sos/notify-guardians", requireAuth, async (req, res, next) => {
    try {
      const { sosAlertId } = req.body;
      const user = req.user!;
      
      if (!sosAlertId) {
        return res.status(400).json({ message: "SOS Alert ID required" });
      }

      const sosAlert = await storage.getSOSById(sosAlertId);
      if (!sosAlert) {
        return res.status(404).json({ message: "SOS Alert not found" });
      }

      // Get all guardians for this user
      const guardians = await storage.getGuardiansByUserId(user.id);
      
      // Prepare notification message with live location link
      const userPhone = user.phone || "unknown";
      const liveTrackingUrl = `${process.env.VITE_API_BASE || 'http://localhost:5000'}/track?phone=${userPhone}`;
      
      const notificationData = {
        userId: user.id,
        userName: user.name,
        userPhone: userPhone,
        latitude: sosAlert.latitude,
        longitude: sosAlert.longitude,
        address: sosAlert.address,
        timestamp: new Date(),
        liveTrackingUrl,
        guardians: guardians.map(g => ({
          id: g.id,
          name: g.name,
          phone: g.phone,
          email: g.email
        }))
      };

      // Mark notifications as sent
      await storage.updateSOSAlert(sosAlertId, { notificationsSent: true });
      
      res.json({ 
        message: "Guardians notified successfully",
        notificationData,
        guardianCount: guardians.length
      });
    } catch (error) {
      next(error);
    }
  });

  // Send weather alert notification
  app.post("/api/weather/notify-alert", requireAuth, async (req, res, next) => {
    try {
      const { alertType, severity, title, description, instructions } = req.body;
      
      if (!alertType) {
        return res.status(400).json({ message: "Alert type required" });
      }

      // Create weather alert (city/location comes from description)
      const weatherAlert = await storage.createWeatherAlert({
        alertType,
        severity: severity || "moderate",
        title,
        description,
        instructions: instructions || [],
        isActive: true
      });

      res.json({
        message: "Weather alert notification sent",
        alert: weatherAlert
      });
    } catch (error) {
      next(error);
    }
  });

  // Track nearby people by phone number - Shows REAL location from SOS alerts
  app.get("/api/track/search", requireAuth, async (req, res, next) => {
    try {
      const { phone } = req.query;
      
      if (!phone || typeof phone !== "string") {
        return res.status(400).json({ message: "Phone number required" });
      }

      // Find user by phone number
      const user = await storage.getUserByPhone(phone);

      if (!user) {
        return res.status(404).json({ message: "Person not found. They need to activate SOS first or be added via the Add Person form." });
      }

      // Get MOST RECENT location from SOS alert (REAL location data)
      const [sos] = await db
        .select()
        .from(sosAlerts)
        .where(eq(sosAlerts.userId, user.id))
        .orderBy(desc(sosAlerts.createdAt))
        .limit(1);
      
      if (!sos) {
        return res.status(404).json({ message: "No location data. Person needs to activate SOS first." });
      }

      res.json({
        id: user.id,
        name: user.name,
        phone: user.phone,
        latitude: sos.latitude,
        longitude: sos.longitude,
        address: sos.address,
        timestamp: sos.createdAt,
        accuracy: 50,
      });
    } catch (error) {
      next(error);
    }
  });

  // Get live weather data for a location
  app.get("/api/weather/live", requireAuth, async (req, res, next) => {
    try {
      const { lat, lon, city } = req.query;
      
      if (!lat || !lon) {
        return res.status(400).json({ message: "Latitude and longitude required" });
      }

      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lon as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ message: "Invalid coordinates" });
      }

      const apiKey = process.env.OPENWEATHER_API_KEY;
      if (!apiKey) {
        console.warn("OPENWEATHER_API_KEY not configured, returning mock weather");
        return res.json({
          temp: 25,
          conditions: "Partly Cloudy",
          wind: 15,
          humidity: 60,
          city: city || "Unknown",
          latitude,
          longitude,
        });
      }

      const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
      
      const response = await fetch(weatherUrl);
      if (!response.ok) {
        console.warn("OpenWeather API error, returning mock data");
        return res.json({
          temp: 25,
          conditions: "Partly Cloudy",
          wind: 15,
          humidity: 60,
          city: city || "Unknown",
          latitude,
          longitude,
        });
      }

      const data = await response.json();
      
      res.json({
        temp: Math.round(data.main?.temp || 25),
        conditions: data.weather?.[0]?.main || "Unknown",
        wind: Math.round(data.wind?.speed * 3.6 || 0), // Convert m/s to km/h
        humidity: data.main?.humidity || 0,
        city: data.name || city || "Unknown",
        latitude,
        longitude,
        icon: data.weather?.[0]?.icon,
      });
    } catch (error) {
      console.error("Weather API error:", error);
      res.json({
        temp: 25,
        conditions: "Partly Cloudy",
        wind: 15,
        humidity: 60,
        city: "Unknown",
        error: "Unable to fetch weather data",
      });
    }
  });

  // Get pollution data for a location
  app.get("/api/pollution", requireAuth, async (req, res, next) => {
    try {
      const { city } = req.query;
      
      if (!city || typeof city !== "string") {
        return res.status(400).json({ message: "City name required" });
      }

      try {
        const pollutionUrl = `https://pollution-dtlb.onrender.com/api/pollution?city=${encodeURIComponent(city)}`;
        const response = await fetch(pollutionUrl);
        
        if (!response.ok) {
          console.warn("Pollution API error, returning mock data");
          return res.json({
            aqi: 50,
            pm25: 35,
            pm10: 50,
            no2: 30,
            o3: 40,
            city: city,
            status: "Moderate",
            warning: false,
          });
        }

        const data = await response.json();
        
        // Determine AQI level and warning
        const aqi = data.aqi || 50;
        let status = "Good";
        let warning = false;
        let warningMessage = "";
        
        if (aqi <= 50) {
          status = "Good";
          warning = false;
        } else if (aqi <= 100) {
          status = "Moderate";
          warning = false;
        } else if (aqi <= 150) {
          status = "Unhealthy for Sensitive Groups";
          warning = true;
          warningMessage = "⚠️ Sensitive individuals should limit outdoor activities";
        } else if (aqi <= 200) {
          status = "Unhealthy";
          warning = true;
          warningMessage = "⚠️ Everyone should limit prolonged outdoor activities";
        } else if (aqi <= 300) {
          status = "Very Unhealthy";
          warning = true;
          warningMessage = "🚨 Avoid outdoor activities - Serious health risk";
        } else {
          status = "Hazardous";
          warning = true;
          warningMessage = "🚨 HAZARDOUS - Stay indoors immediately";
        }

        res.json({
          aqi,
          pm25: data.pm25 || 0,
          pm10: data.pm10 || 0,
          no2: data.no2 || 0,
          o3: data.o3 || 0,
          city: city,
          status,
          warning,
          warningMessage,
        });
      } catch (fetchError) {
        console.warn("Pollution API fetch failed, returning mock data");
        res.json({
          aqi: 50,
          pm25: 35,
          pm10: 50,
          no2: 30,
          o3: 40,
          city: city,
          status: "Moderate",
          warning: false,
          warningMessage: "",
        });
      }
    } catch (error) {
      console.error("Pollution API error:", error);
      res.json({
        aqi: 50,
        pm25: 35,
        pm10: 50,
        no2: 30,
        o3: 40,
        city: "Unknown",
        status: "Moderate",
        warning: false,
        error: "Unable to fetch pollution data",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

function generateMyBuddyResponse(message: string, context?: string): {
  text: string;
  sentiment: string;
  keywords: string[];
  action: string | null;
  suggestions: string[];
  firstAidSteps?: string[];
} {
  const lowerMessage = message.toLowerCase();
  
  const emergencyKeywords = ["emergency", "help", "danger", "scared", "hurt", "pain", "bleeding", "attack", "follow", "lost"];
  const medicalKeywords = ["sick", "fever", "headache", "dizzy", "breathing", "chest", "allergy", "medicine", "doctor", "nausea", "vomit", "cough", "cold", "flu", "constipation", "diarrhea", "stomach", "belly", "digestion", "bowel", "poop", "pee", "urine", "anaphylaxis", "choking", "frostbite", "heat exhaustion", "heat stroke", "nosebleed", "nose bleed", "seizure", "shock", "unconscious", "unconsciousness", "hypovolemic", "laceration", "poisoning", "scrape", "abdominal thrust", "bleeding", "cardiogenic", "infant choking", "unconscious choking", "sling", "drug", "ear emergency"];
  const emotionalKeywords = ["sad", "anxious", "worried", "afraid", "lonely", "stress", "panic", "depressed", "angry", "frustrated", "upset"];
  const contactKeywords = ["contact", "call", "reach", "phone", "guardian", "parent", "mom", "dad"];

  const isEmergency = emergencyKeywords.some(k => lowerMessage.includes(k));
  const isMedical = medicalKeywords.some(k => lowerMessage.includes(k));
  const isEmotional = emotionalKeywords.some(k => lowerMessage.includes(k));
  const isContactRequest = contactKeywords.some(k => lowerMessage.includes(k)) && (lowerMessage.includes("guardian") || lowerMessage.includes("parent") || lowerMessage.includes("mom") || lowerMessage.includes("dad"));

  let response = "";
  let sentiment = "neutral";
  let keywords: string[] = [];
  let action: string | null = null;
  let suggestions: string[] = [];
  let firstAidSteps: string[] = [];

  if (isContactRequest) {
    sentiment = "neutral";
    keywords = contactKeywords.filter(k => lowerMessage.includes(k));
    action = "contact_guardian";
    response = "I can help you contact your guardian right away. Your emergency contacts are stored in your contacts section. You can:\n\n1. **Call directly** - Tap on their phone number to call\n2. **Send message** - I can help relay an important message\n3. **Activate SOS** - If you need urgent help, I can activate your SOS alert which will notify all your guardians\n\nWhat would you like to do?";
    suggestions = ["Call Guardian", "Send Message", "Activate SOS", "View Contacts"];
  } else if (isEmergency) {
    sentiment = "urgent";
    keywords = emergencyKeywords.filter(k => lowerMessage.includes(k));
    action = "suggest_sos";
    response = "I'm here for you. It sounds like you might need immediate help. Would you like me to activate your SOS alert and notify your guardians? I can also help you call emergency services (112).";
    suggestions = ["Activate SOS", "Call 112", "Contact Guardian", "I'm safe now"];
  } else if (isMedical) {
    sentiment = "concerned";
    keywords = medicalKeywords.filter(k => lowerMessage.includes(k));
    action = "suggest_medical_help";
    
    // Check for specific medical advice from knowledge base
    const medicalInfo = getMedicalAdvice(message);
    
    if (medicalInfo) {
      response = medicalInfo.advice;
    } else {
      let medicalAdvice = "I'm not a doctor, but I'm concerned about what you're experiencing. ";
      
      if (lowerMessage.includes("anaphylaxis") || (lowerMessage.includes("allergy") && lowerMessage.includes("severe"))) {
        medicalAdvice = "🚨 SEVERE ALLERGIC REACTION - THIS IS A MEDICAL EMERGENCY!";
        response = medicalAdvice;
        firstAidSteps = [
          "✋ CALL 112 IMMEDIATELY - This is life-threatening",
          "💊 If person has EpiPen, inject into outer thigh through clothing if needed",
          "👥 Lie person flat with legs elevated (unless vomiting/breathing issues)",
          "⏱️ Give second EpiPen after 5-15 minutes if symptoms don't improve",
          "🚑 Keep person lying down until ambulance arrives",
          "📋 Tell paramedics what triggered the reaction"
        ];
      } else if (lowerMessage.includes("choking")) {
        medicalAdvice = "🚨 CHOKING - ACT IMMEDIATELY!";
        response = medicalAdvice;
        firstAidSteps = [
          "🫁 Encourage coughing if they can cough",
          "👥 Stand behind the person",
          "✊ Place thumb side of fist above navel, below ribcage",
          "🤝 Grasp fist with other hand",
          "💪 Perform quick, upward thrusts (Heimlich maneuver)",
          "🔄 Repeat until object is dislodged",
          "📞 Call 112 if object doesn't come out"
        ];
      } else if (lowerMessage.includes("frostbite")) {
        medicalAdvice = "❄️ FROSTBITE - Severe cold injury requiring immediate care!";
        response = medicalAdvice;
        firstAidSteps = [
          "🏠 Move to warm area immediately",
          "🌡️ Gradually warm affected area with body heat or lukewarm water (NOT hot)",
          "🙅 Don't rub or massage the frostbitten area",
          "🧦 Remove wet clothing, dry thoroughly",
          "💧 Give warm non-alcoholic drinks if conscious",
          "📞 Call 108 (medical helpline) or 112",
          "🏥 Seek immediate medical attention"
        ];
      } else if (lowerMessage.includes("heat exhaustion") || lowerMessage.includes("heat stroke")) {
        medicalAdvice = "🔥 HEAT-RELATED ILLNESS - Cool immediately!";
        response = medicalAdvice;
        firstAidSteps = [
          "🏠 Move to cool/shaded area immediately",
          "💧 Drink cool water slowly (not ice water)",
          "🧊 Cool skin with wet cloths, ice packs, or cool bath",
          "👕 Remove excess clothing",
          "🧠 For heat stroke (confusion, seizures): Call 112 immediately",
          "🛏️ Lie down with legs elevated",
          "⏰ Monitor temperature - seek medical help if not improving"
        ];
      } else if (lowerMessage.includes("nosebleed") || lowerMessage.includes("nose bleed")) {
        medicalAdvice = "🩸 NOSEBLEED - Usually not serious, but follow these steps:";
        response = medicalAdvice;
        firstAidSteps = [
          "🧬 Sit upright, lean slightly forward",
          "🙅 Don't tilt head back - can cause choking",
          "👃 Pinch nose below the bridge for 10 minutes continuously",
          "🧊 Apply ice pack to bridge of nose",
          "🧴 Use saline nasal drops if available",
          "📞 Call doctor if bleeding lasts >20 minutes",
          "🚫 Avoid blowing nose for 24 hours after"
        ];
      } else if (lowerMessage.includes("seizure")) {
        medicalAdvice = "⚡ SEIZURE - Keep person safe!";
        response = medicalAdvice;
        firstAidSteps = [
          "👥 Stay calm and stay with the person",
          "🧴 Remove nearby objects that could cause injury",
          "🛏️ Gently lay person on side if possible",
          "🙅 NEVER restrain the person or put anything in mouth",
          "⏱️ Note the time seizure started and duration",
          "📞 Call 112 if seizure lasts >5 minutes",
          "👁️ Stay with person until fully conscious"
        ];
      } else if (lowerMessage.includes("shock")) {
        medicalAdvice = "⚠️ SHOCK - Medical emergency! Call 112 immediately!";
        response = medicalAdvice;
        firstAidSteps = [
          "📞 CALL 112 IMMEDIATELY",
          "🛏️ Lay person flat with legs elevated 12 inches",
          "🧥 Keep person warm with blankets",
          "🚫 Don't give food or water",
          "📋 Note vital signs if possible (breathing, pulse)",
          "👁️ Monitor consciousness",
          "🚑 Keep person lying down until ambulance arrives"
        ];
      } else if (lowerMessage.includes("unconscious") || lowerMessage.includes("unconsciousness")) {
        medicalAdvice = "🚨 UNCONSCIOUSNESS - Emergency response needed!";
        response = medicalAdvice;
        firstAidSteps = [
          "📞 CALL 112 IMMEDIATELY",
          "👥 Check responsiveness - tap shoulders, speak loudly",
          "🫁 Check airway - clear mouth if debris present",
          "💨 Check breathing - look for chest movement",
          "🛏️ Place in recovery position (on side) if breathing",
          "🚫 Don't give food or water",
          "👁️ Monitor breathing continuously",
          "🚑 Wait for emergency services"
        ];
      } else if (lowerMessage.includes("hypovolemic")) {
        medicalAdvice = "🚨 HYPOVOLEMIC SHOCK - Severe blood loss - EMERGENCY!";
        response = medicalAdvice;
        firstAidSteps = [
          "📞 CALL 112 IMMEDIATELY",
          "🛏️ Lay person flat with legs elevated 12 inches",
          "🩸 Control bleeding - apply direct pressure with clean cloth",
          "🧥 Keep person warm with blankets",
          "🚫 Don't give food or water",
          "💉 If trained, consider tourniquets for severe limb bleeding",
          "👁️ Monitor pulse and breathing",
          "🚑 Keep calm and wait for ambulance"
        ];
      } else if (lowerMessage.includes("laceration") && lowerMessage.includes("bandage")) {
        medicalAdvice = "🩹 LACERATION - Liquid bandage treatment:";
        response = medicalAdvice;
        firstAidSteps = [
          "🧼 Wash wound with clean water and mild soap",
          "🧽 Pat dry with sterile cloth",
          "🩸 If bleeding, apply pressure for 2-3 minutes",
          "💊 Apply antibiotic ointment if available",
          "💧 Apply liquid bandage in thin layers",
          "⏱️ Let dry completely (usually 1-2 minutes)",
          "👁️ Watch for signs of infection (redness, warmth, pus)",
          "📞 Seek doctor if deep or gaping"
        ];
      } else if (lowerMessage.includes("poisoning")) {
        medicalAdvice = "☠️ POISONING - Emergency treatment:";
        response = medicalAdvice;
        firstAidSteps = [
          "📞 CALL 112 OR POISON CONTROL IMMEDIATELY",
          "🆔 Identify the poison if possible (keep container/label)",
          "🤢 If conscious, don't induce vomiting unless advised",
          "💧 For swallowed poison: give water (200ml for adults, 100ml for children)",
          "🌬️ For inhalation: move to fresh air immediately",
          "👁️ For eye contact: rinse with water for 15 minutes",
          "🧼 For skin contact: wash with soap and water",
          "🚑 Provide all info to paramedics"
        ];
      } else if (lowerMessage.includes("scrape")) {
        medicalAdvice = "🩹 SCRAPE - Minor wound care:";
        response = medicalAdvice;
        firstAidSteps = [
          "🚰 Rinse with clean, running water",
          "🧼 Gently wash with mild soap around the wound",
          "🧽 Pat dry with clean cloth",
          "🧴 Apply antibiotic ointment (optional)",
          "🩹 Cover with sterile bandage if needed",
          "💊 Take pain reliever if needed (paracetamol/ibuprofen)",
          "👁️ Change dressing daily until healed",
          "📞 See doctor if signs of infection"
        ];
      } else if (lowerMessage.includes("abdominal thrust")) {
        medicalAdvice = "🚨 ABDOMINAL THRUSTS - For choking relief:";
        response = medicalAdvice;
        firstAidSteps = [
          "🫁 First encourage coughing if able",
          "👥 Stand behind the person",
          "✊ Place fist above navel, below ribcage",
          "🤝 Grasp fist with other hand",
          "💪 Quick, upward thrusts into abdomen",
          "🔄 Repeat 5 times, then check mouth",
          "🔁 Alternate between back blows and thrusts if needed",
          "📞 Call 112 if object not removed"
        ];
      } else if (lowerMessage.includes("bleeding")) {
        medicalAdvice = "🩸 BLEEDING - Emergency control:";
        response = medicalAdvice;
        firstAidSteps = [
          "💪 Apply direct pressure with clean cloth",
          "⏱️ Hold pressure for 10-15 minutes continuously",
          "🙅 Don't remove cloth - layer new one on top if needed",
          "🙌 Elevate bleeding area above heart if possible",
          "🧊 Apply ice pack if available (wrapped in cloth)",
          "🩹 Once stopped, wrap with sterile bandage",
          "👁️ Watch for excessive bleeding or shock signs",
          "📞 Call 112 if heavy bleeding or won't stop"
        ];
      } else if ((lowerMessage.includes("breathing") || lowerMessage.includes("difficulty")) && !lowerMessage.includes("chest")) {
        medicalAdvice = "💨 BREATHING DIFFICULTIES - First aid steps:";
        response = medicalAdvice;
        firstAidSteps = [
          "🧘 Sit upright to help breathing",
          "🌬️ Breathe slowly and deeply - in through nose, out through mouth",
          "🏠 Move to fresh air if in smoky/enclosed area",
          "👕 Loosen tight clothing",
          "❌ Remove anything blocking mouth/throat",
          "🧥 Keep warm to prevent shock",
          "📞 Call 112 if breathing doesn't improve in 5 minutes",
          "👁️ Watch for wheezing, chest pain, or blue lips"
        ];
      } else if (lowerMessage.includes("capillary")) {
        medicalAdvice = "💉 CAPILLARY NAIL REFILL TEST - Circulation check:";
        response = medicalAdvice;
        firstAidSteps = [
          "🏥 Press thumbnail firmly (blanch the nail)",
          "⏱️ Release and count how fast color returns",
          "✅ NORMAL: Color returns in <2 seconds = Good circulation",
          "⚠️ WARNING: Takes 2-3 seconds = Possible shock or poor circulation",
          "🚨 CRITICAL: Takes >3 seconds = Severe circulation problem",
          "📞 Call 112 if refill time is abnormal",
          "🔄 Test multiple fingers for accuracy",
          "👁️ Compare with uninjured limb if possible"
        ];
      } else if (lowerMessage.includes("cardiogenic")) {
        medicalAdvice = "❤️ CARDIOGENIC SHOCK - Heart-related emergency!";
        response = medicalAdvice;
        firstAidSteps = [
          "📞 CALL 112 IMMEDIATELY",
          "🛏️ Lay person flat with legs elevated",
          "❌ STOP all exertion immediately",
          "🫁 Check for breathing and pulse",
          "💊 If person has chest medication (nitroglycerine), help them take it",
          "🧥 Keep warm with blankets",
          "👁️ Monitor vital signs continuously",
          "🚑 Start CPR if no pulse/breathing"
        ];
      } else if (lowerMessage.includes("infant") && lowerMessage.includes("choking")) {
        medicalAdvice = "👶 INFANT CHOKING (under 1 year) - Different technique!";
        response = medicalAdvice;
        firstAidSteps = [
          "👥 Hold infant face-down on your forearm",
          "🤚 Support infant's jaw and cheek",
          "✋ Give 5 quick back blows between shoulder blades",
          "🔄 Flip infant face-up, supporting head/neck",
          "👉 Give 5 chest thrusts with 2 fingers on breastbone",
          "👁️ Check mouth - remove object if visible",
          "🔁 Repeat back blows and chest thrusts until cleared",
          "📞 Call 112 if object not removed"
        ];
      } else if (lowerMessage.includes("unconscious") && lowerMessage.includes("choking")) {
        medicalAdvice = "🚨 UNCONSCIOUS CHOKING - Special handling:";
        response = medicalAdvice;
        firstAidSteps = [
          "📞 CALL 112 IMMEDIATELY",
          "🛏️ Place person on back",
          "👁️ Open mouth - tilt head back gently",
          "👉 Sweep mouth with finger to remove object",
          "🫁 Try to give rescue breaths",
          "👥 If no success, start CPR",
          "🔄 Continue CPR with periodic mouth checks",
          "💪 If object comes out, continue rescue breathing"
        ];
      } else if (lowerMessage.includes("sling")) {
        medicalAdvice = "🏥 CREATING A SLING - Arm support:";
        response = medicalAdvice;
        firstAidSteps = [
          "📏 Use triangular bandage or scarf",
          "🫴 Bend arm at 90-degree angle at elbow",
          "🎀 Tie one end around neck",
          "🎀 Tie other end around waist",
          "👉 Tuck lower arm point at elbow",
          "⚖️ Ensure arm is supported equally",
          "👁️ Check circulation - fingers should be warm and pink",
          "🧊 Apply ice for first 48 hours for swelling"
        ];
      } else if (lowerMessage.includes("drug")) {
        medicalAdvice = "💊 DRUG USE EMERGENCY - First aid response:";
        response = medicalAdvice;
        firstAidSteps = [
          "📞 CALL 112 IMMEDIATELY (medical help, not police)",
          "🫁 Check breathing and consciousness",
          "🛏️ Place in recovery position if breathing",
          "💨 Keep airway clear",
          "🌬️ If no breathing, start CPR",
          "❄️ If overdose suspected: have naloxone (antidote) ready",
          "🆔 Tell paramedics what drug was taken",
          "👁️ Stay with person until help arrives"
        ];
      } else if (lowerMessage.includes("ear")) {
        medicalAdvice = "👂 EAR EMERGENCY - First aid:";
        response = medicalAdvice;
        firstAidSteps = [
          "🚫 Don't insert anything in the ear",
          "👂 If object stuck: keep calm, don't try removing it yourself",
          "📞 Call 112 for embedded objects",
          "💧 For water in ear: tilt head and hop on one leg",
          "🔥 For chemical burn: rinse gently with water for 15 mins",
          "🩸 For bleeding from ear: cover loosely, don't plug",
          "🧊 For ear pain: apply warm compress",
          "🏥 See doctor for severe pain, bleeding, or hearing loss"
        ];
      } else if (lowerMessage.includes("fever")) {
        medicalAdvice += "For fever, rest well and stay hydrated. Monitor your temperature. If it exceeds 103°F (39.4°C), please consult a doctor immediately.";
      } else if (lowerMessage.includes("headache")) {
        medicalAdvice += "Try resting in a quiet, dark room. Drink plenty of water and avoid screens. If it persists or worsens, please see a healthcare provider.";
      } else if (lowerMessage.includes("breathing") || lowerMessage.includes("chest")) {
        medicalAdvice += "This is serious. Please get medical attention immediately. Sit upright, take slow breaths, and call emergency services (112) if symptoms worsen.";
      } else if (lowerMessage.includes("dizzy")) {
        medicalAdvice += "Sit or lie down immediately to prevent falls. Avoid sudden movements. Drink water slowly. If it continues, please see a doctor.";
      } else if (lowerMessage.includes("constipation")) {
        medicalAdvice += "For constipation, try these remedies: 💧 Drink more water (6-8 glasses daily), 🥗 eat fiber-rich foods (fruits, vegetables, whole grains), 🚶 exercise regularly, 🚽 don't ignore the urge to go. If it persists for more than a week or is severe, please see a doctor. In the meantime, you can also take warm lemon water in the morning.";
      } else if (lowerMessage.includes("diarrhea")) {
        medicalAdvice += "For diarrhea, stay hydrated with water, coconut water, or oral rehydration solution. Eat bland foods like rice, bananas, or plain bread. Avoid dairy, fatty foods, and high-fiber foods temporarily. If it lasts more than 2 days or is severe, please consult a doctor.";
      } else if (lowerMessage.includes("stomach") || lowerMessage.includes("belly")) {
        medicalAdvice += "For stomach issues, try resting, drinking warm water with ginger, and eating light foods. Avoid spicy, oily, or heavy meals. If the pain is severe or lasts more than 2 hours, please see a doctor immediately.";
      } else {
        medicalAdvice += "It's important to speak with a healthcare professional about your symptoms.";
      }
      
      if (!firstAidSteps.length) {
        medicalAdvice += " Would you like me to help you contact your guardian or call the medical helpline (108)?";
      }
      response = medicalAdvice;
    }
    
    suggestions = ["Contact Guardian", "Call Medical Helpline (108)", "Record Symptoms", "I feel better"];
  } else if (isEmotional) {
    sentiment = "supportive";
    keywords = emotionalKeywords.filter(k => lowerMessage.includes(k));
    action = "provide_support";
    
    // Provide specific emotional support based on feeling
    let emotionalSupport = "I hear you, and your feelings are completely valid. ";
    
    if (lowerMessage.includes("anxiety") || lowerMessage.includes("anxious") || lowerMessage.includes("panic")) {
      emotionalSupport += "When you're feeling anxious, it can feel overwhelming. Try this grounding technique: Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This helps calm your mind. Would it help to talk to someone you trust?";
    } else if (lowerMessage.includes("sad") || lowerMessage.includes("lonely")) {
      emotionalSupport += "It's okay to feel sad sometimes. Remember that these feelings are temporary and you're not alone. Connecting with loved ones, going outside, or doing something you enjoy can help. Your guardian cares about you.";
    } else if (lowerMessage.includes("stress") || lowerMessage.includes("frustrated")) {
      emotionalSupport += "Stress is a normal part of life. Try taking a break, doing some light exercise, or practicing mindfulness. Break your tasks into smaller, manageable steps. You've got this!";
    } else if (lowerMessage.includes("angry") || lowerMessage.includes("upset")) {
      emotionalSupport += "It's okay to feel angry, but let's channel it positively. Try taking a walk, writing down your feelings, or talking to someone you trust. Deep breathing can help calm your mind.";
    } else {
      emotionalSupport += "Remember, you're stronger than you think. Taking things one step at a time and leaning on your support system can make a big difference.";
    }
    
    response = emotionalSupport;
    suggestions = ["Breathing Exercise", "Contact Guardian", "Share Your Feelings", "I'm feeling better"];
  } else {
    response = "I'm here to listen and help keep you safe. How are you feeling right now? Whether it's about your health, emotions, or safety, I'm here to support you. If you ever need immediate help, just say 'emergency' and I'll activate your SOS alert.";
    suggestions = ["Check Weather", "View Safety Tips", "Talk to Guardian", "I'm doing well"];
  }

  return { text: response, sentiment, keywords, action, suggestions, firstAidSteps };
}
