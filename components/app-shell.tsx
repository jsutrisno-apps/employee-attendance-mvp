"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  DashboardIcon,
  UsersIcon,
  AttendanceIcon,
  LeaveIcon,
  SignOutIcon,
  SunIcon,
  MoonIcon,
  MenuIcon,
  CloseIcon,
  ChevronDownIcon,
  CalendarIcon,
  PanelLeftCloseIcon,
  PanelLeftOpenIcon,
} from "./icons";
import { JakartaClock } from "./jakarta-clock";
import { formatJakartaBusinessDate, getJakartaBusinessDate } from "@/lib/attendance-time";

type UserSessionInfo = {
  name?: string | null;
  email?: string | null;
  role?: "Admin" | "Employee" | string;
};

type AppShellProps = {
  children: React.ReactNode;
  user?: UserSessionInfo;
  signOutAction?: () => Promise<void>;
  title?: string;
  subtitle?: string;
  headerDate?: string;
};

export function AppShell({
  children,
  user,
  signOutAction,
  title,
  subtitle,
  headerDate,
}: AppShellProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("coalistix_sidebar_collapsed") === "true";
    }
    return false;
  });

  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("coalistix_theme") ?? localStorage.getItem("chrono_theme");
      return (stored as "dark" | "light") ?? "dark";
    }
    return "dark";
  });

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = (newTheme: "dark" | "light") => {
    setTheme(newTheme);
    localStorage.setItem("coalistix_theme", newTheme);
    localStorage.setItem("chrono_theme", newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const toggleSidebar = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("coalistix_sidebar_collapsed", String(nextState));
  };

  const isAdmin = user?.role === "Admin" || pathname.startsWith("/admin");

  const adminNav = [
    { label: "Dashboard", href: "/admin", icon: DashboardIcon },
    { label: "Karyawan", href: "/admin/employees", icon: UsersIcon },
    { label: "Kehadiran", href: "/admin/attendance", icon: AttendanceIcon },
    { label: "Cuti & Izin", href: "/admin/attendance/leave", icon: LeaveIcon },
  ];

  const employeeNav = [
    { label: "Dashboard", href: "/employee", icon: DashboardIcon },
    { label: "Riwayat Kehadiran", href: "/employee/history", icon: AttendanceIcon },
  ];

  const navItems = isAdmin ? adminNav : employeeNav;

  const isNavActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    if (href === "/employee") return pathname === "/employee";
    if (href === "/admin/attendance") return pathname === "/admin/attendance";
    if (href === "/admin/attendance/leave") return pathname.startsWith("/admin/attendance/leave");
    if (href === "/admin/employees") return pathname.startsWith("/admin/employees");
    return pathname === href;
  };

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : user?.role === "Admin"
    ? "AU"
    : "EM";

  const displayHeaderDate =
    headerDate ?? formatJakartaBusinessDate(getJakartaBusinessDate(new Date()));

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#07090E] text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans selection:bg-blue-500 selection:text-white transition-colors duration-200">
      {/* Mobile Top Bar */}
      <header className="flex md:hidden items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0B0F19] px-4 py-3 sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <Image
            src="/dashboard-logo.png"
            alt="COALISTIX Logo"
            width={28}
            height={28}
            className="h-7 w-7 shrink-0 object-contain"
            priority
          />
          <div>
            <span className="font-extrabold text-sm tracking-wider text-slate-900 dark:text-white block leading-none uppercase">
              COALISTIX
            </span>
            <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 block mt-0.5">
              Employee Attendance
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg bg-slate-100 dark:bg-white/[0.05]"
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
        </button>
      </header>

      {/* Overlay Backdrop for Mobile */}
      {mobileMenuOpen ? (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      ) : null}

      {/* Desktop Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 bottom-0 left-0 z-50 bg-white dark:bg-[#090D16] border-r border-slate-200 dark:border-white/[0.08] flex flex-col justify-between p-3.5 transition-all duration-300 ease-in-out md:translate-x-0 h-screen ${
          isCollapsed ? "md:w-20" : "md:w-64"
        } w-64 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-6 overflow-y-auto overflow-x-hidden">
          {/* Logo & Product Identity Header with Collapse Control */}
          <div className={`flex items-center ${isCollapsed ? "flex-col gap-3 items-center justify-center py-1" : "justify-between"} px-1 py-1`}>
            {isCollapsed ? (
              <>
                <Image
                  src="/dashboard-logo.png"
                  alt="COALISTIX Logo"
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 object-contain mx-auto"
                  priority
                />
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden md:flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/[0.08] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-150 shrink-0"
                  title="Expand Sidebar"
                  aria-label="Expand Sidebar"
                  aria-expanded={false}
                >
                  <PanelLeftOpenIcon size={16} />
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                  <Image
                    src="/dashboard-logo.png"
                    alt="COALISTIX Logo"
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 object-contain"
                    priority
                  />
                  <div className="min-w-0">
                    <h1 className="font-black text-sm tracking-wider text-slate-900 dark:text-white font-sans truncate uppercase">
                      COALISTIX
                    </h1>
                    <p className="text-[10px] tracking-tight font-medium text-slate-500 dark:text-slate-400 truncate">
                      Employee Attendance
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={toggleSidebar}
                  className="hidden md:flex items-center justify-center p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-100/80 dark:bg-white/[0.04] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/80 dark:hover:bg-white/[0.08] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 transition-all duration-150 shrink-0"
                  title="Collapse Sidebar"
                  aria-label="Collapse Sidebar"
                  aria-expanded={true}
                >
                  <PanelLeftCloseIcon size={16} />
                </button>
              </>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isNavActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={item.label}
                  className={`flex items-center ${
                    isCollapsed ? "justify-center px-0 py-2.5" : "gap-3 px-3.5 py-2.5"
                  } rounded-xl text-sm font-medium transition-all duration-150 ${
                    active
                      ? "bg-blue-500/10 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.25)] font-semibold"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                  }`}
                >
                  <Icon
                    size={18}
                    className={`shrink-0 ${
                      active ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Section */}
        <div className="space-y-3.5 pt-3 border-t border-slate-200 dark:border-white/[0.08]">
          {/* User Profile Card */}
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] space-y-2">
            <div className={`flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600/20 dark:bg-blue-600/30 font-bold text-xs text-blue-600 dark:text-blue-300 ring-1 ring-blue-500/40"
                  title={isCollapsed ? user?.name ?? "Admin User" : undefined}
                >
                  {initials}
                </div>
                {!isCollapsed && (
                  <div className="truncate min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {user?.name ?? (isAdmin ? "Admin User" : "Employee")}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {user?.role ?? (isAdmin ? "Administrator" : "Employee")}
                    </p>
                  </div>
                )}
              </div>
              {!isCollapsed && <ChevronDownIcon size={14} className="text-slate-400 shrink-0" />}
            </div>

            {!isCollapsed && signOutAction ? (
              <form action={signOutAction} className="pt-1.5 border-t border-slate-200/60 dark:border-white/[0.06]">
                <button
                  type="submit"
                  className="flex items-center gap-2 w-full px-2 py-1 rounded-lg text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-xs font-medium"
                >
                  <SignOutIcon size={15} />
                  <span>Keluar</span>
                </button>
              </form>
            ) : null}
          </div>

          {/* Realtime Clock Widget */}
          {!isCollapsed ? (
            <JakartaClock />
          ) : (
            <div className="flex justify-center text-[10px] font-mono text-slate-400" title="Asia/Jakarta">
              WIB
            </div>
          )}

          {/* Bottom Utility Bar & Theme Controls */}
          <div className="space-y-2 pt-1 text-slate-500 dark:text-slate-400">
            {!isCollapsed && (
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-0.5">
                Mode Tampilan
              </p>
            )}

            <div className="flex items-center justify-between gap-1">
              <div
                className={`flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] ${
                  isCollapsed ? "w-full justify-center" : "flex-1"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleTheme("dark")}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition ${
                    theme === "dark"
                      ? "bg-slate-800 text-blue-400 shadow-sm border border-blue-500/30"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  title="Dark Mode"
                  aria-label="Dark Mode"
                >
                  <MoonIcon size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleTheme("light")}
                  className={`flex-1 flex items-center justify-center p-1.5 rounded-lg transition ${
                    theme === "light"
                      ? "bg-white text-amber-500 shadow-sm border border-slate-200"
                      : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  }`}
                  title="Light Mode"
                  aria-label="Light Mode"
                >
                  <SunIcon size={14} />
                </button>
              </div>

              {isCollapsed && signOutAction ? (
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Keluar"
                    aria-label="Keluar"
                  >
                    <SignOutIcon size={16} />
                  </button>
                </form>
              ) : null}
            </div>

            {!isCollapsed && (
              <p className="text-[10px] text-slate-400 dark:text-slate-600 pt-1 leading-tight">
                © 2025 Coalistix Employee Attendance v1.0.0
              </p>
            )}
          </div>
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Workspace Top Header Bar */}
        <header className="hidden md:flex items-center justify-between border-b border-slate-200 dark:border-white/[0.08] bg-white/90 dark:bg-[#07090E]/90 px-8 py-5 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {title ?? (isAdmin ? "Dashboard" : "Employee Portal")}
            </h1>
            {subtitle ? (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="flex items-center gap-4">
            {/* Header Date Badge */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <CalendarIcon size={15} className="text-blue-500" />
              <span>{displayHeaderDate}</span>
            </div>

            {/* Header User Avatar */}
            <div className="flex items-center gap-2.5 border-l border-slate-200 dark:border-white/[0.1] pl-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-xs font-bold text-white shadow-sm dark:shadow-[0_0_10px_rgba(59,130,246,0.3)]">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

