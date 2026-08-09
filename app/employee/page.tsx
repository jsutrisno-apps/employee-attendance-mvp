import { signOut } from "@/auth";
import Link from "next/link";
import { requireEmployeeView } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import {
  formatJakartaBusinessDate,
  formatJakartaTime,
  getJakartaBusinessDate,
  getJakartaBusinessDateKey,
  isJakartaWorkday,
} from "@/lib/attendance-time";
import { AttendanceActionForm } from "./attendance-action-form";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { AttendanceIcon, ClockWarningIcon, CalendarIcon } from "@/components/icons";

function actionForRecord(
  record: {
    checkInAt: Date | null;
    checkOutAt: Date | null;
    status: string;
  } | null,
  isWorkday: boolean,
) {
  if (!record) {
    return isWorkday ? "check-in" : null;
  }

  if (record.status === "Present" || record.status === "Late") {
    return record.checkInAt && !record.checkOutAt ? "check-out" : null;
  }

  return null;
}

export default async function EmployeePage() {
  const employee = await requireEmployeeView();
  const now = new Date();
  const attendanceDate = getJakartaBusinessDate(now);
  const businessDateKey = getJakartaBusinessDateKey(now);
  const isWorkday = isJakartaWorkday(now);

  const attendanceRecord = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_attendanceDate: {
        employeeId: employee.employeeId,
        attendanceDate,
      },
    },
    select: {
      status: true,
      checkInAt: true,
      checkOutAt: true,
    },
  });

  const attendanceStatus = attendanceRecord
    ? attendanceRecord.status
    : isWorkday
      ? "Not checked in"
      : "Not a workday";
  const actionType = actionForRecord(attendanceRecord, isWorkday);

  const employeeRecord = await prisma.employee.findUnique({
    where: { id: employee.employeeId },
    select: { name: true, email: true },
  });

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <AppShell
      title="Employee Portal"
      subtitle={`Jakarta business date: ${formatJakartaBusinessDate(attendanceDate)} (${businessDateKey})`}
      user={{
        name: employeeRecord?.name,
        email: employeeRecord?.email,
        role: "Employee",
      }}
      signOutAction={signOutAction}
    >
      <div className="mx-auto max-w-xl space-y-6">
        {/* Main Status & Action Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-6 shadow-sm dark:shadow-2xl backdrop-blur-xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/[0.08] pb-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Today&apos;s Status
              </p>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">
                Attendance Overview
              </h2>
            </div>
            <StatusBadge status={attendanceStatus} />
          </div>

          {/* Timestamps Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#090E1A] p-4 text-center">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Check-In Time
              </span>
              <span className="mt-1 block font-mono text-lg font-bold text-slate-900 dark:text-white">
                {formatJakartaTime(attendanceRecord?.checkInAt ?? null)}
              </span>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-[#090E1A] p-4 text-center">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Check-Out Time
              </span>
              <span className="mt-1 block font-mono text-lg font-bold text-slate-900 dark:text-white">
                {formatJakartaTime(attendanceRecord?.checkOutAt ?? null)}
              </span>
            </div>
          </div>

          {/* Action Form or Notice */}
          {actionType ? (
            <div className="pt-2">
              <AttendanceActionForm actionType={actionType} />
            </div>
          ) : null}

          {!actionType && !attendanceRecord && !isWorkday ? (
            <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 text-xs font-medium text-blue-700 dark:text-blue-300">
              <ClockWarningIcon size={18} className="shrink-0" />
              <span>Check-in is not available on weekends. Enjoy your day off!</span>
            </div>
          ) : null}

          {attendanceRecord?.status === "Leave" ? (
            <div className="flex items-center gap-3 rounded-xl border border-purple-500/20 bg-purple-500/10 p-4 text-xs font-medium text-purple-700 dark:text-purple-300">
              <CalendarIcon size={18} className="shrink-0" />
              <span>You are marked as Leave today. Have a restful time off!</span>
            </div>
          ) : null}

          {/* History Link */}
          <div className="pt-2">
            <Link
              className="flex items-center justify-center gap-2 w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04] py-3 text-center text-xs font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-200 dark:hover:bg-white/[0.08]"
              href="/employee/history"
            >
              <AttendanceIcon size={16} />
              <span>View Attendance History</span>
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
