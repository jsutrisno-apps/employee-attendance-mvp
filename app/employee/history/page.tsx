import Link from "next/link";
import { signOut } from "@/auth";
import { requireEmployee } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import {
  buildAttendanceHistoryEntries,
  getAttendanceHistoryWindow,
} from "@/lib/attendance-history";
import {
  formatJakartaBusinessDate,
  getJakartaBusinessDate,
} from "@/lib/attendance-time";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

export default async function EmployeeAttendanceHistoryPage() {
  const employee = await requireEmployee();
  const currentBusinessDate = getJakartaBusinessDate(new Date());
  const { startDate, endDate } =
    getAttendanceHistoryWindow(currentBusinessDate);

  const records = await prisma.attendanceRecord.findMany({
    where: {
      employeeId: employee.employeeId,
      attendanceDate: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      attendanceDate: true,
      checkInAt: true,
      checkOutAt: true,
      status: true,
    },
    orderBy: {
      attendanceDate: "desc",
    },
  });

  const historyEntries = buildAttendanceHistoryEntries(
    currentBusinessDate,
    records,
  );

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
      title="Attendance History"
      subtitle={`Personal 30-day window: ${formatJakartaBusinessDate(startDate)} to ${formatJakartaBusinessDate(endDate)}`}
      user={{
        name: employeeRecord?.name,
        email: employeeRecord?.email,
        role: "Employee",
      }}
      signOutAction={signOutAction}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Link
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            href="/employee"
          >
            ← Back to Employee Dashboard
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md shadow-sm">
          <div className="overflow-x-auto">
            <table className="dark-table">
              <thead>
                <tr>
                  <th scope="col">Date</th>
                  <th scope="col">Status</th>
                  <th scope="col">Check In</th>
                  <th scope="col">Check Out</th>
                </tr>
              </thead>
              <tbody>
                {historyEntries.length > 0 ? (
                  historyEntries.map((entry) => (
                    <tr key={entry.dateKey}>
                      <td className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300">
                        <time dateTime={entry.dateKey}>
                          {formatJakartaBusinessDate(entry.date)}
                        </time>
                      </td>
                      <td>
                        <StatusBadge status={entry.status} />
                      </td>
                      <td className="font-mono text-xs">{entry.checkInTime}</td>
                      <td className="font-mono text-xs">{entry.checkOutTime}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-500">
                      No attendance history is available for this period.
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
