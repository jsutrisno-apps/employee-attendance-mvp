"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { EmployeeFormState } from "./actions";

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
};

const initialState: EmployeeFormState = {};

export function EmployeeForm({ action, employee, mode }: EmployeeFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-8 max-w-xl space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="employeeNumber">
          Employee number
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          defaultValue={employee?.employeeNumber}
          id="employeeNumber"
          name="employeeNumber"
          required
          type="text"
        />
        {state.errors?.employeeNumber ? (
          <p className="text-sm text-red-700" role="alert">
            {state.errors.employeeNumber}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="name">
          Name
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          defaultValue={employee?.name}
          id="name"
          name="name"
          required
          type="text"
        />
        {state.errors?.name ? (
          <p className="text-sm text-red-700" role="alert">
            {state.errors.name}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="email">
          Email
        </label>
        <input
          autoComplete="email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
          defaultValue={employee?.email}
          id="email"
          name="email"
          required
          type="email"
        />
        {state.errors?.email ? (
          <p className="text-sm text-red-700" role="alert">
            {state.errors.email}
          </p>
        ) : null}
      </div>

      {mode === "edit" ? (
        <label className="flex items-center gap-3 text-sm font-medium">
          <input
            className="h-4 w-4 rounded border-slate-300"
            defaultChecked={employee?.isActive}
            name="isActive"
            type="checkbox"
          />
          Active
        </label>
      ) : null}

      {state.errors?.form ? (
        <p className="text-sm text-red-700" role="alert">
          {state.errors.form}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
          disabled={pending}
          type="submit"
        >
          {pending
            ? "Saving..."
            : mode === "create"
              ? "Add employee"
              : "Save changes"}
        </button>
        <Link
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium"
          href="/admin/employees"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
