"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import api from "./api";
import React from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  oabNumber?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ mustChangePassword?: boolean }>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("juris_token");
    const savedUser = localStorage.getItem("juris_user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("juris_token");
        localStorage.removeItem("juris_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      try {
        const response = await api.post("/auth/login", { email, password });
        const { access_token, user: userData, mustChangePassword } = response.data;

        localStorage.setItem("juris_token", access_token);
        localStorage.setItem("juris_user", JSON.stringify(userData));
        setUser(userData);

        if (mustChangePassword) {
          return { mustChangePassword: true };
        }

        router.push("/dashboard");
        return {};
      } catch (err: any) {
        // Modo demo: se a API nao estiver disponivel, permite acesso com credenciais demo
        if (!err.response && email === "admin@juris.local") {
          const demoUser = {
            id: "demo",
            name: "Dr. Carlos Silva (Demo)",
            email: "admin@juris.local",
            role: "ADMIN",
            oabNumber: "OAB/SP 123.456",
          };
          localStorage.setItem("juris_token", "demo-token");
          localStorage.setItem("juris_user", JSON.stringify(demoUser));
          setUser(demoUser);
          router.push("/dashboard");
          return {};
        }
        throw err;
      }
    },
    [router]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("juris_token");
    localStorage.removeItem("juris_user");
    setUser(null);
    router.push("/login");
  }, [router]);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      },
    },
    children
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
