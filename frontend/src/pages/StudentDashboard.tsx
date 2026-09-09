import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { ComplaintListItem } from "../types";
import {
  FileText, Clock, CheckCircle2, AlertTriangle, PlusCircle,
  ArrowRight, ShieldCheck, Sparkles, RefreshCw
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatDate } from "../lib/utils";

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const res = await api.listComplaints({ page: 1, size: 5 });
        setComplaints(res.items);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const totalSubmitted = complaints.length;
  const activeCount = complaints.filter((c) =>
    ["Submitted", "Assigned", "In Progress"].includes(c.status)
  ).length;
  const resolvedCount = complaints.filter((c) =>
    ["Resolved", "Closed"].includes(c.status)
  ).length;
  const reopenedCount = complaints.filter((c) => c.status === "Reopened").length;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-primary to-primary-dark rounded-2xl p-6 text-white shadow-card relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 text-white text-[11px] font-semibold backdrop-blur-xs mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" />
            AI-Assisted Issue Reporting
          </div>
          <h1 className="text-2xl font-black tracking-tight">
            Welcome back, {user?.full_name.split(" ")[0]}!
          </h1>
          <p className="mt-1 text-xs text-blue-100/90 leading-relaxed">
            Report maintenance issues across campus facilities. Our machine learning system
            classifies your report and routes it immediately to the appropriate department.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link to="/complaints/new">
              <Button variant="teal" size="sm">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Submit Complaint
              </Button>
            </Link>
            <Link to="/complaints">
              <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
                View All My Complaints
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">{complaints.length}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total Reported</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">{activeCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Pending Action</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">{resolvedCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Resolved / Closed</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">{reopenedCount}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Reopened</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Complaints */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Recent Submissions</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status tracking for your latest campus complaints
            </p>
          </div>
          <Link to="/complaints" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading complaints...</div>
          ) : complaints.length === 0 ? (
            <div className="p-8 text-center">
              <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No complaints reported yet</p>
              <p className="text-xs text-slate-500 mt-0.5">
                Notice an issue with Wi-Fi, electricity, plumbing, or classroom equipment?
              </p>
              <Link to="/complaints/new" className="mt-3 inline-block">
                <Button size="sm">Submit Your First Complaint</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <Link
                  key={c.id}
                  to={`/complaints/${c.id}`}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors block"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">
                        {c.tracking_number}
                      </span>
                      <Badge variant="status" status={c.status} />
                      <Badge variant="priority" priority={c.priority} />
                      <span className="text-[11px] text-slate-400">
                        {c.category} • {c.location}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-slate-900 group-hover:text-primary">
                      {c.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 shrink-0">
                    <span className="font-mono">{formatDate(c.created_at)}</span>
                    <span className="text-primary font-bold hover:underline flex items-center gap-1">
                      Details <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
