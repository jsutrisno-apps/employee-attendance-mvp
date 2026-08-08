import { signOut } from "@/auth";
import { requireEmployee } from "@/lib/authorization";

export default async function EmployeePage() {
  await requireEmployee();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="text-center">
        <h1 className="text-3xl font-semibold tracking-normal">
          Employee Area
        </h1>
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
