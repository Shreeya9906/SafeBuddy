import type { User, Guardian, SOSAlert, SOSLocation, HealthVital, PoliceComplaint, WeatherAlert, MyBuddyLog } from "@shared/schema";

const API_BASE = "/api";

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "An error occurred" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const authAPI = {
  register: (data: { email: string; password: string; name: string; age?: number; profileMode?: string }) =>
    fetchAPI("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  
  login: (email: string, password: string) =>
    fetchAPI("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  
  logout: () => fetchAPI("/auth/logout", { method: "POST" }),
  
  getMe: (): Promise<{ user: User }> => fetchAPI("/auth/me"),
};

export const userAPI = {
  updateProfile: (data: Partial<User>) =>
    fetchAPI("/user/profile", { method: "PATCH", body: JSON.stringify(data) }),
};

export const guardianAPI = {
  getAll: (): Promise<Guardian[]> => fetchAPI("/guardians"),
  
  create: (data: { name: string; phone: string; email?: string; relationship?: string; isPrimary?: boolean }) =>
    fetchAPI("/guardians", { method: "POST", body: JSON.stringify(data) }),
  
  delete: (id: string) => fetchAPI(`/guardians/${id}`, { method: "DELETE" }),
};

export const sosAPI = {
  getActive: (): Promise<SOSAlert | null> => fetchAPI("/sos/active"),
  
  create: (data: { triggerMethod: string; latitude: number; longitude: number; address?: string; batteryLevel?: number }) =>
    fetchAPI("/sos", { method: "POST", body: JSON.stringify(data) }),
  
  update: (id: string, data: Partial<SOSAlert>) =>
    fetchAPI(`/sos/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  
  addLocation: (sosId: string, data: { latitude: number; longitude: number; accuracy?: number; batteryLevel?: number }) =>
    fetchAPI(`/sos/${sosId}/locations`, { method: "POST", body: JSON.stringify(data) }),
  
  getLocations: (sosId: string): Promise<SOSLocation[]> => fetchAPI(`/sos/${sosId}/locations`),
};

export const healthAPI = {
  getVitals: (limit?: number): Promise<HealthVital[]> => 
    fetchAPI(`/health/vitals${limit ? `?limit=${limit}` : ""}`),
  
  addVital: (data: Partial<HealthVital>) =>
    fetchAPI("/health/vitals", { method: "POST", body: JSON.stringify(data) }),
};

export const complaintAPI = {
  getAll: (): Promise<PoliceComplaint[]> => fetchAPI("/complaints"),
  
  create: (data: Partial<PoliceComplaint>) =>
    fetchAPI("/complaints", { method: "POST", body: JSON.stringify(data) }),
  
  update: (id: string, data: Partial<PoliceComplaint>) =>
    fetchAPI(`/complaints/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const weatherAPI = {
  getAlerts: (): Promise<WeatherAlert[]> => fetchAPI("/weather/alerts"),
  
  getLiveWeather: (lat: number, lon: number, city: string): Promise<any> =>
    fetchAPI(`/weather/live?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}`),
};

export const mybuddyAPI = {
  getLogs: (limit?: number): Promise<MyBuddyLog[]> => 
    fetchAPI(`/mybuddy/logs${limit ? `?limit=${limit}` : ""}`),
  
  chat: (message: string, context?: string): Promise<MyBuddyLog & { suggestions: string[] }> =>
    fetchAPI("/mybuddy/chat", { method: "POST", body: JSON.stringify({ message, context }) }),
};

export const childrenAPI = {
  getAll: (): Promise<User[]> => fetchAPI("/children"),
  getElders: (): Promise<User[]> => fetchAPI("/elders"),
};

export const emergencyAPI = {
  callEmergency: (sosId: string, phoneNumbers: string[]) =>
    fetchAPI(`/sos/${sosId}/call-emergency`, { 
      method: "POST", 
      body: JSON.stringify({ phoneNumbers }) 
    }),
  
  notifyGuardians: (sosId: string) =>
    fetchAPI(`/sos/${sosId}/notify-guardians`, { method: "POST" }),
};
