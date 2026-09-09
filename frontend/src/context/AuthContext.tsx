import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { api } from "../services/api";

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string) => Promise<void>;
  logout: () => void;
  switchDemoUser: (role: UserRole, deptCode?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const DEMO_CREDENTIALS = {
  admin: { email: "admin@campuscare.edu", password: "Admin@123", label: "Admin (Dean of Student Affairs)" },
  it_staff: { email: "it_staff@campuscare.edu", password: "Staff@123", label: "Staff (IT Department)" },
  elec_staff: { email: "electrical_staff@campuscare.edu", password: "Staff@123", label: "Staff (Electrical Dept)" },
  hostel_staff: { email: "hostel_staff@campuscare.edu", password: "Staff@123", label: "Staff (Hostel Dept)" },
  student: { email: "alex.student@campuscare.edu", password: "Student@123", label: "Student (Alex Mercer)" },
  student2: { email: "maria.student@campuscare.edu", password: "Student@123", label: "Student (Maria Rodriguez)" },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("campuscare_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("campuscare_token");
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const profile = await api.getCurrentUser();
          setUser(profile);
          localStorage.setItem("campuscare_user", JSON.stringify(profile));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };
    verifyAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login({ email, password });
    setToken(res.access_token);
    setUser(res.user);
    localStorage.setItem("campuscare_token", res.access_token);
    localStorage.setItem("campuscare_user", JSON.stringify(res.user));
  };

  const register = async (email: string, password: string, full_name: string) => {
    await api.register({ email, password, full_name });
    // Automatically log in after registration
    await login(email, password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("campuscare_token");
    localStorage.removeItem("campuscare_user");
  };

  const switchDemoUser = async (role: UserRole, deptCode?: string) => {
    let creds = DEMO_CREDENTIALS.student;
    if (role === "admin") {
      creds = DEMO_CREDENTIALS.admin;
    } else if (role === "staff") {
      if (deptCode === "ELEC") creds = DEMO_CREDENTIALS.elec_staff;
      else if (deptCode === "HOSTEL") creds = DEMO_CREDENTIALS.hostel_staff;
      else creds = DEMO_CREDENTIALS.it_staff;
    }
    await login(creds.email, creds.password);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, switchDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
