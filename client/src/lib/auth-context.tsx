import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { User } from "@shared/schema";
import { authAPI } from "./api";
import { applyLanguageStyles } from "./language-styles";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const { user } = await authAPI.getMe();
      setUser(user);
      if (user?.language) {
        applyLanguageStyles(user.language, user.backgroundColor ?? undefined);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
    
    // Register device token on app load
    const registerToken = async () => {
      try {
        const { getFirebaseToken } = await import('./firebase-messaging');
        const token = await getFirebaseToken();
        if (token && user) {
          await fetch('/api/device-tokens', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fcmToken: token,
              deviceName: navigator.userAgent
            })
          });
        }
      } catch (error) {
        console.warn('Firebase token registration:', error);
      }
    };
    
    registerToken();
  }, []);

  useEffect(() => {
    if (user?.language) {
      applyLanguageStyles(user.language, user.backgroundColor ?? undefined);
    }
  }, [user?.language, user?.backgroundColor]);

  const login = async (email: string, password: string) => {
    const { user } = await authAPI.login(email, password);
    setUser(user);
    
    // Register device token for push notifications
    try {
      const { getFirebaseToken } = await import('./firebase-messaging');
      const token = await getFirebaseToken();
      if (token) {
        await fetch('/api/device-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fcmToken: token,
            deviceName: navigator.userAgent
          })
        });
      }
    } catch (error) {
      console.warn('Firebase token registration skipped:', error);
    }
  };

  const logout = async () => {
    await authAPI.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
