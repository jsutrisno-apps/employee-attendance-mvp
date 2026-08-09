import React, { useId } from "react";

type KPICardVariant = "blue" | "green" | "orange" | "purple" | "gray" | "rose";

type KPICardProps = {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: KPICardVariant;
  sparklineData?: number[];
  sparklinePeriod?: string;
};

function generateSparkline(
  data: number[] | undefined,
  width = 140,
  height = 28,
  padding = 3
) {
  if (!data || data.length === 0) {
    const y = height / 2;
    return {
      pathD: `M ${padding},${y} L ${width - padding},${y}`,
      areaD: `M ${padding},${y} L ${width - padding},${y} L ${width - padding},${height} L ${padding},${height} Z`,
      points: [],
    };
  }

  const minVal = Math.min(...data);
  const maxVal = Math.max(...data);
  const range = maxVal - minVal;

  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;

  const points = data.map((val, index) => {
    const x = padding + (index / Math.max(data.length - 1, 1)) * usableWidth;
    const normalizedY = range === 0 ? 0.5 : (val - minVal) / range;
    const y = height - padding - normalizedY * usableHeight;
    return { x, y, val };
  });

  if (points.length === 1) {
    const p = points[0];
    return {
      pathD: `M ${padding},${p.y} L ${width - padding},${p.y}`,
      areaD: `M ${padding},${p.y} L ${width - padding},${p.y} L ${width - padding},${height} L ${padding},${height} Z`,
      points: [p],
    };
  }

  let pathD = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;
    pathD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p1.x.toFixed(1)},${p1.y.toFixed(1)}`;
  }

  const firstPoint = points[0];
  const lastPoint = points[points.length - 1];
  const areaD = `${pathD} L ${lastPoint.x.toFixed(1)},${height} L ${firstPoint.x.toFixed(1)},${height} Z`;

  return { pathD, areaD, points };
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  variant = "blue",
  sparklineData,
  sparklinePeriod,
}: KPICardProps) {
  const gradientId = useId().replace(/:/g, "");

  let iconBg =
    "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25 shadow-[0_0_14px_rgba(59,130,246,0.18)]";
  let sparklineColor = "#3B82F6";
  let hoverBorder = "hover:border-blue-500/40 dark:hover:border-blue-400/40";
  let radialGlow = "bg-blue-500/20 dark:bg-blue-500/15";
  let glowBg = "from-blue-500/[0.05] via-transparent to-transparent";
  let darkGlowBg = "dark:from-blue-500/[0.08] dark:via-transparent dark:to-transparent";

  if (variant === "green") {
    iconBg =
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shadow-[0_0_14px_rgba(16,185,129,0.18)]";
    sparklineColor = "#10B981";
    hoverBorder = "hover:border-emerald-500/40 dark:hover:border-emerald-400/40";
    radialGlow = "bg-emerald-500/20 dark:bg-emerald-500/15";
    glowBg = "from-emerald-500/[0.05] via-transparent to-transparent";
    darkGlowBg = "dark:from-emerald-500/[0.08] dark:via-transparent dark:to-transparent";
  } else if (variant === "orange") {
    iconBg =
      "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 shadow-[0_0_14px_rgba(245,158,11,0.18)]";
    sparklineColor = "#F59E0B";
    hoverBorder = "hover:border-amber-500/40 dark:hover:border-amber-400/40";
    radialGlow = "bg-amber-500/20 dark:bg-amber-500/15";
    glowBg = "from-amber-500/[0.05] via-transparent to-transparent";
    darkGlowBg = "dark:from-amber-500/[0.08] dark:via-transparent dark:to-transparent";
  } else if (variant === "purple") {
    iconBg =
      "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/25 shadow-[0_0_14px_rgba(139,92,246,0.18)]";
    sparklineColor = "#8B5CF6";
    hoverBorder = "hover:border-violet-500/40 dark:hover:border-violet-400/40";
    radialGlow = "bg-violet-500/20 dark:bg-violet-500/15";
    glowBg = "from-violet-500/[0.05] via-transparent to-transparent";
    darkGlowBg = "dark:from-violet-500/[0.08] dark:via-transparent dark:to-transparent";
  } else if (variant === "rose") {
    iconBg =
      "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 shadow-[0_0_14px_rgba(239,68,68,0.18)]";
    sparklineColor = "#EF4444";
    hoverBorder = "hover:border-rose-500/40 dark:hover:border-rose-400/40";
    radialGlow = "bg-rose-500/20 dark:bg-rose-500/15";
    glowBg = "from-rose-500/[0.05] via-transparent to-transparent";
    darkGlowBg = "dark:from-rose-500/[0.08] dark:via-transparent dark:to-transparent";
  } else if (variant === "gray") {
    iconBg =
      "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-400/25 shadow-[0_0_12px_rgba(100,116,139,0.15)]";
    sparklineColor = "#64748B";
    hoverBorder = "hover:border-slate-300 dark:hover:border-slate-600/50";
    radialGlow = "bg-slate-500/20 dark:bg-slate-500/15";
    glowBg = "from-slate-500/[0.05] via-transparent to-transparent";
    darkGlowBg = "dark:from-slate-500/[0.08] dark:via-transparent dark:to-transparent";
  }

  const { pathD, areaD, points } = generateSparkline(sparklineData, 140, 28, 3);

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-white/[0.08] bg-white/95 dark:bg-[#0F172A]/90 p-4.5 backdrop-blur-xl shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04),inset_0_1px_0_0_rgba(255,255,255,0.8)] dark:shadow-[0_4px_24px_0_rgba(0,0,0,0.3),inset_0_1px_0_0_rgba(255,255,255,0.06)] transition-all duration-200 ${hoverBorder}`}
    >
      {/* Subtle semantic radial halo in upper-right corner */}
      <div
        className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300 opacity-60 dark:opacity-30 group-hover:opacity-90 ${radialGlow}`}
      />

      {/* Subtle background linear tint gradient */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${glowBg} ${darkGlowBg}`}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none pt-0.5">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl border ${iconBg} shrink-0 transition-transform duration-200 group-hover:scale-105`}
        >
          {icon}
        </div>
      </div>

      {subtitle ? (
        <p className="relative z-10 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>
      ) : null}

      {/* Data-Driven Multi-Point Sparkline with SVG Area Fill & Point Nodes */}
      <div className="relative z-10 mt-2.5">
        {sparklinePeriod ? (
          <div className="flex items-center justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1">
            <span>{sparklinePeriod}</span>
          </div>
        ) : null}
        <div className="h-7 w-full overflow-hidden">
        <svg
          viewBox="0 0 140 28"
          className="h-full w-full overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`kpi-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={sparklineColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={sparklineColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          <path d={areaD} fill={`url(#kpi-grad-${gradientId})`} />
          <path
            d={pathD}
            fill="none"
            stroke={sparklineColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {points.map((p, idx) => (
            <circle
              key={idx}
              cx={p.x.toFixed(1)}
              cy={p.y.toFixed(1)}
              r="2"
              fill={sparklineColor}
            />
          ))}
        </svg>
        </div>
      </div>
    </div>
  );
}

