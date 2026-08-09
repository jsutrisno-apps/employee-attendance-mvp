"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@/prisma/generated/client";
import {
  requireEmployeeMutation,
  DemoAccessRestrictedError,
  DEMO_RESTRICTED_MESSAGE,
} from "@/lib/authorization";
import { prisma } from "@/lib/db";
import {
  determineAttendanceStatus,
  getJakartaBusinessDate,
  isJakartaWorkday,
} from "@/lib/attendance-time";

export type AttendanceActionState = {
  error?: string;
  success?: string;
};

function duplicateAttendanceMessage() {
  return "Attendance has already been recorded for today.";
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function checkInAction(
  _previousState: AttendanceActionState,
  _formData: FormData,
): Promise<AttendanceActionState> {
  void _previousState;
  void _formData;

  let employee: Awaited<ReturnType<typeof requireEmployeeMutation>>;
  try {
    employee = await requireEmployeeMutation();
  } catch (error) {
    if (error instanceof DemoAccessRestrictedError) {
      return { error: DEMO_RESTRICTED_MESSAGE };
    }
    throw error;
  }

  const now = new Date();
  const attendanceDate = getJakartaBusinessDate(now);

  if (!isJakartaWorkday(now)) {
    return { error: "Check-in is not available on weekends." };
  }

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_attendanceDate: {
        employeeId: employee.employeeId,
        attendanceDate,
      },
    },
    select: {
      status: true,
    },
  });

  if (existingRecord?.status === "Leave") {
    return { error: "You are marked as Leave today." };
  }

  if (existingRecord) {
    return { error: duplicateAttendanceMessage() };
  }

  try {
    await prisma.attendanceRecord.create({
      data: {
        employeeId: employee.employeeId,
        attendanceDate,
        checkInAt: now,
        checkOutAt: null,
        status: determineAttendanceStatus(now),
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { error: duplicateAttendanceMessage() };
    }

    throw error;
  }

  revalidatePath("/employee");

  return { success: "Checked in." };
}

export async function checkOutAction(
  _previousState: AttendanceActionState,
  _formData: FormData,
): Promise<AttendanceActionState> {
  void _previousState;
  void _formData;

  let employee: Awaited<ReturnType<typeof requireEmployeeMutation>>;
  try {
    employee = await requireEmployeeMutation();
  } catch (error) {
    if (error instanceof DemoAccessRestrictedError) {
      return { error: DEMO_RESTRICTED_MESSAGE };
    }
    throw error;
  }

  const now = new Date();
  const attendanceDate = getJakartaBusinessDate(now);

  const existingRecord = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_attendanceDate: {
        employeeId: employee.employeeId,
        attendanceDate,
      },
    },
    select: {
      checkInAt: true,
      checkOutAt: true,
      status: true,
    },
  });

  if (!existingRecord) {
    return { error: "No check-in record exists for today." };
  }

  if (existingRecord.status === "Leave" || !existingRecord.checkInAt) {
    return { error: "Check-out requires a check-in record for today." };
  }

  if (existingRecord.checkOutAt) {
    return { error: "You have already checked out today." };
  }

  const result = await prisma.attendanceRecord.updateMany({
    where: {
      employeeId: employee.employeeId,
      attendanceDate,
      checkInAt: {
        not: null,
      },
      checkOutAt: null,
    },
    data: {
      checkOutAt: now,
    },
  });

  if (result.count !== 1) {
    return { error: "You have already checked out today." };
  }

  revalidatePath("/employee");

  return { success: "Checked out." };
}
