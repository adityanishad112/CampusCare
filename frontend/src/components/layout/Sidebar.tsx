import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, PlusCircle, ListOrdered, Inbox, Building2,
  BarChart3, User, Cpu, Bell, CheckSquare
} from "lucide-react";
import { cn } from "../../lib/utils";

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user } = useAuth();
  const role = user?.role;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 cursor-pointer",
      isActive
        ? "bg-primary text-white shadow-xs font-bold"
        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
    );

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full select-none">
      {/* Role Banner */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
          Portal Workspace
        </div>
        <div className="font-bold text-sm text-slate-900 capitalize mt-0.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          {role === "student" && "Student Self-Service"}
          {role === "staff" && `${user?.department_name || "Department"} Staff`}
          {role === "admin" && "Central Administration"}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto" onClick={onCloseMobile}>
        {/* STUDENT LINKS */}
        {role === "student" && (
          <>
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Student Hub
            </div>
            <NavLink to="/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              Overview
            </NavLink>
            <NavLink to="/complaints/new" className={linkClass}>
              <PlusCircle className="w-4 h-4 text-accent" />
              Submit New Complaint
            </NavLink>
            <NavLink to="/complaints" className={linkClass}>
              <ListOrdered className="w-4 h-4" />
              My Complaints
            </NavLink>
          </>
        )}

        {/* STAFF LINKS */}
        {role === "staff" && (
          <>
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Department Operations
            </div>
            <NavLink to="/staff/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              Workload Overview
            </NavLink>
            <NavLink to="/staff/queue" className={linkClass}>
              <Inbox className="w-4 h-4" />
              Department Queue
            </NavLink>
            <NavLink to="/complaints?assigned_to_me=true" className={linkClass}>
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Assigned to Me
            </NavLink>
          </>
        )}

        {/* ADMIN LINKS */}
        {role === "admin" && (
          <>
            <div className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              System Management
            </div>
            <NavLink to="/admin/dashboard" className={linkClass}>
              <LayoutDashboard className="w-4 h-4" />
              Admin Overview
            </NavLink>
            <NavLink to="/complaints" className={linkClass}>
              <ListOrdered className="w-4 h-4" />
              All Complaints
            </NavLink>
            <NavLink to="/admin/departments" className={linkClass}>
              <Building2 className="w-4 h-4" />
              Departments & Staff
            </NavLink>
            <NavLink to="/admin/analytics" className={linkClass}>
              <BarChart3 className="w-4 h-4 text-primary" />
              Analytics & Reports
            </NavLink>
          </>
        )}

        {/* COMMON LINKS */}
        <div className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Account
        </div>
        <NavLink to="/notifications" className={linkClass}>
          <Bell className="w-4 h-4" />
          Notifications
        </NavLink>
        <NavLink to="/profile" className={linkClass}>
          <User className="w-4 h-4" />
          My Profile
        </NavLink>
      </nav>

      {/* Model & System Info Card for Presentation */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 mb-1">
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span>CampusCare AI Core</span>
        </div>
        <p className="text-[10px] leading-tight text-slate-500">
          TF-IDF + Logistic Regression Classifier (Macro F1: 0.9489)
        </p>
      </div>
    </aside>
  );
};
