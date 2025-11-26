import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, real, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  age: integer("age"),
  profileMode: text("profile_mode").notNull().default("adult"),
  language: text("language").notNull().default("en_IN"),
  theme: text("theme").default("light"),
  fontSize: text("font_size").default("medium"),
  backgroundColor: text("background_color").default("bg-white"),
  voiceEnabled: boolean("voice_enabled").default(true),
  ttsEnabled: boolean("tts_enabled").default(true),
  mybuddyEnabled: boolean("mybuddy_enabled").default(true),
  mybuddyFrequency: integer("mybuddy_frequency").default(120),
  bloodType: text("blood_type"),
  allergies: text("allergies").array(),
  medicalConditions: text("medical_conditions").array(),
  emergencyNumbers: text("emergency_numbers").array().default(sql`ARRAY['100', '108', '112', '1091']::text[]`),
  consentVoiceRecording: boolean("consent_voice_recording").default(false),
  consentLocationTracking: boolean("consent_location_tracking").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const guardians = pgTable("guardians", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  relationship: text("relationship"),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertGuardianSchema = createInsertSchema(guardians).omit({
  id: true,
  createdAt: true,
});

export type InsertGuardian = z.infer<typeof insertGuardianSchema>;
export type Guardian = typeof guardians.$inferSelect;

export const sosAlerts = pgTable("sos_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("active"),
  triggerMethod: text("trigger_method").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  address: text("address"),
  batteryLevel: integer("battery_level"),
  notificationsSent: boolean("notifications_sent").default(false),
  emergencyServicesCalled: boolean("emergency_services_called").default(false),
  notes: text("notes"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSOSAlertSchema = createInsertSchema(sosAlerts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSOSAlert = z.infer<typeof insertSOSAlertSchema>;
export type SOSAlert = typeof sosAlerts.$inferSelect;

export const sosLocations = pgTable("sos_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sosAlertId: varchar("sos_alert_id").notNull().references(() => sosAlerts.id, { onDelete: "cascade" }),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  accuracy: real("accuracy"),
  altitude: real("altitude"),
  speed: real("speed"),
  batteryLevel: integer("battery_level"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertSOSLocationSchema = createInsertSchema(sosLocations).omit({
  id: true,
});

export type InsertSOSLocation = z.infer<typeof insertSOSLocationSchema>;
export type SOSLocation = typeof sosLocations.$inferSelect;

export const healthVitals = pgTable("health_vitals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  heartRate: integer("heart_rate"),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  oxygenSaturation: integer("oxygen_saturation"),
  temperature: real("temperature"),
  steps: integer("steps"),
  source: text("source").default("manual"),
  fallDetected: boolean("fall_detected").default(false),
  alertTriggered: boolean("alert_triggered").default(false),
  notes: text("notes"),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const insertHealthVitalSchema = createInsertSchema(healthVitals).omit({
  id: true,
});

export type InsertHealthVital = z.infer<typeof insertHealthVitalSchema>;
export type HealthVital = typeof healthVitals.$inferSelect;

export const policeComplaints = pgTable("police_complaints", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  complaintText: text("complaint_text").notNull(),
  incidentDate: timestamp("incident_date"),
  incidentLocation: text("incident_location"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  category: text("category"),
  witnesses: text("witnesses"),
  evidenceUrls: text("evidence_urls").array(),
  pdfUrl: text("pdf_url"),
  status: text("status").default("draft"),
  filedAt: timestamp("filed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPoliceComplaintSchema = createInsertSchema(policeComplaints).omit({
  id: true,
  createdAt: true,
});

export type InsertPoliceComplaint = z.infer<typeof insertPoliceComplaintSchema>;
export type PoliceComplaint = typeof policeComplaints.$inferSelect;

export const weatherAlerts = pgTable("weather_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  alertType: text("alert_type").notNull(),
  severity: text("severity").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").array(),
  affectedAreas: text("affected_areas").array(),
  latitude: real("latitude"),
  longitude: real("longitude"),
  radius: real("radius"),
  startTime: timestamp("start_time"),
  endTime: timestamp("end_time"),
  source: text("source"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertWeatherAlertSchema = createInsertSchema(weatherAlerts).omit({
  id: true,
  createdAt: true,
});

export type InsertWeatherAlert = z.infer<typeof insertWeatherAlertSchema>;
export type WeatherAlert = typeof weatherAlerts.$inferSelect;

export const mybuddyLogs = pgTable("mybuddy_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  message: text("message").notNull(),
  response: text("response").notNull(),
  messageType: text("message_type").default("text"),
  context: text("context"),
  sentiment: text("sentiment"),
  keywords: text("keywords").array(),
  actionTaken: text("action_taken"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMyBuddyLogSchema = createInsertSchema(mybuddyLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertMyBuddyLog = z.infer<typeof insertMyBuddyLogSchema>;
export type MyBuddyLog = typeof mybuddyLogs.$inferSelect;

export const parentChildLinks = pgTable("parent_child_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentId: varchar("parent_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  childId: varchar("child_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  relationship: text("relationship").default("parent"),
  canViewLocation: boolean("can_view_location").default(true),
  canReceiveAlerts: boolean("can_receive_alerts").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertParentChildLinkSchema = createInsertSchema(parentChildLinks).omit({
  id: true,
  createdAt: true,
});

export type InsertParentChildLink = z.infer<typeof insertParentChildLinkSchema>;
export type ParentChildLink = typeof parentChildLinks.$inferSelect;
