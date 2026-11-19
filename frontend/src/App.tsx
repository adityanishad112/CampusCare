import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { StudentDashboard } from "./pages/StudentDashboard";
import { NewComplaintPage } from "./pages/NewComplaintPage";
import { MyComplaintsPage } from "./pages/MyComplaintsPage";
import { ComplaintDetailPage } from "./pages/ComplaintDetailPage";
import { StaffDashboard } from "./pages/StaffDashboard";
import { StaffQueuePage } from "./pages/StaffQueuePage";
import { AdminDashboard } from "./pages/AdminDashboard";
import { DepartmentManagementPage } from "./pages/DepartmentManagementPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";

const RootRedirect: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
  if (user.role === "staff") return <Navigate to="/staff/dashboard" replace />;
  return <Navigate to="/dashboard" replace />;
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<RootRedirect />} />
                
                {/* Student Pages */}
                <Route path="/dashboard" element={<StudentDashboard />} />
                <Route path="/complaints/new" element={<NewComplaintPage />} />
                
                {/* Shared Complaint Pages */}
                <Route path="/complaints" element={<MyComplaintsPage />} />
                <Route path="/complaints/:id" element={<ComplaintDetailPage />} />

                {/* Staff Pages */}
                <Route path="/staff/dashboard" element={<StaffDashboard />} />
                <Route path="/staff/queue" element={<StaffQueuePage />} />

                {/* Admin Pages */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/departments" element={<DepartmentManagementPage />} />
                <Route path="/admin/analytics" element={<AnalyticsPage />} />

                {/* Common Pages */}
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
};

export default App;
