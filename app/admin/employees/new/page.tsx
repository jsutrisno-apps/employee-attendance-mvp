import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";
import { createEmployeeAction } from "../actions";
import { EmployeeForm } from "../employee-form";

export default async function NewEmployeePage() {
  await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <Link className="text-sm text-slate-600" href="/admin/employees">
          Back to employees
        </Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal">
          Add Employee
        </h1>
        <EmployeeForm action={createEmployeeAction} mode="create" />
      </section>
    </main>
  );
}
