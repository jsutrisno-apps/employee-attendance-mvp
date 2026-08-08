"use client";

import { useActionState } from "react";
import {
  checkInAction,
  checkOutAction,
  type AttendanceActionState,
} from "./actions";

type AttendanceActionFormProps = {
  actionType: "check-in" | "check-out";
};

const initialState: AttendanceActionState = {};

export function AttendanceActionForm({
  actionType,
}: AttendanceActionFormProps) {
  const action = actionType === "check-in" ? checkInAction : checkOutAction;
  const [state, formAction, pending] = useActionState(action, initialState);
  const label = actionType === "check-in" ? "Check in" : "Check out";

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <p className="text-sm text-red-700" role="alert">
          {state.error}
        </p>
      ) : null}

      {state.success ? (
        <p className="text-sm text-emerald-700" role="status">
          {state.success}
        </p>
      ) : null}

      <button
        className="w-full rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-slate-400"
        disabled={pending}
        type="submit"
      >
        {pending ? "Working..." : label}
      </button>
    </form>
  );
}
