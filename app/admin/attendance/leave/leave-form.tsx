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
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.errors.form}
        </p>
      ) : null}

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="employeeId">
          Employee
        </label>
        <select
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          id="employeeId"
          name="employeeId"
          required
        >
          <option value="">Select employee</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.employeeNumber} - {employee.name}
            </option>
          ))}
        </select>
        {state.errors?.employeeId ? (
          <p className="text-sm text-red-700">{state.errors.employeeId}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="attendanceDate">
          Date
        </label>
        <input
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          defaultValue={defaultDate}
          id="attendanceDate"
          name="attendanceDate"
          required
          type="date"
        />
        {state.errors?.attendanceDate ? (
          <p className="text-sm text-red-700">{state.errors.attendanceDate}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium" htmlFor="notes">
          Notes
        </label>
        <textarea
          className="min-h-24 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          id="notes"
          maxLength={250}
          name="notes"
        />
        {state.errors?.notes ? (
          <p className="text-sm text-red-700">{state.errors.notes}</p>
        ) : null}
      </div>

      <button
        className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={pending || employees.length === 0}
        type="submit"
      >
        {pending ? "Working..." : "Mark as Leave"}
      </button>
    </form>
  );
}
