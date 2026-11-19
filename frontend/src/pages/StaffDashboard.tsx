import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { ComplaintListItem, AnalyticsSummary } from "../types";
import {
  Inbox, CheckSquare, Clock, CheckCircle2, AlertTriangle,
  ArrowRight, Shield, UserCheck, Flame
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatDate } from "../lib/utils";

export const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStaffData = async () => {
      try {
        const [complaintsRes, analyticsRes] = await Promise.all([
          api.listComplaints({ page: 1, size: 6 }),
          api.getAnalytics(user?.department_id || undefined),
        ]);
        setComplaints(complaintsRes.items);
        setAnalytics(analyticsRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadStaffData();
  }, [user]);

  const highPriorityItems = complaints.filter((c) => c.priority === "High" && c.status !== "Closed");
  const myClaimedItems = complaints.filter((c) => c.assigned_staff_id === user?.id);

  return (
    <div className="space-y-6">
      {/* Department Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Department Operations Dashboard
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {user?.department_name || "Department Workstation"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Logged in as <strong>{user?.full_name}</strong> • Active service queue & SLA management
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/staff/queue">
            <Button variant="primary" size="sm">
              <Inbox className="w-4 h-4 mr-1.5" />
              Manage Department Queue
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">
                {analytics?.total_complaints || complaints.length}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Dept Total</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">
                {analytics?.in_progress_count || 0}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">In Progress</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">
                {analytics?.resolved_count || 0}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Resolved</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">
                {analytics?.avg_resolution_hours || 0}h
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Avg Resolution Time</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent / High Priority Alerts */}
      {highPriorityItems.length > 0 && (
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-red-600 animate-bounce" />
              <CardTitle className="text-sm font-bold text-red-900">
                High-Priority Urgent Attention Required ({highPriorityItems.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-red-100">
              {highPriorityItems.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-red-700">{item.tracking_number}</span>
                      <Badge variant="status" status={item.status} />
                      <span className="text-[11px] text-red-800 font-medium">{item.location}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 mt-1">{item.title}</div>
                  </div>
                  <Link to={`/complaints/${item.id}`}>
                    <Button variant="destructive" size="sm">
                      Inspect
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Queue Snapshot */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Recent Department Inflow</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Complaints routed by category match</p>
          </div>
          <Link to="/staff/queue" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View full queue <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading queue...</div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">No active complaints in department queue.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{c.tracking_number}</span>
                      <Badge variant="status" status={c.status} />
                      <Badge variant="priority" priority={c.priority} />
                      <span className="text-[11px] text-slate-400">
                        Assigned: <strong>{c.assigned_staff_name || "Unclaimed"}</strong>
                      </span>
                    </div>
                    <Link to={`/complaints/${c.id}`} className="text-xs font-semibold text-slate-900 hover:text-primary block">
                      {c.title}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">{formatDate(c.created_at)}</span>
                    <Link to={`/complaints/${c.id}`}>
                      <Button variant="outline" size="sm">Manage</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
