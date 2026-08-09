"use client";

import { useActionState } from "react";
import { markLeaveAction, type LeaveFormState } from "./actions";

type LeaveFormEmployee = {
  id: string;
  employeeNumber: string;
  name: string;
};

type LeaveFormProps = {
  employees: LeaveFormEmployee[];
  defaultDate: string;
};

const initialState: LeaveFormState = {};

export function LeaveForm({ employees, defaultDate }: LeaveFormProps) {
  const [state, formAction, pending] = useActionState(
    markLeaveAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      {state.errors?.form ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-600 dark:text-rose-300">
          {state.errors.form}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="employeeId">
          Select Employee
        </label>
        <select
          className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#090E1A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          id="employeeId"
          name="employeeId"
          required
        >
          <option value="" className="bg-white dark:bg-[#090E1A] text-slate-500 dark:text-slate-400">Select employee...</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id} className="bg-white dark:bg-[#090E1A] text-slate-900 dark:text-white">
              {employee.employeeNumber} - {employee.name}
            </option>
          ))}
        </select>
        {state.errors?.employeeId ? (
          <p className="text-xs text-rose-500 dark:text-rose-400">{state.errors.employeeId}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="attendanceDate">
          Leave Date
        </label>
        <input
          className="w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#090E1A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          defaultValue={defaultDate}
          id="attendanceDate"
          name="attendanceDate"
          required
          type="date"
        />
        {state.errors?.attendanceDate ? (
          <p className="text-xs text-rose-500 dark:text-rose-400">{state.errors.attendanceDate}</p>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300" htmlFor="notes">
          Notes / Reason (Optional)
        </label>
        <textarea
          className="min-h-24 w-full rounded-xl border border-slate-200 dark:border-white/[0.1] bg-slate-50 dark:bg-[#090E1A] px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          id="notes"
          maxLength={250}
          name="notes"
          placeholder="Annual leave, medical leave, personal business..."
        />
        {state.errors?.notes ? (
          <p className="text-xs text-rose-500 dark:text-rose-400">{state.errors.notes}</p>
        ) : null}
      </div>

      <button
        className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={pending || employees.length === 0}
        type="submit"
      >
        {pending ? "Saving..." : "Mark as Leave"}
      </button>
    </form>
  );
}
