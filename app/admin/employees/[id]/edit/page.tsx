import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import { updateEmployeeAction } from "../../actions";
import { EmployeeForm } from "../../employee-form";

type EditEmployeePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditEmployeePage({
  params,
}: EditEmployeePageProps) {
  await requireAdmin();

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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <Link className="text-sm text-slate-600" href="/admin/employees">
          Back to employees
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">
          Edit Employee
        </h1>
        <EmployeeForm action={action} employee={employee} mode="edit" />
      </section>
    </main>
  );
}
