import Link from "next/link";
import { notFound } from "next/navigation";
import { signOut } from "@/auth";
import { requireAdminView } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { updateEmployeeAction } from "../../actions";
import { EmployeeForm } from "../../employee-form";
import { AppShell } from "@/components/app-shell";

type EditEmployeePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  const adminUser = await requireAdminView();
  const isDemo = adminUser.role === "Demo";

  const { id } = await params;
  const employee = await prisma.employee.findUnique({
    where: { id },
    select: {
      employeeNumber: true,
      name: true,
      email: true,
      isActive: true,
    },
  });

  if (!employee) {
    notFound();
  }

  const action = updateEmployeeAction.bind(null, id);

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <AppShell
      title="Edit Employee Profile"
      subtitle={`Update details for ${employee.name} (${employee.employeeNumber})`}
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
          <EmployeeForm action={action} employee={employee} mode="edit" isDemo={isDemo} />
        </div>
      </div>
    </AppShell>
  );
}
