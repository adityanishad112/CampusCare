import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { ComplaintListItem } from "../types";
import { useAuth } from "../context/AuthContext";
import {
  Search, Filter, PlusCircle, ArrowRight, ChevronLeft, ChevronRight,
  Inbox, FileText
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { formatDate } from "../lib/utils";

const CATEGORIES = [
  "All Categories",
  "IT and Wi-Fi",
  "Electrical",
  "Plumbing",
  "Hostel maintenance",
  "Classroom and laboratory equipment",
  "Sanitation",
  "Other",
];

const STATUSES = [
  "All Statuses",
  "Submitted",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
  "Reopened",
];

export const MyComplaintsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [complaints, setComplaints] = useState<ComplaintListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get("status") || "All Statuses");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "All Categories");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);

  const assignedToMe = searchParams.get("assigned_to_me") === "true";

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const res = await api.listComplaints({
        page,
        size: 10,
        search: search.trim() || undefined,
        status: selectedStatus !== "All Statuses" ? selectedStatus : undefined,
        category: selectedCategory !== "All Categories" ? selectedCategory : undefined,
        priority: selectedPriority !== "All Priorities" ? selectedPriority : undefined,
        assigned_to_me: assignedToMe ? true : undefined,
      });
      setComplaints(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [page, selectedStatus, selectedCategory, selectedPriority, assignedToMe]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchComplaints();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {assignedToMe ? "Assigned to Me" : user?.role === "admin" ? "All Campus Complaints" : "My Complaints"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {total} total records found across active categories
          </p>
        </div>

        {user?.role === "student" && (
          <Link to="/complaints/new">
            <Button variant="primary" size="sm">
              <PlusCircle className="w-4 h-4 mr-1.5" />
              New Complaint
            </Button>
          </Link>
        )}
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, tracking number, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>
            <Button type="submit" variant="primary" size="sm" className="w-full md:w-auto">
              Search
            </Button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <Select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              options={STATUSES.map((s) => ({ value: s, label: s }))}
            />

            <Select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setPage(1);
              }}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))}
            />

            <Select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              options={[
                { value: "All Priorities", label: "All Priorities" },
                { value: "Low", label: "Low Priority" },
                { value: "Medium", label: "Medium Priority" },
                { value: "High", label: "High Priority" },
              ]}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table / Card List */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No complaints matching your criteria</p>
            <p className="text-xs text-slate-500 mt-1">Try changing filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Tracking #</th>
                  <th className="py-3 px-4">Complaint Title</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {complaints.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      <Link to={`/complaints/${c.id}`} className="hover:underline">
                        {c.tracking_number}
                      </Link>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <Link
                        to={`/complaints/${c.id}`}
                        className="font-semibold text-slate-900 hover:text-primary line-clamp-1"
                      >
                        {c.title}
                      </Link>
                      {c.is_low_confidence && (
                        <span className="inline-block mt-0.5 text-[10px] text-amber-600 font-medium">
                          ⚠ Needs Admin Routing
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">{c.category}</td>
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap truncate max-w-[150px]">
                      {c.location}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="priority" priority={c.priority} />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <Badge variant="status" status={c.status} />
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                      {formatDate(c.created_at)}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <Link to={`/complaints/${c.id}`}>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs">
            <span className="text-slate-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({total} total)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
