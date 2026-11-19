import React from "react";
import { cn } from "../../lib/utils";
import { ComplaintPriority, ComplaintStatus } from "../../types";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "status" | "priority" | "category" | "outline";
  status?: ComplaintStatus;
  priority?: ComplaintPriority;
  children?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = "default",
  status,
  priority,
  children,
  ...props
}) => {
  let styleClasses = "bg-slate-100 text-slate-700 border-slate-200";

  if (variant === "status" && status) {
    switch (status) {
      case "Submitted":
        styleClasses = "bg-blue-50 text-blue-700 border-blue-200";
        break;
      case "Assigned":
        styleClasses = "bg-indigo-50 text-indigo-700 border-indigo-200";
        break;
      case "In Progress":
        styleClasses = "bg-amber-50 text-amber-800 border-amber-300";
        break;
      case "Resolved":
        styleClasses = "bg-emerald-50 text-emerald-700 border-emerald-300";
        break;
      case "Closed":
        styleClasses = "bg-slate-100 text-slate-600 border-slate-300";
        break;
      case "Reopened":
        styleClasses = "bg-rose-50 text-rose-700 border-rose-300 animate-pulse";
        break;
    }
  } else if (variant === "priority" && priority) {
    switch (priority) {
      case "High":
        styleClasses = "bg-red-50 text-red-700 border-red-300 font-bold";
        break;
      case "Medium":
        styleClasses = "bg-amber-50 text-amber-700 border-amber-300";
        break;
      case "Low":
        styleClasses = "bg-emerald-50 text-emerald-700 border-emerald-300";
        break;
    }
  } else if (variant === "category") {
    styleClasses = "bg-primary-light/50 text-primary-dark border-primary/20";
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors",
        styleClasses,
        className
      )}
      {...props}
    >
      {variant === "status" && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", {
            "bg-blue-600": status === "Submitted",
            "bg-indigo-600": status === "Assigned",
            "bg-amber-500": status === "In Progress",
            "bg-emerald-600": status === "Resolved",
            "bg-slate-400": status === "Closed",
            "bg-rose-600": status === "Reopened",
          })}
        />
      )}
      {children || status || priority}
    </span>
  );
};
