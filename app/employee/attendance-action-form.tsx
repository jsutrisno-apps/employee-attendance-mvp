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
  const label = actionType === "check-in" ? "Check In Now" : "Check Out Now";

  const buttonStyle =
    actionType === "check-in"
      ? "bg-gradient-to-r from-blue-600 to-indigo-600 shadow-[0_0_30px_rgba(59,130,246,0.4)] hover:from-blue-500 hover:to-indigo-500"
      : "bg-gradient-to-r from-amber-600 to-orange-600 shadow-[0_0_30px_rgba(249,115,22,0.4)] hover:from-amber-500 hover:to-orange-500";

  return (
    <form action={formAction} className="space-y-3">
      {state.error ? (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs font-medium text-rose-300" role="alert">
          {state.error}
        </div>
      ) : null}

      {state.success ? (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs font-medium text-emerald-300" role="status">
          {state.success}
        </div>
      ) : null}

      <button
        className={`w-full rounded-xl py-3.5 text-sm font-extrabold uppercase tracking-wider text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 ${buttonStyle}`}
        disabled={pending}
        type="submit"
      >
        {pending ? "Processing..." : label}
      </button>
    </form>
  );
}
