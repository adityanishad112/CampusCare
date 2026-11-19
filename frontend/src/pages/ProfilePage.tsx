import React from "react";
import { useAuth } from "../context/AuthContext";
import { User, Shield, Briefcase, GraduationCap, CheckCircle2, Clock } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { formatDate } from "../lib/utils";

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">User Profile</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Account credentials and role-based permissions in CampusCare
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-xl shadow-card">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{user?.full_name}</h2>
              <p className="text-xs text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-primary-dark">
                  {user?.role}
                </span>
                {user?.department_name && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                    {user.department_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4 border-t border-slate-100 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">ACCOUNT ID</span>
              <span className="font-mono text-slate-900 font-bold">USR-{user?.id.toString().padStart(4, "0")}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">STATUS</span>
              <span className="text-emerald-700 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active & Verified
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">REGISTERED ON</span>
              <span className="font-mono text-slate-700">{user && formatDate(user.created_at)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] font-semibold">DATA ACCESS LEVEL</span>
              <span className="text-slate-800 font-medium capitalize">
                {user?.role === "student" && "Isolated Student Record Access"}
                {user?.role === "staff" && "Departmental Queue Access"}
                {user?.role === "admin" && "Global Administrative Authorization"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Guide */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Assigned Role Capabilities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-xs text-slate-700 leading-relaxed">
          {user?.role === "student" && (
            <ul className="list-disc pl-5 space-y-1">
              <li>Submit maintenance complaints with real-time AI category suggestions and rule-based priorities.</li>
              <li>Track complaints through live visual status timeline.</li>
              <li>Add student comments and reply to staff questions.</li>
              <li>Reopen resolved complaints with mandatory justification.</li>
              <li>Rate resolution quality with 1 to 5-star feedback.</li>
              <li>Strict privacy isolation: other students cannot view your personal complaints.</li>
            </ul>
          )}
          {user?.role === "staff" && (
            <ul className="list-disc pl-5 space-y-1">
              <li>View and manage complaints assigned to {user.department_name}.</li>
              <li>Claim unassigned tickets and update status (In Progress, Resolved).</li>
              <li>Add public responses or confidential internal staff notes.</li>
              <li>Provide resolution explanations upon completion.</li>
              <li>Detect and link duplicate complaints manually.</li>
            </ul>
          )}
          {user?.role === "admin" && (
            <ul className="list-disc pl-5 space-y-1">
              <li>Global visibility across all university complaint queues.</li>
              <li>Manage department routing codes and staff assignments.</li>
              <li>Review low-confidence AI predictions (&lt;60%) and reassign departments.</li>
              <li>Override suggested categories and priorities with audit logging.</li>
              <li>Export filtered complaint analytics as CSV reports.</li>
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
