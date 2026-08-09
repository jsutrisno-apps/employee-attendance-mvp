import React from "react";

type DonutSegment = {
  label: string;
  count: number;
  color: string;
  glowColor: string;
};

type AttendanceDonutChartProps = {
  total: number;
  present: number;
  late: number;
  leave: number;
  notCheckedIn: number;
  absent?: number;
  notExpected?: number;
  isWorkday?: boolean;
};

export function AttendanceDonutChart({
  total,
  present,
  late,
  leave,
  notCheckedIn,
  absent = 0,
  notExpected = 0,
  isWorkday = true,
}: AttendanceDonutChartProps) {
  const effectiveTotal = Math.max(total, 0);

  const rawSegments: DonutSegment[] = isWorkday
    ? [
        {
          label: "Hadir",
          count: present,
          color: "#22C55E",
          glowColor: "rgba(34, 197, 94, 0.4)",
        },
        {
          label: "Terlambat",
          count: late,
          color: "#F97316",
          glowColor: "rgba(249, 115, 22, 0.4)",
        },
        {
          label: "Cuti",
          count: leave,
          color: "#A855F7",
          glowColor: "rgba(168, 85, 247, 0.4)",
        },
        {
          label: "Belum Check-in",
          count: notCheckedIn + absent,
          color: "#64748B",
          glowColor: "rgba(100, 116, 139, 0.4)",
        },
      ]
    : [
        {
          label: "Hadir",
          count: present,
          color: "#22C55E",
          glowColor: "rgba(34, 197, 94, 0.4)",
        },
        {
          label: "Terlambat",
          count: late,
          color: "#F97316",
          glowColor: "rgba(249, 115, 22, 0.4)",
        },
        {
          label: "Cuti",
          count: leave,
          color: "#A855F7",
          glowColor: "rgba(168, 85, 247, 0.4)",
        },
        {
          label: "Not expected",
          count: notExpected,
          color: "#94A3B8",
          glowColor: "rgba(148, 163, 184, 0.4)",
        },
      ];

  const activeSegments = rawSegments.filter((s) => s.count > 0);

  // SVG Arc Calculation
  const radius = 64;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md shadow-sm transition-colors">
      <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
        Distribusi Kehadiran Hari Ini
      </h3>

      <div className="mt-4 flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* SVG Donut Ring */}
        <div className="relative flex h-44 w-44 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 160 160">
            {/* Background ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-slate-100 dark:text-[#1E293B]"
              strokeWidth={strokeWidth}
            />

            {effectiveTotal > 0 && activeSegments.length > 0
              ? activeSegments.map((seg, idx) => {
                  const percent = seg.count / effectiveTotal;
                  const dashArray = `${percent * circumference} ${circumference}`;
                  const strokeDashoffset = -accumulatedPercent * circumference;
                  accumulatedPercent += percent;

                  return (
                    <circle
                      key={idx}
                      cx="80"
                      cy="80"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={dashArray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                      style={{
                        filter: `drop-shadow(0px 0px 4px ${seg.glowColor})`,
                      }}
                    />
                  );
                })
              : null}
          </svg>

          {/* Center text */}
          <div className="absolute text-center pointer-events-none">
            <span className="block text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {effectiveTotal}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total
            </span>
          </div>
        </div>

        {/* Side Legend */}
        <div className="w-full space-y-3 sm:w-auto">
          {rawSegments.map((seg) => {
            const pct =
              effectiveTotal > 0
                ? ((seg.count / effectiveTotal) * 100).toFixed(1)
                : "0.0";
            return (
              <div
                key={seg.label}
                className="flex items-center justify-between gap-6 text-xs font-medium"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="h-2.5 w-2.5 rounded-sm shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white font-mono">
                  <span>{seg.count}</span>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 font-normal">
                    ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

