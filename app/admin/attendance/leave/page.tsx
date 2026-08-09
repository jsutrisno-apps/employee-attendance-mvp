import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/authorization";
import { getBusinessDateKey, getJakartaBusinessDate } from "@/lib/attendance-time";
import { prisma } from "@/lib/db";
import { LeaveForm } from "./leave-form";
import { AppShell } from "@/components/app-shell";

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

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <AppShell
      title="Mark Employee Leave"
      subtitle="Record approved leave or time-off for employees"
      user={{
        role: "Admin",
      }}
      signOutAction={signOutAction}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <Link
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            href="/admin/attendance"
          >
            ← Back to Attendance
          </Link>
        </div>

        {employees.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 text-sm text-slate-500 dark:text-slate-400 shadow-sm">
            No employees are available.
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-6 shadow-sm dark:shadow-2xl backdrop-blur-xl">
          <LeaveForm employees={employees} defaultDate={defaultDate} />
        </div>
      </div>
    </AppShell>
  );
}
