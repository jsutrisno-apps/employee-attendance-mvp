import type { AttendanceStatus } from "@/prisma/generated/client";
import {
  formatJakartaTime,
  getBusinessDateKey,
  isBusinessDateWorkday,
} from "@/lib/attendance-time";

export type AdminAttendanceDisplayStatus =
  | AttendanceStatus
  | "Not checked in"
  | "Not expected";

export type AdminAttendanceEmployee = {
  id: string;
  employeeNumber: string;
  name: string;
  email: string;
  isActive: boolean;
};

export type AdminAttendanceRecord = {
  employeeId: string;
  attendanceDate: Date;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  status: AttendanceStatus;
};

export type AdminAttendanceRow = {
  employeeId: string;
  employeeNumber: string;
  name: string;
  email: string;
  employeeStatus: "Active" | "Inactive";
  attendanceStatus: AdminAttendanceDisplayStatus;
  checkInTime: string;
  checkOutTime: string;
  source: "persisted" | "derived" | "neutral";
};

export type AdminAttendanceSummary = Record<
  AdminAttendanceDisplayStatus | "Total Employees",
  number
>;

function statusForMissingRecord(
  selectedDate: Date,
  currentBusinessDate: Date,
  isActive: boolean,
): {
  attendanceStatus: AdminAttendanceDisplayStatus;
  source: AdminAttendanceRow["source"];
} {
  if (!isActive) {
    return {
      attendanceStatus: "Not expected",
      source: "neutral",
    };
  }

  const selectedDateKey = getBusinessDateKey(selectedDate);
  const currentDateKey = getBusinessDateKey(currentBusinessDate);

  if (selectedDateKey > currentDateKey || !isBusinessDateWorkday(selectedDate)) {
    return {
      attendanceStatus: "Not expected",
      source: "neutral",
    };
  }

  if (selectedDateKey === currentDateKey) {
    return {
      attendanceStatus: "Not checked in",
      source: "neutral",
    };
  }

  return {
    attendanceStatus: "Absent",
    source: "derived",
  };
}

export function buildAdminAttendanceRows({
  employees,
  records,
  selectedDate,
  currentBusinessDate,
}: {
  employees: AdminAttendanceEmployee[];
  records: AdminAttendanceRecord[];
  selectedDate: Date;
  currentBusinessDate: Date;
}) {
  const recordsByEmployeeId = new Map(
    records.map((record) => [record.employeeId, record]),
  );

  return employees.map<AdminAttendanceRow>((employee) => {
    const record = recordsByEmployeeId.get(employee.id);

    if (record) {
      return {
        employeeId: employee.id,
        employeeNumber: employee.employeeNumber,
        name: employee.name,
        email: employee.email,
        employeeStatus: employee.isActive ? "Active" : "Inactive",
        attendanceStatus: record.status,
        checkInTime: formatJakartaTime(record.checkInAt),
        checkOutTime: formatJakartaTime(record.checkOutAt),
        source: "persisted",
      };
    }

    const missingStatus = statusForMissingRecord(
      selectedDate,
      currentBusinessDate,
      employee.isActive,
    );

    return {
      employeeId: employee.id,
      employeeNumber: employee.employeeNumber,
      name: employee.name,
      email: employee.email,
      employeeStatus: employee.isActive ? "Active" : "Inactive",
      attendanceStatus: missingStatus.attendanceStatus,
      checkInTime: "-",
      checkOutTime: "-",
      source: missingStatus.source,
    };
  });
}

export function buildAdminAttendanceSummary(rows: AdminAttendanceRow[]) {
  const summary: AdminAttendanceSummary = {
    "Total Employees": rows.length,
    Present: 0,
    Late: 0,
    Leave: 0,
    Absent: 0,
    "Not checked in": 0,
    "Not expected": 0,
  };

  for (const row of rows) {
    summary[row.attendanceStatus] += 1;
  }

  return summary;
}
