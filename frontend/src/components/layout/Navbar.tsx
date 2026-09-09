import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, DEMO_CREDENTIALS } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import {
  Bell, LogOut, User as UserIcon, Shield, Briefcase, GraduationCap,
  Menu, X, Check, ExternalLink
} from "lucide-react";
import { formatDate } from "../../lib/utils";

interface NavbarProps {
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout, switchDemoUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6 shadow-xs">
      {/* Left side: Hamburger + Brand */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-white shadow-xs group-hover:bg-primary-hover transition-colors">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-base tracking-tight text-primary-dark">CampusCare</span>
            <span className="hidden sm:inline-block ml-1.5 px-1.5 py-0.2 bg-blue-100 text-blue-800 text-[10px] font-semibold rounded">
              AI Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Right side: Demo Switcher + Notifications + User Menu */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Demo Switcher for Project Viva Evaluators */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-primary bg-primary-light/40 hover:bg-primary-light rounded-lg border border-primary/20 transition-all cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="hidden sm:inline">Role:</span>
            <span className="capitalize">{user?.role}</span>
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-elevated p-2 z-50 text-xs">
              <div className="px-2 py-1.5 font-bold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100 mb-1">
                Demo Switcher (For Evaluation)
              </div>
              <button
                onClick={() => {
                  switchDemoUser("student");
                  setShowDemoMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer text-left"
              >
                <GraduationCap className="w-4 h-4 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">Student Account</div>
                  <div className="text-[10px] text-slate-400">Alex Mercer (CSE)</div>
                </div>
                {user?.role === "student" && <Check className="w-4 h-4 text-primary" />}
              </button>
              <button
                onClick={() => {
                  switchDemoUser("staff", "IT");
                  setShowDemoMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer text-left"
              >
                <Briefcase className="w-4 h-4 text-teal-600 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">IT Staff Account</div>
                  <div className="text-[10px] text-slate-400">Marcus Chen (Network)</div>
                </div>
                {user?.role === "staff" && user.department_id === 1 && <Check className="w-4 h-4 text-primary" />}
              </button>
              <button
                onClick={() => {
                  switchDemoUser("staff", "ELEC");
                  setShowDemoMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer text-left"
              >
                <Briefcase className="w-4 h-4 text-amber-600 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">Electrical Staff</div>
                  <div className="text-[10px] text-slate-400">Robert Taylor</div>
                </div>
              </button>
              <button
                onClick={() => {
                  switchDemoUser("admin");
                  setShowDemoMenu(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-slate-700 cursor-pointer text-left"
              >
                <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="flex-1">
                  <div className="font-semibold">Administrator</div>
                  <div className="text-[10px] text-slate-400">Dr. Eleanor Vance</div>
                </div>
                {user?.role === "admin" && <Check className="w-4 h-4 text-primary" />}
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
            className="relative p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-slate-200 shadow-elevated z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <span className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Notifications {unreadCount > 0 && `(${unreadCount})`}
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No notifications yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) {
                          setShowNotifications(false);
                          navigate(n.link);
                        }
                      }}
                      className={`p-3.5 text-xs hover:bg-slate-50 cursor-pointer transition-colors ${
                        !n.is_read ? "bg-blue-50/50" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-semibold text-slate-900">{n.title}</span>
                        <span className="text-[10px] text-slate-400 shrink-0 font-mono">
                          {formatDate(n.created_at)}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-slate-600 font-bold text-xs">
              {user?.full_name?.charAt(0) || "U"}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-900 leading-none">
                {user?.full_name}
              </div>
              <div className="text-[10px] text-slate-500 capitalize mt-0.5">
                {user?.department_name || user?.role}
              </div>
            </div>
          </Link>

          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            aria-label="Sign Out"
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
