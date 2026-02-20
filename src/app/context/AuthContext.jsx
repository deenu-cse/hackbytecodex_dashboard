"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const codexdashtoken = localStorage.getItem("codexdashtoken");
      if (codexdashtoken) {
        try {
          const response = await fetch(`${API_URL}/auth/me`, {
            headers: {
              Authorization: `Bearer ${codexdashtoken}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.data);
          } else {
            // Token expired or invalid - clear it
            localStorage.removeItem("codexdashtoken");
            setUser(null);
          }
        } catch (err) {
          console.error("Auth init error:", err);
          localStorage.removeItem("codexdashtoken");
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      localStorage.setItem("codexdashtoken", data.token);
      setUser(data.user);
      router.push("/dashboard");
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("codexdashtoken");
    setUser(null);
    router.push("/login");
  };

  const updateUser = (updatedData) => {
    setUser(prev => ({ ...prev, ...updatedData }));
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isSuperAdmin: user?.role === "SUPER_ADMIN",
    isCoreTeam: user?.role === "CORE_TEAM" || user?.role === "SUPER_ADMIN",
    isCollegeLead: user?.role === "COLLEGE_LEAD",
    isClubAdmin: user?.role === "CLUB_ADMIN",
    isMentor: user?.role === "MENTOR",
    isStudent: user?.role === "STUDENT",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};