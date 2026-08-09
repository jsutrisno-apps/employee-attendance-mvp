"use client";

import { useEffect, useState } from "react";

export function JakartaClock() {
  const [timeText, setTimeText] = useState<string>("");
  const [dateText, setDateText] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();

      const timeFormatter = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });

      const dateFormatter = new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      setTimeText(timeFormatter.format(now));
      setDateText(dateFormatter.format(now));
    }

    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-100 dark:bg-[#090E1A]/80 p-3.5 text-xs transition-colors">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
        WAKTU SAAT INI
      </div>
      <div className="mt-1 flex items-baseline gap-1.5 font-mono text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        <span>{timeText || "--:--:--"}</span>
        <span className="text-xs font-sans font-semibold text-blue-600 dark:text-blue-400">WIB</span>
      </div>
      <div className="mt-1 text-slate-700 dark:text-slate-300 font-medium">
        {dateText || "Loading..."}
      </div>
      <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
        Zona Waktu: Asia/Jakarta
      </div>
    </div>
  );
}
