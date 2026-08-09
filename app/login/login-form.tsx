"use client";

import { useActionState } from "react";
import { loginAction, demoLoginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );
  const [demoState, demoFormAction, demoPending] = useActionState(
    demoLoginAction,
    initialState,
  );

  const errorMessage = state.error || demoState.error;

  return (
    <div className="space-y-4">
      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700"
            htmlFor="email"
          >
            Email Address
          </label>
          <input
            autoComplete="email"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-transparent outline-none transition duration-150 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
            id="email"
            name="email"
            placeholder=""
            required
            type="email"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="block text-[11px] font-semibold uppercase tracking-wider text-slate-700"
            htmlFor="password"
          >
            Password
          </label>
          <input
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-transparent outline-none transition duration-150 focus:border-blue-600 focus:bg-white focus:ring-2 focus:ring-blue-600/20"
            id="password"
            name="password"
            placeholder=""
            required
            type="password"
          />
        </div>

        {errorMessage ? (
          <div
            className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-medium text-rose-700"
            role="alert"
          >
            <svg
              className="h-4 w-4 shrink-0 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span>{errorMessage}</span>
          </div>
        ) : null}

        <button
          className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition duration-150 hover:bg-blue-700 active:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending || demoPending}
          type="submit"
        >
          {pending ? "Signing in..." : "Sign in"}
        </button>
      </form>

      {/* Separator */}
      <div className="relative my-4 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200/90" aria-hidden="true" />
        </div>
        <div className="relative bg-white px-3 text-[11px] font-medium tracking-wider text-slate-400 uppercase">
          or
        </div>
      </div>

      {/* Explore Demo CTA */}
      <form action={demoFormAction}>
        <button
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition duration-150 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 active:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={pending || demoPending}
          type="submit"
        >
          {demoPending ? "Opening Demo..." : "Explore Demo"}
        </button>
      </form>
    </div>
  );
}
