import React from "react";

type PeriodSummaryCardProps = {
  selectedRange: number;
  workdaysCount: number;
  periodOpportunities: number;
  presentCount: number;
  lateCount: number;
  leaveCount: number;
  absentCount: number;
};

export function PeriodSummaryCard({
  selectedRange,
  workdaysCount,
  periodOpportunities,
  presentCount,
  lateCount,
  leaveCount,
  absentCount,
}: PeriodSummaryCardProps) {
  const effectiveTotal = Math.max(periodOpportunities, 0);

  const hadirPct =
    effectiveTotal > 0
      ? (((presentCount + lateCount) / effectiveTotal) * 100).toFixed(1)
      : "0.0";

  const segments = [
    {
      label: "Hadir",
      count: presentCount,
      color: "#22C55E",
      glow: "rgba(34, 197, 94, 0.5)",
    },
    {
      label: "Terlambat",
      count: lateCount,
      color: "#F97316",
      glow: "rgba(249, 115, 22, 0.5)",
    },
    {
      label: "Cuti",
      count: leaveCount,
      color: "#A855F7",
      glow: "rgba(168, 85, 247, 0.5)",
    },
    {
      label: "Absent",
      count: absentCount,
      color: "#EF4444",
      glow: "rgba(239, 68, 68, 0.5)",
    },
  ];

  const radius = 54;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md shadow-sm transition-colors h-full">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-1">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Ringkasan Periode
          </h3>
          <span className="rounded-full bg-blue-500/10 dark:bg-blue-500/20 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold text-blue-600 dark:text-blue-400">
            {selectedRange} Hari
          </span>
        </div>
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
          {workdaysCount} Hari Kerja • {effectiveTotal} Event Workday
        </p>
      </div>

      <div className="mt-3 flex items-center justify-between gap-4">
        {/* Ring Chart */}
        <div className="relative flex h-36 w-36 shrink-0 items-center justify-center">
          <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={strokeWidth}
            />

            {effectiveTotal > 0
              ? segments.map((seg, idx) => {
                  if (seg.count <= 0) return null;
                  const percent = seg.count / effectiveTotal;
                  const dashArray = `${percent * circumference} ${circumference}`;
                  const strokeDashoffset = -accumulatedPercent * circumference;
                  accumulatedPercent += percent;

                  return (
                    <circle
                      key={idx}
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke={seg.color}
                      strokeWidth={strokeWidth}
                      strokeDasharray={dashArray}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="transition-all duration-500 ease-out"
                      style={{
                        filter: `drop-shadow(0px 0px 4px ${seg.glow})`,
                      }}
                    />
                  );
                })
              : null}
          </svg>

          {/* Center text */}
          <div className="absolute text-center">
            <span className="block text-xl font-extrabold text-slate-900 dark:text-white tracking-tight font-mono">
              {hadirPct}%
            </span>
            <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Kehadiran
            </span>
          </div>
        </div>

        {/* Breakdown List */}
        <div className="flex-1 space-y-2 text-xs font-medium">
          {segments.map((seg) => {
            const pct =
              effectiveTotal > 0
                ? ((seg.count / effectiveTotal) * 100).toFixed(1)
                : "0.0";
            return (
              <div key={seg.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-slate-600 dark:text-slate-300">{seg.label}</span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs">
                  <span className="font-semibold text-slate-900 dark:text-white">{seg.count}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">
                    ({pct}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Total Line */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-white/[0.06] pt-2.5 text-xs font-bold">
        <span className="text-slate-700 dark:text-slate-300">Total Kesempatan Kerja</span>
        <span className="text-slate-900 dark:text-white font-mono">{effectiveTotal}</span>
      </div>
    </div>
  );
}
