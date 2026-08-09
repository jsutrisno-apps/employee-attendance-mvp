"use client";

import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ChevronDownIcon } from "./icons";

export type TrendDataPoint = {
  dateLabel: string;
  dateKey: string;
  count: number;
  total: number;
  isToday: boolean;
};

type AttendanceTrendChartProps = {
  data: TrendDataPoint[];
  selectedRange?: number;
};

export function AttendanceTrendChart({
  data,
  selectedRange = 7,
}: AttendanceTrendChartProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxCount = Math.max(...data.map((d) => d.count), 0);
  const maxVal = Math.max(maxCount, 10);
  const isZeroState = maxCount === 0;

  // SVG Chart Dimensions
  const width = 480;
  const height = 180;
  const paddingLeft = 36;
  const paddingBottom = 34;
  const paddingTop = 24;
  const paddingRight = 20;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

  const points = data.map((d, index) => {
    const x =
      paddingLeft +
      (data.length > 1
        ? (index / (data.length - 1)) * graphWidth
        : graphWidth / 2);
    const y =
      height -
      paddingBottom -
      (d.count / (maxVal * 1.15)) * graphHeight;
    return { x, y, data: d, index };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`))
    .join(" ");

  const fillD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x},${height - paddingBottom} L ${points[0].x},${height - paddingBottom} Z`
      : "";

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRange = e.target.value;
    router.push(`${pathname}?range=${newRange}`);
  };

  // Determine which X-axis labels to render based on dataset length
  const shouldShowLabel = (index: number, total: number) => {
    if (total <= 7) return true;
    if (total <= 14) return index % 2 === 0 || index === total - 1;
    return index % 5 === 0 || index === total - 1;
  };

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md shadow-sm transition-colors h-full">
      {/* Header with Interactive Range Selector */}
      <div className="flex items-center justify-between pb-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          Statistik Kehadiran ({selectedRange} Hari Terakhir)
        </h3>

        {/* Custom SaaS Styled Select */}
        <div className="relative inline-flex items-center">
          <select
            value={selectedRange}
            onChange={handleRangeChange}
            aria-label="Pilih Rentang Kehadiran"
            className="appearance-none rounded-lg border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04] pl-2.5 pr-7 py-1 text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-200/80 dark:hover:bg-white/[0.08] focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
          >
            <option value={7} className="bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100">
              7 Hari
            </option>
            <option value={14} className="bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100">
              14 Hari
            </option>
            <option value={30} className="bg-white dark:bg-[#0F172A] text-slate-900 dark:text-slate-100">
              30 Hari
            </option>
          </select>
          <ChevronDownIcon
            size={14}
            className="pointer-events-none absolute right-2 text-slate-500 dark:text-slate-400"
          />
        </div>
      </div>

      {/* Line Chart Container */}
      <div className="mt-2 relative w-full overflow-hidden">
        {/* Interactive Tooltip Card */}
        {activePoint ? (
          <div
            className="absolute z-20 pointer-events-none rounded-lg border border-slate-200 dark:border-white/[0.15] bg-slate-900/95 dark:bg-slate-950/95 px-2.5 py-1 text-[11px] font-semibold text-white shadow-md backdrop-blur-sm transition-all transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${(activePoint.x / width) * 100}%`,
              top: `${Math.max((activePoint.y / height) * 100 - 8, 5)}%`,
            }}
          >
            <div>{activePoint.data.dateLabel}</div>
            <div className="text-blue-400 font-mono text-[10px]">
              Hadir: {activePoint.data.count} Karyawan
            </div>
          </div>
        ) : null}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines & Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - paddingBottom - ratio * graphHeight;
            const val = Math.round(ratio * maxVal * 1.15);
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-white/[0.06]"
                  strokeDasharray={ratio === 0 ? "none" : "3 3"}
                  strokeWidth="1"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          {fillD ? <path d={fillD} fill="url(#blueGradient)" /> : null}

          {/* Trend Line */}
          {pathD ? (
            <path
              d={pathD}
              fill="none"
              stroke="#3B82F6"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]"
            />
          ) : null}

          {/* Points & X labels */}
          {points.map((pt) => {
            const isHovered = hoveredIdx === pt.index;
            const showLabel = shouldShowLabel(pt.index, points.length);

            return (
              <g key={pt.index}>
                {/* Hit target for easier mouse interaction */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="10"
                  fill="transparent"
                  className="cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
                  onMouseEnter={() => setHoveredIdx(pt.index)}
                  onFocus={() => setHoveredIdx(pt.index)}
                  onBlur={() => setHoveredIdx(null)}
                  tabIndex={0}
                  aria-label={`${pt.data.dateLabel}: ${pt.data.count} hadir`}
                />
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isHovered ? "6" : "4"}
                  fill="#3B82F6"
                  className={`stroke-white dark:stroke-[#0F172A] stroke-2 transition-all duration-150 ${
                    isHovered ? "shadow-md stroke-3" : ""
                  }`}
                />
                {showLabel ? (
                  <text
                    x={pt.x}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[10px] font-medium transition-colors ${
                      pt.data.isToday
                        ? "fill-blue-600 dark:fill-blue-400 font-bold"
                        : "fill-slate-500 dark:fill-slate-400"
                    }`}
                  >
                    {pt.data.dateLabel}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Intentional Zero-State Subtitle when no attendance records exist */}
      {isZeroState ? (
        <p className="mt-2 text-center text-xs text-slate-400 dark:text-slate-500 italic">
          Belum ada aktivitas check-in pada rentang {selectedRange} hari ini.
        </p>
      ) : null}
    </div>
  );
}
