import { db } from "../db";
import { eq, and, desc } from "drizzle-orm";
import {
  type User,
  type InsertUser,
  type Guardian,
  type InsertGuardian,
  type SOSAlert,
  type InsertSOSAlert,
  type SOSLocation,
  type InsertSOSLocation,
  type HealthVital,
  type InsertHealthVital,
  type PoliceComplaint,
  type InsertPoliceComplaint,
  type WeatherAlert,
  type InsertWeatherAlert,
  type MyBuddyLog,
  type InsertMyBuddyLog,
  type ParentChildLink,
  type InsertParentChildLink,
  type MedicineReminder,
  type InsertMedicineReminder,
  type GuardianEmergencyAlert,
  type InsertGuardianEmergencyAlert,
  type HealthAlert,
  type InsertHealthAlert,
  users,
  guardians,
  sosAlerts,
  sosLocations,
  healthVitals,
  policeComplaints,
  weatherAlerts,
  mybuddyLogs,
  parentChildLinks,
  medicineReminders,
  guardianEmergencyAlerts,
  healthAlerts,
} from "@shared/schema";

export interface IStorage {
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByPhone(phone: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  
  getGuardiansByUserId(userId: string): Promise<Guardian[]>;
  createGuardian(guardian: InsertGuardian): Promise<Guardian>;
  deleteGuardian(id: string): Promise<void>;
  
  getActiveSOSByUserId(userId: string): Promise<SOSAlert | undefined>;
  getSOSById(id: string): Promise<SOSAlert | undefined>;
  createSOSAlert(alert: InsertSOSAlert): Promise<SOSAlert>;
  updateSOSAlert(id: string, alert: Partial<InsertSOSAlert>): Promise<SOSAlert | undefined>;
  
  addSOSLocation(location: InsertSOSLocation): Promise<SOSLocation>;
  getSOSLocations(sosAlertId: string): Promise<SOSLocation[]>;
  
  getHealthVitalsByUserId(userId: string, limit?: number): Promise<HealthVital[]>;
  createHealthVital(vital: InsertHealthVital): Promise<HealthVital>;
  
  getHealthAlertsByUserId(userId: string, limit?: number): Promise<HealthAlert[]>;
  createHealthAlert(alert: InsertHealthAlert): Promise<HealthAlert>;
  updateHealthAlert(id: string, alert: Partial<InsertHealthAlert>): Promise<HealthAlert | undefined>;
  
  getPoliceComplaintsByUserId(userId: string): Promise<PoliceComplaint[]>;
  createPoliceComplaint(complaint: InsertPoliceComplaint): Promise<PoliceComplaint>;
  updatePoliceComplaint(id: string, complaint: Partial<InsertPoliceComplaint>): Promise<PoliceComplaint | undefined>;
  
  getActiveWeatherAlerts(): Promise<WeatherAlert[]>;
  createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert>;
  
  getMyBuddyLogsByUserId(userId: string, limit?: number): Promise<MyBuddyLog[]>;
  createMyBuddyLog(log: InsertMyBuddyLog): Promise<MyBuddyLog>;
  
  getChildrenByParentId(parentId: string): Promise<User[]>;
  createParentChildLink(link: InsertParentChildLink): Promise<ParentChildLink>;

  getMedicineRemindersByUserId(userId: string): Promise<MedicineReminder[]>;
  createMedicineReminder(reminder: InsertMedicineReminder): Promise<MedicineReminder>;
  updateMedicineReminder(id: string, reminder: Partial<InsertMedicineReminder>): Promise<MedicineReminder | undefined>;
  deleteMedicineReminder(id: string): Promise<void>;

  createGuardianEmergencyAlert(alert: InsertGuardianEmergencyAlert): Promise<GuardianEmergencyAlert>;
  getGuardianEmergencyAlertsByUserId(userId: string): Promise<GuardianEmergencyAlert[]>;
  updateGuardianEmergencyAlert(id: string, alert: Partial<InsertGuardianEmergencyAlert>): Promise<GuardianEmergencyAlert | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByPhone(phone: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.phone, phone));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: string, updateData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getGuardiansByUserId(userId: string): Promise<Guardian[]> {
    return await db.select().from(guardians).where(eq(guardians.userId, userId));
  }

  async createGuardian(guardian: InsertGuardian): Promise<Guardian> {
    const [newGuardian] = await db.insert(guardians).values(guardian).returning();
    return newGuardian;
  }

  async deleteGuardian(id: string): Promise<void> {
    await db.delete(guardians).where(eq(guardians.id, id));
  }

  async getActiveSOSByUserId(userId: string): Promise<SOSAlert | undefined> {
    const [alert] = await db
      .select()
      .from(sosAlerts)
      .where(and(eq(sosAlerts.userId, userId), eq(sosAlerts.status, "active")))
      .orderBy(desc(sosAlerts.createdAt))
      .limit(1);
    return alert;
  }

  async getSOSById(id: string): Promise<SOSAlert | undefined> {
    const [alert] = await db.select().from(sosAlerts).where(eq(sosAlerts.id, id));
    return alert;
  }

  async createSOSAlert(alert: InsertSOSAlert): Promise<SOSAlert> {
    const [newAlert] = await db.insert(sosAlerts).values(alert).returning();
    return newAlert;
  }

  async updateSOSAlert(id: string, updateData: Partial<InsertSOSAlert>): Promise<SOSAlert | undefined> {
    const [alert] = await db
      .update(sosAlerts)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(sosAlerts.id, id))
      .returning();
    return alert;
  }

  async addSOSLocation(location: InsertSOSLocation): Promise<SOSLocation> {
    const [newLocation] = await db.insert(sosLocations).values(location).returning();
    return newLocation;
  }

  async getSOSLocations(sosAlertId: string): Promise<SOSLocation[]> {
    return await db
      .select()
      .from(sosLocations)
      .where(eq(sosLocations.sosAlertId, sosAlertId))
      .orderBy(desc(sosLocations.timestamp));
  }

  async getHealthVitalsByUserId(userId: string, limit: number = 50): Promise<HealthVital[]> {
    return await db
      .select()
      .from(healthVitals)
      .where(eq(healthVitals.userId, userId))
      .orderBy(desc(healthVitals.recordedAt))
      .limit(limit);
  }

  async createHealthVital(vital: InsertHealthVital): Promise<HealthVital> {
    const [newVital] = await db.insert(healthVitals).values(vital).returning();
    return newVital;
  }

  async getPoliceComplaintsByUserId(userId: string): Promise<PoliceComplaint[]> {
    return await db
      .select()
      .from(policeComplaints)
      .where(eq(policeComplaints.userId, userId))
      .orderBy(desc(policeComplaints.createdAt));
  }

  async createPoliceComplaint(complaint: InsertPoliceComplaint): Promise<PoliceComplaint> {
    const [newComplaint] = await db.insert(policeComplaints).values(complaint).returning();
    return newComplaint;
  }

  async updatePoliceComplaint(
    id: string,
    updateData: Partial<InsertPoliceComplaint>
  ): Promise<PoliceComplaint | undefined> {
    const [complaint] = await db
      .update(policeComplaints)
      .set(updateData)
      .where(eq(policeComplaints.id, id))
      .returning();
    return complaint;
  }

  async getActiveWeatherAlerts(): Promise<WeatherAlert[]> {
    const now = new Date();
    return await db
      .select()
      .from(weatherAlerts)
      .orderBy(desc(weatherAlerts.createdAt))
      .limit(20);
  }

  async createWeatherAlert(alert: InsertWeatherAlert): Promise<WeatherAlert> {
    const [newAlert] = await db.insert(weatherAlerts).values(alert).returning();
    return newAlert;
  }

  async getMyBuddyLogsByUserId(userId: string, limit: number = 50): Promise<MyBuddyLog[]> {
    return await db
      .select()
      .from(mybuddyLogs)
      .where(eq(mybuddyLogs.userId, userId))
      .orderBy(desc(mybuddyLogs.createdAt))
      .limit(limit);
  }

  async createMyBuddyLog(log: InsertMyBuddyLog): Promise<MyBuddyLog> {
    const [newLog] = await db.insert(mybuddyLogs).values(log).returning();
    return newLog;
  }

  async getChildrenByParentId(parentId: string): Promise<User[]> {
    const links = await db
      .select()
      .from(parentChildLinks)
      .where(eq(parentChildLinks.parentId, parentId));
    
    if (links.length === 0) return [];
    
    const childIds = links.map((link: ParentChildLink) => link.childId);
    const children: User[] = [];
    
    for (const childId of childIds) {
      const [child] = await db
        .select()
        .from(users)
        .where(eq(users.id, childId));
      if (child) children.push(child);
    }
    
    return children;
  }

  async createParentChildLink(link: InsertParentChildLink): Promise<ParentChildLink> {
    const [newLink] = await db.insert(parentChildLinks).values(link).returning();
    return newLink;
  }

  async getMedicineRemindersByUserId(userId: string): Promise<MedicineReminder[]> {
    return await db.select().from(medicineReminders).where(eq(medicineReminders.userId, userId));
  }

  async createMedicineReminder(reminder: InsertMedicineReminder): Promise<MedicineReminder> {
    const [newReminder] = await db.insert(medicineReminders).values(reminder).returning();
    return newReminder;
  }

  async updateMedicineReminder(id: string, reminder: Partial<InsertMedicineReminder>): Promise<MedicineReminder | undefined> {
    const [updated] = await db.update(medicineReminders).set(reminder).where(eq(medicineReminders.id, id)).returning();
    return updated;
  }

  async deleteMedicineReminder(id: string): Promise<void> {
    await db.delete(medicineReminders).where(eq(medicineReminders.id, id));
  }

  async createGuardianEmergencyAlert(alert: InsertGuardianEmergencyAlert): Promise<GuardianEmergencyAlert> {
    const [newAlert] = await db.insert(guardianEmergencyAlerts).values(alert).returning();
    return newAlert;
  }

  async getGuardianEmergencyAlertsByUserId(userId: string): Promise<GuardianEmergencyAlert[]> {
    return await db.select().from(guardianEmergencyAlerts)
      .where(eq(guardianEmergencyAlerts.userId, userId))
      .orderBy(desc(guardianEmergencyAlerts.createdAt));
  }

  async updateGuardianEmergencyAlert(id: string, updateData: Partial<InsertGuardianEmergencyAlert>): Promise<GuardianEmergencyAlert | undefined> {
    const [alert] = await db.update(guardianEmergencyAlerts)
      .set(updateData)
      .where(eq(guardianEmergencyAlerts.id, id))
      .returning();
    return alert;
  }

  async getHealthAlertsByUserId(userId: string, limit: number = 50): Promise<HealthAlert[]> {
    return await db
      .select()
      .from(healthAlerts)
      .where(eq(healthAlerts.userId, userId))
      .orderBy(desc(healthAlerts.createdAt))
      .limit(limit);
  }

  async createHealthAlert(alert: InsertHealthAlert): Promise<HealthAlert> {
    const [newAlert] = await db.insert(healthAlerts).values(alert).returning();
    return newAlert;
  }

  async updateHealthAlert(id: string, updateData: Partial<InsertHealthAlert>): Promise<HealthAlert | undefined> {
    const [alert] = await db.update(healthAlerts).set(updateData).where(eq(healthAlerts.id, id)).returning();
    return alert;
  }
}

export const storage = new DatabaseStorage();
