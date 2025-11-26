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
        applyLanguageStyles(user.language, user.backgroundColor);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  useEffect(() => {
    if (user?.language) {
      applyLanguageStyles(user.language, user.backgroundColor);
    }
  }, [user?.language, user?.backgroundColor]);

  const login = async (email: string, password: string) => {
    const { user } = await authAPI.login(email, password);
    setUser(user);
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
