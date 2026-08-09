import React from "react";
import Link from "next/link";
import {
  CheckCircleIcon,
  ClockWarningIcon,
  LeaveIcon,
  MinusCircleIcon,
} from "./icons";

export type ActivityItem = {
  id: string;
  employeeName: string;
  type: "check-in" | "late" | "leave" | "not-checked-in";
  message: string;
  timeLabel: string;
};

type RecentActivityCardProps = {
  activities: ActivityItem[];
  isWorkday?: boolean;
};

export function RecentActivityCard({
  activities,
  isWorkday = true,
}: RecentActivityCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md shadow-sm transition-colors h-full">
      {/* Card Header */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          Notifikasi
        </h3>
        <Link
          href="/admin/attendance"
          className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
        >
          Lihat Semua
        </Link>
      </div>

      {/* Activity List */}
      <div className="mt-1 space-y-3">
        {activities.length > 0 ? (
          activities.slice(0, 4).map((item) => {
            let iconContainer = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
            let IconComponent = CheckCircleIcon;

            if (item.type === "late") {
              iconContainer = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
              IconComponent = ClockWarningIcon;
            } else if (item.type === "leave") {
              iconContainer = "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20";
              IconComponent = LeaveIcon;
            } else if (item.type === "not-checked-in") {
              iconContainer = "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20";
              IconComponent = MinusCircleIcon;
            }

            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${iconContainer} mt-0.5`}>
                  <IconComponent size={16} />
                </div>
                <div className="flex-1 min-w-0 text-xs">
                  <p className="text-slate-800 dark:text-slate-200">
                    <span className="font-bold text-slate-900 dark:text-white">{item.employeeName}</span>{" "}
                    <span className="text-slate-600 dark:text-slate-400">{item.message}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                    {item.timeLabel}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-6 text-center text-xs text-slate-500">
            {!isWorkday
              ? "Hari ini bukan hari kerja. Tidak ada aktivitas kehadiran."
              : "Belum ada aktivitas hari ini."}
          </div>
        )}
      </div>
    </div>
  );
}
