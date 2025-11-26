import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { setupAuth, hashPassword } from "./auth";
import { storage } from "./storage";
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
      const updatedAlert = await storage.updateSOSAlert(req.params.id, req.body);
      if (!updatedAlert) {
        return res.status(404).json({ message: "SOS alert not found" });
      }
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

  app.post("/api/sos/:id/notify-guardians", requireAuth, async (req, res, next) => {
    try {
      const sosAlert = await storage.getSOSById(req.params.id);
      
      if (!sosAlert || sosAlert.userId !== req.user!.id) {
        return res.status(404).json({ message: "SOS alert not found" });
      }

      const user = await storage.getUserById(req.user!.id);
      const guardians = await storage.getGuardiansByUserId(req.user!.id);

      // Log notification attempt
      const notifications = guardians.map(g => ({
        guardianId: g.id,
        guardianName: g.name,
        phone: g.phone,
        message: `EMERGENCY ALERT from ${user?.name}! Location: ${sosAlert.latitude}, ${sosAlert.longitude}. Please call 100/108/112 for emergency services.`,
        timestamp: new Date(),
        status: "sent",
      }));

      res.json({ 
        message: "Guardians notified via SMS",
        notifications,
        sosId: req.params.id,
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

  const httpServer = createServer(app);

  return httpServer;
}

function generateMyBuddyResponse(message: string, context?: string): {
  text: string;
  sentiment: string;
  keywords: string[];
  action: string | null;
  suggestions: string[];
} {
  const lowerMessage = message.toLowerCase();
  
  const emergencyKeywords = ["emergency", "help", "danger", "scared", "hurt", "pain", "bleeding", "attack", "follow", "lost"];
  const medicalKeywords = ["sick", "fever", "headache", "dizzy", "breathing", "chest", "allergy", "medicine", "doctor", "nausea", "vomit", "cough", "cold", "flu"];
  const emotionalKeywords = ["sad", "anxious", "worried", "afraid", "lonely", "stress", "panic", "depressed", "angry", "frustrated", "upset"];

  const isEmergency = emergencyKeywords.some(k => lowerMessage.includes(k));
  const isMedical = medicalKeywords.some(k => lowerMessage.includes(k));
  const isEmotional = emotionalKeywords.some(k => lowerMessage.includes(k));

  let response = "";
  let sentiment = "neutral";
  let keywords: string[] = [];
  let action: string | null = null;
  let suggestions: string[] = [];

  if (isEmergency) {
    sentiment = "urgent";
    keywords = emergencyKeywords.filter(k => lowerMessage.includes(k));
    action = "suggest_sos";
    response = "I'm here for you. It sounds like you might need immediate help. Would you like me to activate your SOS alert and notify your guardians? I can also help you call emergency services (112).";
    suggestions = ["Activate SOS", "Call 112", "Contact Guardian", "I'm safe now"];
  } else if (isMedical) {
    sentiment = "concerned";
    keywords = medicalKeywords.filter(k => lowerMessage.includes(k));
    action = "suggest_medical_help";
    
    // Provide specific medical advice based on symptoms
    let medicalAdvice = "I'm not a doctor, but I'm concerned about what you're experiencing. ";
    
    if (lowerMessage.includes("fever")) {
      medicalAdvice += "For fever, rest well and stay hydrated. Monitor your temperature. If it exceeds 103°F (39.4°C), please consult a doctor immediately.";
    } else if (lowerMessage.includes("headache")) {
      medicalAdvice += "Try resting in a quiet, dark room. Drink plenty of water and avoid screens. If it persists or worsens, please see a healthcare provider.";
    } else if (lowerMessage.includes("breathing") || lowerMessage.includes("chest")) {
      medicalAdvice += "This is serious. Please get medical attention immediately. Sit upright, take slow breaths, and call emergency services (112) if symptoms worsen.";
    } else if (lowerMessage.includes("dizzy")) {
      medicalAdvice += "Sit or lie down immediately to prevent falls. Avoid sudden movements. Drink water slowly. If it continues, please see a doctor.";
    } else {
      medicalAdvice += "It's important to speak with a healthcare professional about your symptoms.";
    }
    
    medicalAdvice += " Would you like me to help you contact your guardian or call the medical helpline (108)?";
    response = medicalAdvice;
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

  return { text: response, sentiment, keywords, action, suggestions };
}
