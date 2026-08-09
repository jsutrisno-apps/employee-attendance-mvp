import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { UserPlusIcon } from "@/components/icons";

export default async function EmployeesPage() {
  await requireAdmin();

  const employees = await prisma.employee.findMany({
    orderBy: [{ employeeNumber: "asc" }],
    select: {
      id: true,
      employeeNumber: true,
      name: true,
      email: true,
      isActive: true,
    },
  });

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <AppShell
      title="Employee Directory"
      subtitle="Manage organization employees and status"
      user={{
        role: "Admin",
      }}
      signOutAction={signOutAction}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Total Employees: <span className="font-bold text-slate-900 dark:text-white">{employees.length}</span>
          </p>
          <Link
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-500"
            href="/admin/employees/new"
          >
            <UserPlusIcon size={18} />
            <span>Add Employee</span>
          </Link>
        </div>

        {employees.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-8 text-center text-sm text-slate-500 dark:text-slate-400 shadow-sm">
            No employees have been added yet.
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md shadow-sm">
            <div className="overflow-x-auto">
              <table className="dark-table">
                <thead>
                  <tr>
                    <th scope="col">Employee Number</th>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => {
                    const initials = employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase();
                    return (
                      <tr key={employee.id}>
                        <td className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                          {employee.employeeNumber}
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/[0.08]">
                              {initials}
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">{employee.name}</span>
                          </div>
                        </td>
                        <td className="text-slate-500 dark:text-slate-400">{employee.email}</td>
                        <td>
                          <StatusBadge
                            status={employee.isActive ? "Active" : "Inactive"}
                            size="sm"
                          />
                        </td>
                        <td>
                          <Link
                            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 hover:underline"
                            href={`/admin/employees/${employee.id}/edit`}
                          >
                            Edit
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
