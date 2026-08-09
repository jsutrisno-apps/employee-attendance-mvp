import { redirect } from "next/navigation";
import Image from "next/image";
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
    <main className="relative flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#07090E] px-4 py-12 text-slate-900 dark:text-slate-100 overflow-hidden font-sans">
      {/* Background Ambient Glow Effects */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/10 blur-[120px]" />

      <section className="relative z-10 w-full max-w-md space-y-6 rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-8 shadow-xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="flex flex-col items-center text-center">
          <Image
            src="/dashboard-logo.png"
            alt="COALISTIX Logo"
            width={48}
            height={48}
            className="mb-3 h-12 w-12 object-contain"
            priority
          />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Employee Attendance
          </h1>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium">
            Sign in to access your enterprise dashboard.
          </p>
        </div>

        <LoginForm />

        <div className="pt-4 border-t border-slate-200 dark:border-white/[0.06] text-center">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            © 2026 Coalistix Employee Attendance • Asia/Jakarta Business Timezone
          </p>
        </div>
      </section>
    </main>
  );
}
