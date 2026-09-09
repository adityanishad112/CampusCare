import React from "react";
import { ComplaintStatus, StatusHistory } from "../../types";
import { formatDate } from "../../lib/utils";
import { Check, Clock, AlertCircle, RefreshCw, UserCheck } from "lucide-react";

interface StatusTimelineProps {
  currentStatus: ComplaintStatus;
  history: StatusHistory[];
}

const STAGES: ComplaintStatus[] = ["Submitted", "Assigned", "In Progress", "Resolved", "Closed"];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus, history }) => {
  const isReopened = currentStatus === "Reopened";

  const getStageIndex = (status: ComplaintStatus) => {
    if (status === "Reopened") return 2; // Treat as returning to In Progress / Assigned queue
    return STAGES.indexOf(status);
  };

  const currentIndex = getStageIndex(currentStatus);

  return (
    <div className="space-y-6">
      {/* Visual Stepper */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between relative">
          {/* Connector Line */}
          <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 h-0.5 bg-slate-200 -z-0" />
          <div
            className="absolute left-4 top-1/2 -translate-y-1/2 h-0.5 bg-primary transition-all duration-500 -z-0"
            style={{
              width: `${(Math.min(currentIndex, 4) / (STAGES.length - 1)) * 95}%`,
            }}
          />

          {STAGES.map((stage, idx) => {
            const isCompleted = idx < currentIndex;
            const isCurrent = idx === currentIndex && !isReopened;
            const isFuture = idx > currentIndex;

            return (
              <div key={stage} className="relative z-10 flex flex-col items-center group">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2 ${
                    isCompleted
                      ? "bg-primary border-primary text-white"
                      : isCurrent
                      ? "bg-white border-primary text-primary ring-4 ring-primary/20"
                      : "bg-white border-slate-300 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : idx + 1}
                </div>
                <span
                  className={`text-[11px] font-medium mt-1.5 whitespace-nowrap ${
                    isCurrent
                      ? "text-primary font-bold"
                      : isCompleted
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  {stage}
                </span>
              </div>
            );
          })}
        </div>

        {/* Reopened Banner if applicable */}
        {isReopened && (
          <div className="mt-4 p-2.5 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-xs text-rose-800">
            <RefreshCw className="w-4 h-4 animate-spin text-rose-600 shrink-0" />
            <span>
              <strong>Complaint Reopened:</strong> Returned to active department queue for revision.
            </span>
          </div>
        )}
      </div>

      {/* Chronological Audit Log */}
      <div>
        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Activity & Audit Log ({history.length} events)
        </h4>
        <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 py-1">
          {history.map((item, idx) => (
            <div key={item.id || idx} className="relative pl-6">
              {/* Bullet Node */}
              <div
                className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                  item.new_status === "Resolved" || item.new_status === "Closed"
                    ? "border-emerald-600 text-emerald-600"
                    : item.new_status === "Reopened"
                    ? "border-rose-600 text-rose-600"
                    : "border-primary text-primary"
                }`}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-current" />
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-2xs">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-800">
                    {item.old_status ? `${item.old_status} → ${item.new_status}` : item.new_status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDate(item.created_at)}
                  </span>
                </div>
                {item.remarks && (
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100">
                    {item.remarks}
                  </p>
                )}
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                  <UserCheck className="w-3 h-3 text-slate-400" />
                  <span>
                    Action by: <strong className="text-slate-700">{item.changed_by_name || "System"}</strong> ({item.changed_by_role || "automated"})
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
