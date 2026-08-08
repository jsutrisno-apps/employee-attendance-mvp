import Link from "next/link";
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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">
              {formatJakartaBusinessDate(startDate)} to{" "}
              {formatJakartaBusinessDate(endDate)}
            </p>
            <h1 className="text-3xl font-semibold tracking-normal">
              Attendance History
            </h1>
            <p className="text-sm text-slate-600">
              Recent 30-day personal attendance history.
            </p>
          </div>
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-center text-sm font-medium text-slate-950"
            href="/employee"
          >
            Back to employee area
          </Link>
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Date
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Status
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Check in
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Check out
                </th>
              </tr>
            </thead>
            <tbody>
              {historyEntries.length > 0 ? (
                historyEntries.map((entry) => (
                  <tr
                    className="border-b border-slate-100 last:border-b-0"
                    key={entry.dateKey}
                  >
                    <td className="px-4 py-3">
                      <time dateTime={entry.dateKey}>
                        {formatJakartaBusinessDate(entry.date)}
                      </time>
                    </td>
                    <td className="px-4 py-3 font-medium">{entry.status}</td>
                    <td className="px-4 py-3">{entry.checkInTime}</td>
                    <td className="px-4 py-3">{entry.checkOutTime}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-600" colSpan={4}>
                    No attendance history is available for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
