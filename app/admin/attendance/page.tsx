import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import {
  buildAdminAttendanceRows,
  buildAdminAttendanceSummary,
} from "@/lib/admin-attendance";
import {
  formatJakartaBusinessDate,
  getBusinessDateKey,
  getJakartaBusinessDate,
} from "@/lib/attendance-time";
import { AppShell } from "@/components/app-shell";
import { KPICard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import {
  UsersIcon,
  CheckCircleIcon,
  ClockWarningIcon,
  LeaveIcon,
  MinusCircleIcon,
  AlertCircleIcon,
  CalendarIcon,
} from "@/components/icons";

type AdminAttendancePageProps = {
  searchParams?: Promise<{
    date?: string | string[];
  }>;
};

function parseSelectedDate(dateParam: string | string[] | undefined) {
  const value = Array.isArray(dateParam) ? dateParam[0] : dateParam;

  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

export default async function AdminAttendancePage({
  searchParams,
}: AdminAttendancePageProps) {
  await requireAdmin();

  const resolvedSearchParams = await searchParams;
  const currentBusinessDate = getJakartaBusinessDate(new Date());
  const parsedDate = parseSelectedDate(resolvedSearchParams?.date);
  const selectedDate = parsedDate ?? currentBusinessDate;
  const selectedDateKey = getBusinessDateKey(selectedDate);
  const invalidDateProvided =
    Boolean(resolvedSearchParams?.date) && parsedDate === null;

  const [employees, records] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ employeeNumber: "asc" }],
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        email: true,
        isActive: true,
      },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        attendanceDate: selectedDate,
      },
      select: {
        employeeId: true,
        attendanceDate: true,
        checkInAt: true,
        checkOutAt: true,
        status: true,
      },
    }),
  ]);

  const rows = buildAdminAttendanceRows({
    employees,
    records,
    selectedDate,
    currentBusinessDate,
  });
  const summary = buildAdminAttendanceSummary(rows);

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <AppShell
      title="Attendance Records"
      subtitle={`Selected business date: ${formatJakartaBusinessDate(selectedDate)}`}
      headerDate={formatJakartaBusinessDate(selectedDate)}
      user={{
        role: "Admin",
      }}
      signOutAction={signOutAction}
    >
      <div className="space-y-6">
        {/* Date Selector & Action Controls */}
        <div className="flex flex-col gap-4 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="space-y-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="date">
                Select Date
              </label>
              <input
                className="rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#090E1A] px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                defaultValue={selectedDateKey}
                id="date"
                name="date"
                type="date"
              />
            </div>
            <button
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] transition hover:bg-blue-500 active:scale-[0.98]"
              type="submit"
            >
              View Date
            </button>
            <Link
              className="rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04] px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-white/[0.08]"
              href="/admin/attendance"
            >
              Today
            </Link>
          </form>

          <Link
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition hover:opacity-95"
            href="/admin/attendance/leave"
          >
            <CalendarIcon size={16} />
            <span>Mark Leave</span>
          </Link>
        </div>

        {invalidDateProvided ? (
          <div className="flex items-center gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-300 font-medium">
            <AlertCircleIcon size={18} className="shrink-0" />
            <span>
              The requested date was invalid, so today&apos;s Jakarta business date is shown.
            </span>
          </div>
        ) : null}

        {/* 7 KPI Cards Grid */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <KPICard title="Total" value={summary["Total Employees"]} icon={<UsersIcon size={18} />} variant="blue" />
          <KPICard title="Present" value={summary.Present} icon={<CheckCircleIcon size={18} />} variant="green" />
          <KPICard title="Late" value={summary.Late} icon={<ClockWarningIcon size={18} />} variant="orange" />
          <KPICard title="Leave" value={summary.Leave} icon={<LeaveIcon size={18} />} variant="purple" />
          <KPICard title="Absent" value={summary.Absent} icon={<AlertCircleIcon size={18} />} variant="rose" />
          <KPICard title="Unchecked" value={summary["Not checked in"]} icon={<MinusCircleIcon size={18} />} variant="gray" />
          <KPICard title="Off / Weekend" value={summary["Not expected"]} icon={<MinusCircleIcon size={18} />} variant="gray" />
        </div>

        {/* Full Attendance Table */}
        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th scope="col">Employee Number</th>
                  <th scope="col">Name</th>
                  <th scope="col">Email</th>
                  <th scope="col">Emp Status</th>
                  <th scope="col">Attendance Status</th>
                  <th scope="col">Check In</th>
                  <th scope="col">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {rows.length > 0 ? (
                  rows.map((row) => {
                    const initials = row.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <tr key={row.employeeId}>
                        <td className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {row.employeeNumber}
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/[0.08]">
                              {initials}
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">{row.name}</span>
                          </div>
                        </td>
                        <td className="text-slate-500 dark:text-slate-400">{row.email}</td>
                        <td>
                          <StatusBadge status={row.employeeStatus} size="sm" />
                        </td>
                        <td>
                          <StatusBadge status={row.attendanceStatus} />
                        </td>
                        <td className="font-mono text-xs">{row.checkInTime}</td>
                        <td className="font-mono text-xs">{row.checkOutTime}</td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      No employee records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
