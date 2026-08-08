"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { markEmployeeLeave } from "@/lib/admin-leave";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export type LeaveFormState = {
  errors?: {
    employeeId?: string;
    attendanceDate?: string;
    notes?: string;
    form?: string;
  };
};

function readField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

export async function markLeaveAction(
  _previousState: LeaveFormState,
  formData: FormData,
): Promise<LeaveFormState> {
  await requireAdmin();

  const result = await markEmployeeLeave({
    database: prisma,
    employeeId: readField(formData, "employeeId"),
    attendanceDateKey: readField(formData, "attendanceDate"),
    notes: readField(formData, "notes"),
  });

  if (!result.ok) {
    return {
      errors: {
        [result.field]: result.message,
      },
    };
  }

  revalidatePath("/admin/attendance");
  revalidatePath("/employee");
  redirect(`/admin/attendance?date=${result.attendanceDateKey}`);
}
