import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ComplaintListItem } from "../types";
import { Inbox, CheckCircle2, Filter, Search, UserCheck } from "lucide-react";
import { Card, CardContent } from "../components/ui/Card";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Select";
import { formatDate } from "../lib/utils";

export const StaffQueuePage: React.FC = () => {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterStatus, setFilterStatus] = useState("All");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterAssignment, setFilterAssignment] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.listComplaints({
        department_id: user?.department_id || undefined,
        status: filterStatus !== "All" ? filterStatus : undefined,
        priority: filterPriority !== "All" ? filterPriority : undefined,
        assigned_to_me: filterAssignment === "mine" ? true : undefined,
        search: searchTerm.trim() || undefined,
        size: 50,
      });
      setComplaints(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [filterStatus, filterPriority, filterAssignment]);

  const handleClaim = async (id: number) => {
    try {
      await api.claimComplaint(id);
      fetchQueue();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Department Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage incoming facility requests assigned to {user?.department_name}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by keyword, tracking number, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchQueue()}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <Button size="sm" onClick={fetchQueue}>Apply Filter</Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: "All", label: "All Statuses" },
                { value: "Submitted", label: "Submitted (Unclaimed)" },
                { value: "In Progress", label: "In Progress" },
                { value: "Reopened", label: "Reopened" },
                { value: "Resolved", label: "Resolved" },
              ]}
            />
            <Select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              options={[
                { value: "All", label: "All Priorities" },
                { value: "High", label: "High Priority" },
                { value: "Medium", label: "Medium Priority" },
                { value: "Low", label: "Low Priority" },
              ]}
            />
            <Select
              value={filterAssignment}
              onChange={(e) => setFilterAssignment(e.target.value)}
              options={[
                { value: "all", label: "All Department Complaints" },
                { value: "mine", label: "Claimed by Me" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Queue List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading queue records...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No complaints matching queue filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Tracking #</th>
                  <th className="py-3 px-4">Complaint Title</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Assignee</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary whitespace-nowrap">
                      <Link to={`/complaints/${c.id}`} className="hover:underline">
                        {c.tracking_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <Link to={`/complaints/${c.id}`} className="font-semibold text-slate-900 hover:text-primary line-clamp-1">
                        {c.title}
                      </Link>
                      <span className="text-[10px] text-slate-400">By {c.student_name}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 truncate max-w-[150px]">{c.location}</td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="priority" priority={c.priority} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="status" status={c.status} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {c.assigned_staff_name ? (
                        <span className="text-slate-700 font-medium">{c.assigned_staff_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {!c.assigned_staff_id && c.status === "Submitted" ? (
                        <Button variant="primary" size="sm" onClick={() => handleClaim(c.id)}>
                          Claim
                        </Button>
                      ) : (
                        <Link to={`/complaints/${c.id}`}>
                          <Button variant="outline" size="sm">Manage</Button>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
