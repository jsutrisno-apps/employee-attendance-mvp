"use client";

import Link from "next/link";
import { useState, useActionState } from "react";
import type { EmployeeFormState } from "./actions";
import { DemoRestrictedModal } from "@/components/demo-restricted-modal";
import { DEMO_RESTRICTED_MESSAGE } from "@/lib/authorization-constants";
import { LockIcon } from "@/components/icons";

type EmployeeFormProps = {
  action: (
    previousState: EmployeeFormState,
    formData: FormData,
  ) => Promise<EmployeeFormState>;
  employee?: {
    employeeNumber: string;
    name: string;
    email: string;
    isActive: boolean;
  };
  mode: "create" | "edit";
  isDemo?: boolean;
};

const initialState: EmployeeFormState = {};

export function EmployeeForm({ action, employee, mode, isDemo }: EmployeeFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  const showDemoModal =
    state.errors?.form === DEMO_RESTRICTED_MESSAGE &&
    dismissedMessage !== state.errors?.form;

  return (
    <>
      <DemoRestrictedModal
        isOpen={showDemoModal}
        onClose={() => setDismissedMessage(state.errors?.form ?? null)}
      />

      <form action={formAction} className="space-y-5">
        {isDemo ? (
          <div className="flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs font-medium text-amber-800 dark:text-amber-300">
            <LockIcon size={20} className="shrink-0 text-amber-500 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Demo Access Restricted</p>
              <p className="leading-relaxed">
                {DEMO_RESTRICTED_MESSAGE}
              </p>
            </div>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="employeeNumber">
            Employee Number
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#090E1A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            defaultValue={employee?.employeeNumber}
            id="employeeNumber"
            name="employeeNumber"
            placeholder="e.g. EMP-0001"
            required
            type="text"
          />
          {state.errors?.employeeNumber ? (
            <p className="text-xs text-rose-500 dark:text-rose-400" role="alert">
              {state.errors.employeeNumber}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="name">
            Full Name
          </label>
          <input
            className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#090E1A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            defaultValue={employee?.name}
            id="name"
            name="name"
            placeholder="e.g. Alex Rivera"
            required
            type="text"
          />
          {state.errors?.name ? (
            <p className="text-xs text-rose-500 dark:text-rose-400" role="alert">
              {state.errors.name}
            </p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="email">
            Email Address
          </label>
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#090E1A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            defaultValue={employee?.email}
            id="email"
            name="email"
            placeholder="alex@company.test"
            required
            type="email"
          />
          {state.errors?.email ? (
            <p className="text-xs text-rose-500 dark:text-rose-400" role="alert">
              {state.errors.email}
            </p>
          ) : null}
        </div>

        {mode === "edit" ? (
          <label className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200 cursor-pointer pt-1">
            <input
              className="h-4 w-4 rounded border-slate-300 dark:border-white/[0.2] bg-slate-50 dark:bg-[#090E1A] text-blue-600 focus:ring-blue-500 accent-blue-600"
              defaultChecked={employee?.isActive}
              name="isActive"
              type="checkbox"
            />
            <span>Active Employee Account</span>
          </label>
        ) : null}

        {state.errors?.form && state.errors.form !== DEMO_RESTRICTED_MESSAGE ? (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-300" role="alert">
            {state.errors.form}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={pending}
            type="submit"
          >
            {pending
              ? "Saving..."
              : mode === "create"
                ? "Add Employee"
                : "Save Changes"}
          </button>
          <Link
            className="rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-100 dark:bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-300 transition hover:bg-slate-200 dark:hover:bg-white/[0.08]"
            href="/admin/employees"
          >
            Cancel
          </Link>
        </div>
      </form>
    </>
  );
}
