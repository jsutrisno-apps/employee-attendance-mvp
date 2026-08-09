"use client";

import React from "react";
import { LockIcon, CloseIcon } from "./icons";
import { DEMO_RESTRICTED_TITLE, DEMO_RESTRICTED_MESSAGE } from "@/lib/authorization-constants";

type DemoRestrictedModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
};

export function DemoRestrictedModal({
  isOpen,
  onClose,
  title = DEMO_RESTRICTED_TITLE,
  message = DEMO_RESTRICTED_MESSAGE,
}: DemoRestrictedModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="demo-restricted-title"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-amber-500/30 bg-white dark:bg-[#0F172A] p-6 shadow-2xl space-y-5 text-center">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg"
          aria-label="Close dialog"
        >
          <CloseIcon size={18} />
        </button>

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-inner">
          <LockIcon size={28} />
        </div>

        <div className="space-y-2">
          <h3
            id="demo-restricted-title"
            className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white"
          >
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300 font-medium">
            {message}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:opacity-95 active:scale-[0.98]"
          >
            Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
