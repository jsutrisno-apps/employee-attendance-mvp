import Link from "next/link";
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
  const summaryItems = [
    ["Total Employees", summary["Total Employees"]],
    ["Present", summary.Present],
    ["Late", summary.Late],
    ["Leave", summary.Leave],
    ["Absent", summary.Absent],
    ["Not checked in", summary["Not checked in"]],
    ["Not expected", summary["Not expected"]],
  ] as const;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Link className="text-sm text-slate-600" href="/admin">
              Back to admin
            </Link>
            <h1 className="text-3xl font-semibold tracking-normal">
              Attendance
            </h1>
            <p className="text-sm text-slate-600">
              Selected business date: {formatJakartaBusinessDate(selectedDate)}
            </p>
          </div>

          <form className="flex flex-wrap items-end gap-3" method="get">
            <div className="space-y-2">
              <label className="block text-sm font-medium" htmlFor="date">
                Date
              </label>
              <input
                className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                defaultValue={selectedDateKey}
                id="date"
                name="date"
                type="date"
              />
            </div>
            <button
              className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
              type="submit"
            >
              View
            </button>
            <Link
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-950"
              href="/admin/attendance"
            >
              Today
            </Link>
          </form>
        </div>

        {invalidDateProvided ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            The requested date was invalid, so today&apos;s Jakarta business date
            is shown.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {summaryItems.map(([label, value]) => (
            <div
              className="rounded-md border border-slate-200 bg-white p-4"
              key={label}
            >
              <p className="text-xs font-medium uppercase text-slate-500">
                {label}
              </p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="overflow-x-auto rounded-md border border-slate-200 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-100">
              <tr>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Employee number
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Name
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Email
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Employee status
                </th>
                <th className="px-4 py-3 font-semibold" scope="col">
                  Attendance status
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
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr
                    className="border-b border-slate-100 last:border-b-0"
                    key={row.employeeId}
                  >
                    <td className="px-4 py-3">{row.employeeNumber}</td>
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3">{row.email}</td>
                    <td className="px-4 py-3">{row.employeeStatus}</td>
                    <td className="px-4 py-3 font-medium">
                      {row.attendanceStatus}
                    </td>
                    <td className="px-4 py-3">{row.checkInTime}</td>
                    <td className="px-4 py-3">{row.checkOutTime}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-6 text-slate-600" colSpan={7}>
                    No employees are available.
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
