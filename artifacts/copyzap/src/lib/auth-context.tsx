import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

interface User {
  id: number;
  name: string;
  email: string;
  plan: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const API_BASE = import.meta.env.VITE_API_URL || "/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("copyzap_token");
      const storedUser = localStorage.getItem("copyzap_user");

      if (stored && storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed && typeof parsed === "object" && parsed.id && parsed.email) {
          setToken(stored);
          setUser(parsed);
          setAuthTokenGetter(() => stored);
        } else {
          localStorage.removeItem("copyzap_token");
          localStorage.removeItem("copyzap_user");
        }
      }
    } catch {
      localStorage.removeItem("copyzap_token");
      localStorage.removeItem("copyzap_user");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao fazer login");
    }

    const { user: userData, token: authToken } = await res.json();
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("copyzap_token", authToken);
    localStorage.setItem("copyzap_user", JSON.stringify(userData));
    setAuthTokenGetter(() => authToken);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Erro ao criar conta");
    }

    const { user: userData, token: authToken } = await res.json();
    setUser(userData);
    setToken(authToken);
    localStorage.setItem("copyzap_token", authToken);
    localStorage.setItem("copyzap_user", JSON.stringify(userData));
    setAuthTokenGetter(() => authToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("copyzap_token");
    localStorage.removeItem("copyzap_user");
    setAuthTokenGetter(() => null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user && !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
