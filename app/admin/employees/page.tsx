import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

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

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-950">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link className="text-sm text-slate-600" href="/admin">
              Back to admin
            </Link>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal">
              Employees
            </h1>
          </div>
          <Link
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            href="/admin/employees/new"
          >
            Add employee
          </Link>
        </div>

        {employees.length === 0 ? (
          <div className="mt-8 rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No employees have been added yet.
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-md border border-slate-200 bg-white">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee number</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-4 py-3">{employee.employeeNumber}</td>
                    <td className="px-4 py-3">{employee.name}</td>
                    <td className="px-4 py-3">{employee.email}</td>
                    <td className="px-4 py-3">
                      {employee.isActive ? "Active" : "Inactive"}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        className="font-medium text-slate-950 underline underline-offset-4"
                        href={`/admin/employees/${employee.id}/edit`}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
