import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.role === "Admin") {
    redirect("/admin");
  }

  if (session?.user?.role === "Employee") {
    redirect("/employee");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-950">
      <section className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-normal">
          Employee Attendance
        </h1>
        <p className="mt-2 text-sm text-slate-600">Sign in to continue.</p>
        <LoginForm />
      </section>
    </main>
  );
}
