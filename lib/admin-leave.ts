import { Prisma } from "@/prisma/generated/client";
import { isBusinessDateWorkday } from "@/lib/attendance-time";

export type MarkLeaveResult =
  | {
      ok: true;
      attendanceDateKey: string;
    }
  | {
      ok: false;
      field: "employeeId" | "attendanceDate" | "notes" | "form";
      message: string;
    };

const MAX_NOTE_LENGTH = 250;

export function parseBusinessDateInput(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function markEmployeeLeave({
  employeeId,
  attendanceDateKey,
  notes,
  database,
}: {
  employeeId: string;
  attendanceDateKey: string;
  notes: string;
  database: {
    employee: {
      findUnique: (args: {
        where: { id: string };
        select: { id: true };
      }) => Promise<{ id: string } | null>;
    };
    attendanceRecord: {
      findUnique: (args: {
        where: {
          employeeId_attendanceDate: {
            employeeId: string;
            attendanceDate: Date;
          };
        };
        select: {
          checkInAt: true;
          checkOutAt: true;
          status: true;
        };
      }) => Promise<{
        checkInAt: Date | null;
        checkOutAt: Date | null;
        status: string;
      } | null>;
      create: (args: {
        data: {
          employeeId: string;
          attendanceDate: Date;
          checkInAt: null;
          checkOutAt: null;
          status: "Leave";
          notes: string | null;
        };
      }) => Promise<unknown>;
    };
  };
}): Promise<MarkLeaveResult> {
  const normalizedEmployeeId = employeeId.trim();
  const normalizedDateKey = attendanceDateKey.trim();
  const normalizedNotes = notes.trim();
  const attendanceDate = parseBusinessDateInput(normalizedDateKey);

  if (!normalizedEmployeeId) {
    return {
      ok: false,
      field: "employeeId",
      message: "Employee is required.",
    };
  }

  if (!normalizedDateKey) {
    return {
      ok: false,
      field: "attendanceDate",
      message: "Date is required.",
    };
  }

  if (!attendanceDate) {
    return {
      ok: false,
      field: "attendanceDate",
      message: "Enter a valid date.",
    };
  }

  if (!isBusinessDateWorkday(attendanceDate)) {
    return {
      ok: false,
      field: "attendanceDate",
      message: "Leave can only be marked for Monday-Friday.",
    };
  }

  if (normalizedNotes.length > MAX_NOTE_LENGTH) {
    return {
      ok: false,
      field: "notes",
      message: `Notes must be ${MAX_NOTE_LENGTH} characters or fewer.`,
    };
  }

  const employee = await database.employee.findUnique({
    where: { id: normalizedEmployeeId },
    select: { id: true },
  });

  if (!employee) {
    return {
      ok: false,
      field: "employeeId",
      message: "Employee was not found.",
    };
  }

  const existingRecord = await database.attendanceRecord.findUnique({
    where: {
      employeeId_attendanceDate: {
        employeeId: employee.id,
        attendanceDate,
      },
    },
    select: {
      checkInAt: true,
      checkOutAt: true,
      status: true,
    },
  });

  if (existingRecord?.checkInAt || existingRecord?.checkOutAt) {
    return {
      ok: false,
      field: "form",
      message: "Attendance already exists for this employee and date.",
    };
  }

  if (existingRecord?.status === "Leave") {
    return {
      ok: false,
      field: "form",
      message: "Leave is already recorded for this employee and date.",
    };
  }

  if (existingRecord) {
    return {
      ok: false,
      field: "form",
      message: "Attendance already exists for this employee and date.",
    };
  }

  try {
    await database.attendanceRecord.create({
      data: {
        employeeId: employee.id,
        attendanceDate,
        checkInAt: null,
        checkOutAt: null,
        status: "Leave",
        notes: normalizedNotes || null,
      },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return {
        ok: false,
        field: "form",
        message: "Attendance already exists for this employee and date.",
      };
    }

    throw error;
  }

  return {
    ok: true,
    attendanceDateKey: normalizedDateKey,
  };
}
