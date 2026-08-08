import { describe, expect, it } from "vitest";
import {
  buildAttendanceHistoryEntries,
  getAttendanceHistoryWindow,
  type AttendanceHistoryRecord,
} from "@/lib/attendance-history";
import { getBusinessDateKey } from "@/lib/attendance-time";

describe("attendance-history", () => {
  const currentBusinessDate = new Date(Date.UTC(2026, 7, 10)); // 2026-08-10 (Monday)

  it("calculates exact 30-day inclusive window ending on current business date", () => {
    const { startDate, endDate } = getAttendanceHistoryWindow(currentBusinessDate);

    expect(getBusinessDateKey(endDate)).toBe("2026-08-10");
    expect(getBusinessDateKey(startDate)).toBe("2026-07-12");
  });

  it("builds history entries: persisted win, missing past weekdays derived as Absent, current missing omitted", () => {
    const pastFriday = new Date(Date.UTC(2026, 7, 7)); // 2026-08-07
    const pastWeekendSat = new Date(Date.UTC(2026, 7, 8)); // 2026-08-08

    const records: AttendanceHistoryRecord[] = [
      {
        attendanceDate: currentBusinessDate,
        checkInAt: new Date("2026-08-10T00:55:00Z"),
        checkOutAt: null,
        status: "Present",
      },
      {
        attendanceDate: pastFriday,
        checkInAt: null,
        checkOutAt: null,
        status: "Leave",
      },
      {
        attendanceDate: pastWeekendSat,
        checkInAt: new Date("2026-08-08T01:00:00Z"),
        checkOutAt: new Date("2026-08-08T09:00:00Z"),
        status: "Present",
      },
    ];

    const entries = buildAttendanceHistoryEntries(currentBusinessDate, records);

    // Entries are ordered newest-first
    expect(entries[0].dateKey).toBe("2026-08-10");
    expect(entries[0].status).toBe("Present");
    expect(entries[0].source).toBe("persisted");

    // Past Weekend Sat was persisted so it remains visible
    const weekendSatEntry = entries.find((e) => e.dateKey === "2026-08-08");
    expect(weekendSatEntry).toBeDefined();
    expect(weekendSatEntry?.status).toBe("Present");
    expect(weekendSatEntry?.source).toBe("persisted");

    // Past Weekend Sun was NOT persisted, so it must NOT exist in entries (not derived Absent)
    const weekendSunEntry = entries.find((e) => e.dateKey === "2026-08-09");
    expect(weekendSunEntry).toBeUndefined();

    // Past Friday was persisted as Leave
    const fridayEntry = entries.find((e) => e.dateKey === "2026-08-07");
    expect(fridayEntry?.status).toBe("Leave");
    expect(fridayEntry?.source).toBe("persisted");

    // Past Thursday had no record, so derived Absent
    const thursdayEntry = entries.find((e) => e.dateKey === "2026-08-06");
    expect(thursdayEntry?.status).toBe("Absent");
    expect(thursdayEntry?.source).toBe("derived");
  });

  it("does not mark missing current business date as Absent", () => {
    const entries = buildAttendanceHistoryEntries(currentBusinessDate, []);

    const currentEntry = entries.find((e) => e.dateKey === "2026-08-10");
    expect(currentEntry).toBeUndefined();
  });
});
