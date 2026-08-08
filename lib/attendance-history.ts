import type { AttendanceStatus } from "@/prisma/generated/client";
import {
  addBusinessDateDays,
  formatJakartaTime,
  getBusinessDateKey,
  isBusinessDateWorkday,
} from "@/lib/attendance-time";

export const ATTENDANCE_HISTORY_DAYS = 30;

export type AttendanceHistoryRecord = {
  attendanceDate: Date;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  status: AttendanceStatus;
};

export type AttendanceHistoryEntry = {
  date: Date;
  dateKey: string;
  status: AttendanceStatus;
  checkInTime: string;
  checkOutTime: string;
  source: "persisted" | "derived";
};

export function getAttendanceHistoryWindow(currentBusinessDate: Date) {
  return {
    startDate: addBusinessDateDays(
      currentBusinessDate,
      -(ATTENDANCE_HISTORY_DAYS - 1),
    ),
    endDate: currentBusinessDate,
  };
}

export function buildAttendanceHistoryEntries(
  currentBusinessDate: Date,
  records: AttendanceHistoryRecord[],
) {
  const { startDate } = getAttendanceHistoryWindow(currentBusinessDate);
  const recordByDate = new Map(
    records.map((record) => [getBusinessDateKey(record.attendanceDate), record]),
  );
  const entries: AttendanceHistoryEntry[] = [];

  for (let offset = 0; offset < ATTENDANCE_HISTORY_DAYS; offset += 1) {
    const date = addBusinessDateDays(startDate, offset);
    const dateKey = getBusinessDateKey(date);
    const persistedRecord = recordByDate.get(dateKey);
    const isCurrentBusinessDate =
      dateKey === getBusinessDateKey(currentBusinessDate);

    if (persistedRecord) {
      entries.push({
        date,
        dateKey,
        status: persistedRecord.status,
        checkInTime: formatJakartaTime(persistedRecord.checkInAt),
        checkOutTime: formatJakartaTime(persistedRecord.checkOutAt),
        source: "persisted",
      });
      continue;
    }

    if (!isCurrentBusinessDate && isBusinessDateWorkday(date)) {
      entries.push({
        date,
        dateKey,
        status: "Absent",
        checkInTime: "-",
        checkOutTime: "-",
        source: "derived",
      });
    }
  }

  return entries.toSorted((left, right) =>
    right.dateKey.localeCompare(left.dateKey),
  );
}
