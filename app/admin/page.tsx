import { signOut } from "@/auth";
import Link from "next/link";
import { requireAdmin } from "@/lib/authorization";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="text-center">
        <h1 className="text-3xl font-semibold tracking-normal">Admin Area</h1>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            href="/admin/employees"
          >
            Manage employees
          </Link>
          <Link
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-950"
            href="/admin/attendance"
          >
            View attendance
          </Link>
        </div>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
          className="mt-6"
        >
          <button
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
