import { redirect } from "next/navigation";
import Image from "next/image";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();

  if (session?.user?.role === "Admin" || session?.user?.role === "Demo") {
    redirect("/admin");
  }

  if (session?.user?.role === "Employee") {
    redirect("/employee");
  }

  return (
    <main className="relative min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col lg:flex-row overflow-x-hidden font-sans">
      {/* Background Architectural System & Soft Radial Depth */}
      <div className="pointer-events-none absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="pointer-events-none absolute -top-32 -left-32 h-[500px] w-[500px] rounded-full bg-blue-500/[0.06] blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 left-1/4 h-96 w-96 rounded-full bg-indigo-500/[0.04] blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-32 right-1/4 h-[450px] w-[450px] rounded-full bg-sky-400/[0.05] blur-[110px]" />

      {/* LEFT BRAND & EXPERIENCE PANEL (Desktop & Large Screens) */}
      <section className="relative hidden lg:flex lg:w-[46%] xl:w-[44%] flex-col justify-between p-12 xl:p-16 z-10">
        {/* Top Brand Header with Official Wordmark Asset */}
        <div>
          <Image
            src="/coalistix-wordmark-black.png"
            alt="COALISTIX"
            width={360}
            height={240}
            className="w-64 xl:w-72 h-auto object-contain shrink-0 -ml-3.5"
            priority
          />
        </div>

        {/* Middle Content: Eyebrow, Headline, Statement, Refined Micro-Features */}
        <div className="my-auto py-8 space-y-9">
          <div className="space-y-3 max-w-md">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/60 bg-blue-50/70 px-3 py-0.5 text-[10px] font-semibold tracking-wider text-blue-700 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
              EMPLOYEE ATTENDANCE
            </div>
            <h1 className="text-2xl xl:text-3xl font-bold tracking-tight text-slate-900 leading-snug">
              Enterprise Attendance <br />
              Management
            </h1>
            <p className="text-xs xl:text-sm leading-relaxed text-slate-600 font-normal">
              A modern workspace for attendance visibility, workforce insights, and operational control.
            </p>
          </div>

          {/* Capability Indicators — Unboxed Micro-Features */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-5 max-w-md pt-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-50 text-blue-600 shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Secure Access</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal pl-7">Role-based authentication & encrypted sessions</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-indigo-50 text-indigo-600 shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Attendance Insights</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal pl-7">Real-time workforce activity & time tracking</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-sky-50 text-sky-600 shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Role-Based Experience</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal pl-7">Tailored views for admins and employees</p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-50 text-emerald-600 shrink-0">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-xs font-semibold">Real-Time Records</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal pl-7">Instant updates across all operational metrics</p>
            </div>
          </div>
        </div>

        {/* Empty bottom space */}
        <div aria-hidden="true" />
      </section>

      {/* RIGHT AUTHENTICATION AREA */}
      <section className="relative flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-screen z-10">
        {/* Mobile Header Identifier */}
        <div className="flex lg:hidden mb-6">
          <Image
            src="/coalistix-wordmark-black.png"
            alt="COALISTIX"
            width={240}
            height={160}
            className="w-48 sm:w-56 h-auto object-contain shrink-0 -ml-2"
            priority
          />
        </div>

        {/* Centered Login Card Container (Refined & Proportionate) */}
        <div className="my-auto w-full max-w-[390px] mx-auto">
          <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-[0_16px_40px_-12px_rgba(15,23,42,0.06)] backdrop-blur-md">
            {/* Card Header — Unboxed Clean Logo Presentation */}
            <div className="flex flex-col items-center text-center mb-6">
              <Image
                src="/dashboard-logo.png"
                alt="COALISTIX Logo"
                width={48}
                height={48}
                className="h-12 w-12 object-contain mb-3.5 shrink-0"
                priority
              />
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Welcome Back
              </h1>
              <p className="mt-1 text-xs text-slate-500 font-medium">
                Sign in to access your Employee Attendance workspace.
              </p>
            </div>

            {/* Authentication Form */}
            <LoginForm />
          </div>
        </div>

        {/* Subtle Right Footer */}
        <div className="mt-6 text-center">
          <p className="text-[11px] text-slate-600 font-medium">
            © 2026 Coalistix Employee Attendance • Asia/Jakarta Business Timezone
          </p>
        </div>
      </section>
    </main>
  );
}
