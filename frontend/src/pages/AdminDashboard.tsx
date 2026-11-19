import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { ComplaintListItem, AnalyticsSummary } from "../types";
import {
  ShieldAlert, Building2, Users, FileText, ArrowRight,
  AlertTriangle, BarChart3, CheckCircle2, Clock, Download
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatDate } from "../lib/utils";

export const AdminDashboard: React.FC = () => {
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [complaintsRes, analyticsRes] = await Promise.all([
          api.listComplaints({ size: 20 }),
          api.getAnalytics(),
        ]);
        setComplaints(complaintsRes.items);
        setAnalytics(analyticsRes);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const lowConfidenceComplaints = complaints.filter((c) => c.is_low_confidence && c.status !== "Closed");
  const unassignedComplaints = complaints.filter((c) => !c.department_id && c.status !== "Closed");

  return (
    <div className="space-y-6">
      {/* Admin Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Campus-Wide Central Control
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Administration Operations
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Global monitoring of department queues, AI routing accuracy, and resolution performance
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link to="/admin/analytics">
            <Button variant="primary" size="sm">
              <BarChart3 className="w-4 h-4 mr-1.5" />
              View Full Analytics
            </Button>
          </Link>
          <a href={api.getCSVExportUrl()} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-1.5" />
              Export CSV Report
            </Button>
          </a>
        </div>
      </div>

      {/* Global Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">
                {analytics?.total_complaints || complaints.length}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Total System Complaints</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-black text-slate-900 leading-none">
                {lowConfidenceComplaints.length}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">Low-Confidence Queue</div>
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
              <div className="text-xs text-slate-500 font-medium mt-1">Resolved Cases</div>
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

      {/* AI Review Queue Banner */}
      {lowConfidenceComplaints.length > 0 && (
        <Card className="border-amber-300 bg-amber-50/50">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <div>
                <CardTitle className="text-sm font-bold text-amber-900">
                  AI Low-Confidence Review Queue ({lowConfidenceComplaints.length})
                </CardTitle>
                <p className="text-[11px] text-amber-700">
                  ML model classification probability was below the 60% confidence threshold. Requires administrator verification or reassignment.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-amber-100">
              {lowConfidenceComplaints.map((item) => (
                <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-800">{item.tracking_number}</span>
                      <Badge variant="status" status={item.status} />
                      <span className="text-[11px] text-amber-800 font-medium">
                        AI Score: {item.ai_confidence ? `${(item.ai_confidence * 100).toFixed(0)}%` : "N/A"}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-slate-900 mt-1">{item.title}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Reported by {item.student_name} at {item.location}</div>
                  </div>
                  <Link to={`/complaints/${item.id}`}>
                    <Button variant="primary" size="sm">
                      Review & Reassign
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links / Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link to="/admin/departments" className="group">
          <Card className="hover:border-primary transition-all p-5 h-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Manage Departments & Staff</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure department routing codes, contacts, and staff account assignments
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
          </Card>
        </Link>

        <Link to="/admin/analytics" className="group">
          <Card className="hover:border-primary transition-all p-5 h-full flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-teal-50 text-accent flex items-center justify-center group-hover:scale-105 transition-transform">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">Analytics & SLA Reports</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Inspect Recharts breakdowns, department workloads, weekly trends, and CSV reports
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-primary transition-colors" />
          </Card>
        </Link>
      </div>

      {/* Global Recent Complaints Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle>Recent Campus Submissions</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">Live view across all academic and residential facilities</p>
          </div>
          <Link to="/complaints" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View all records <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {complaints.slice(0, 5).map((c) => (
              <div key={c.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary">{c.tracking_number}</span>
                    <Badge variant="status" status={c.status} />
                    <Badge variant="priority" priority={c.priority} />
                    <span className="text-[11px] text-slate-500 font-semibold">{c.department_name}</span>
                  </div>
                  <Link to={`/complaints/${c.id}`} className="text-xs font-semibold text-slate-900 hover:text-primary block mt-1">
                    {c.title}
                  </Link>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono text-slate-400">{formatDate(c.created_at)}</span>
                  <Link to={`/complaints/${c.id}`}>
                    <Button variant="outline" size="sm">Inspect</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
