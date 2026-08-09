import Link from "next/link";
import { signOut } from "@/auth";
import { requireAdminView } from "@/lib/authorization";
import { createEmployeeAction } from "../actions";
import { EmployeeForm } from "../employee-form";
import { AppShell } from "@/components/app-shell";

export default async function NewEmployeePage() {
  const adminUser = await requireAdminView();
  const isDemo = adminUser.role === "Demo";

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <AppShell
      title="Add New Employee"
      subtitle="Create a new employee profile in the system"
      user={{
        role: adminUser.role,
      }}
      signOutAction={signOutAction}
    >
      <div className="mx-auto max-w-2xl space-y-6">
        <Link className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline" href="/admin/employees">
          ← Back to Employee Directory
        </Link>
        <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-6 shadow-sm dark:shadow-2xl backdrop-blur-xl">
          <EmployeeForm action={createEmployeeAction} mode="create" isDemo={isDemo} />
        </div>
      </div>
    </AppShell>
  );
}
