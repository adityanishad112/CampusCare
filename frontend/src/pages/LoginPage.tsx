import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, DEMO_CREDENTIALS } from "../context/AuthContext";
import { Shield, Lock, Mail, ArrowRight, Sparkles, CheckCircle2, UserCheck } from "lucide-react";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Alert } from "../components/ui/Alert";

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "staff") navigate("/staff/dashboard");
      else navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = async (creds: { email: string; password: string }) => {
    setEmail(creds.email);
    setPassword(creds.password);
    setError(null);
    setLoading(true);
    try {
      await login(creds.email, creds.password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary text-white shadow-card mb-3">
          <Shield className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">CampusCare</h1>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          AI-Based Campus Complaint Management Portal
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-elevated rounded-2xl border border-slate-200 sm:px-10">
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <Alert variant="error">{error}</Alert>}

            <Input
              label="University Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex.student@campuscare.edu"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
            />

            <Button type="submit" variant="primary" className="w-full" isLoading={loading}>
              Sign In to Portal
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <div className="mt-6 text-center border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-600">
              New student?{" "}
              <Link to="/register" className="font-bold text-primary hover:underline">
                Create a student account
              </Link>
            </p>
          </div>

          {/* Quick Demo Fill for Viva/Evaluators */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>1-Click Evaluator Demo Accounts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleFillDemo(DEMO_CREDENTIALS.student)}
                className="p-2 border border-slate-200 hover:border-primary hover:bg-blue-50/50 rounded-lg text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-primary">Student</div>
                <div className="text-[10px] text-slate-400 truncate">alex.student@campuscare.edu</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo(DEMO_CREDENTIALS.it_staff)}
                className="p-2 border border-slate-200 hover:border-teal-600 hover:bg-teal-50/50 rounded-lg text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-teal-700">IT Staff</div>
                <div className="text-[10px] text-slate-400 truncate">it_staff@campuscare.edu</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo(DEMO_CREDENTIALS.elec_staff)}
                className="p-2 border border-slate-200 hover:border-amber-600 hover:bg-amber-50/50 rounded-lg text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-amber-700">Electrical Staff</div>
                <div className="text-[10px] text-slate-400 truncate">electrical_staff@campuscare.edu</div>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo(DEMO_CREDENTIALS.admin)}
                className="p-2 border border-slate-200 hover:border-purple-600 hover:bg-purple-50/50 rounded-lg text-left transition-all cursor-pointer"
              >
                <div className="font-bold text-purple-700">Administrator</div>
                <div className="text-[10px] text-slate-400 truncate">admin@campuscare.edu</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
