import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";
import { getBusinessDateKey, getJakartaBusinessDate } from "@/lib/attendance-time";
import { prisma } from "@/lib/db";
import { LeaveForm } from "./leave-form";

export default async function AdminAttendanceLeavePage() {
  await requireAdmin();

  const employees = await prisma.employee.findMany({
    orderBy: [{ employeeNumber: "asc" }],
    select: {
      id: true,
      employeeNumber: true,
      name: true,
    },
  });
  const defaultDate = getBusinessDateKey(getJakartaBusinessDate(new Date()));

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto w-full max-w-xl space-y-6">
        <div className="space-y-3">
          <Link className="text-sm text-slate-600" href="/admin/attendance">
            Back to attendance
          </Link>
          <h1 className="text-3xl font-semibold tracking-normal">
            Mark Leave
          </h1>
        </div>

        {employees.length === 0 ? (
          <p className="rounded-md border border-slate-200 bg-white p-4 text-sm text-slate-600">
            No employees are available.
          </p>
        ) : null}

        <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <LeaveForm employees={employees} defaultDate={defaultDate} />
        </div>
      </section>
    </main>
  );
}
