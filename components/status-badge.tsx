import React from "react";

type StatusBadgeProps = {
  status: string;
  size?: "sm" | "md";
};

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const normalized = status.trim().toLowerCase();

  let colorClasses = "bg-slate-800/60 text-slate-300 border-slate-700/50";
  let dotColor = "bg-slate-400";

  if (normalized === "present" || normalized === "hadir") {
    colorClasses = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    dotColor = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]";
  } else if (normalized === "late" || normalized === "terlambat") {
    colorClasses = "bg-amber-500/10 text-amber-400 border-amber-500/20";
    dotColor = "bg-amber-400 shadow-[0_0_8px_rgba(251,146,60,0.6)]";
  } else if (normalized === "leave" || normalized === "cuti") {
    colorClasses = "bg-purple-500/10 text-purple-300 border-purple-500/20";
    dotColor = "bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]";
  } else if (normalized === "absent") {
    colorClasses = "bg-rose-500/10 text-rose-400 border-rose-500/20";
    dotColor = "bg-rose-400 shadow-[0_0_8px_rgba(248,113,113,0.6)]";
  } else if (normalized === "not checked in" || normalized === "belum check-in") {
    colorClasses = "bg-slate-500/10 text-slate-400 border-slate-600/30";
    dotColor = "bg-slate-400";
  } else if (normalized === "not expected" || normalized === "not a workday") {
    colorClasses =
      "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800/50";
    dotColor = "bg-slate-500 dark:bg-slate-500";
  } else if (normalized === "active") {
    colorClasses = "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
    dotColor = "bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.5)]";
  } else if (normalized === "inactive") {
    colorClasses = "bg-slate-800/80 text-slate-500 border-slate-700/30";
    dotColor = "bg-slate-600";
  }

  const paddingClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-medium";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${colorClasses} ${paddingClasses} whitespace-nowrap`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
      <span>{status}</span>
    </span>
  );
}
