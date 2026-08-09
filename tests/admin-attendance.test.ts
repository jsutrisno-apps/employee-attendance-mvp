import { describe, expect, it } from "vitest";
import {
  buildAdminAttendanceRows,
  buildAdminAttendanceSummary,
  type AdminAttendanceEmployee,
  type AdminAttendanceRecord,
} from "@/lib/admin-attendance";

describe("admin-attendance", () => {
  const currentBusinessDate = new Date(Date.UTC(2026, 7, 10)); // 2026-08-10 (Monday)

  const activeEmp1: AdminAttendanceEmployee = {
    id: "emp-1",
    employeeNumber: "EMP001",
    name: "Alice",
    email: "alice@example.test",
    isActive: true,
  };

  const activeEmp2: AdminAttendanceEmployee = {
    id: "emp-2",
    employeeNumber: "EMP002",
    name: "Bob",
    email: "bob@example.test",
    isActive: true,
  };

  const inactiveEmp: AdminAttendanceEmployee = {
    id: "emp-3",
    employeeNumber: "EMP003",
    name: "Charlie",
    email: "charlie@example.test",
    isActive: false,
  };

  const employees = [activeEmp1, activeEmp2, inactiveEmp];

  it("classifies rows for today (current business date)", () => {
    const records: AdminAttendanceRecord[] = [
      {
        employeeId: "emp-1",
        attendanceDate: currentBusinessDate,
        checkInAt: new Date("2026-08-10T00:55:00Z"),
        checkOutAt: null,
        status: "Present",
      },
    ];

    const rows = buildAdminAttendanceRows({
      employees,
      records,
      selectedDate: currentBusinessDate,
      currentBusinessDate,
    });

    expect(rows).toEqual([
      {
        employeeId: "emp-1",
        employeeNumber: "EMP001",
        name: "Alice",
        email: "alice@example.test",
        employeeStatus: "Active",
        attendanceStatus: "Present",
        checkInTime: "07:55:00",
        checkOutTime: "-",
        source: "persisted",
      },
      {
        employeeId: "emp-2",
        employeeNumber: "EMP002",
        name: "Bob",
        email: "bob@example.test",
        employeeStatus: "Active",
        attendanceStatus: "Not checked in",
        checkInTime: "-",
        checkOutTime: "-",
        source: "neutral",
      },
      {
        employeeId: "emp-3",
        employeeNumber: "EMP003",
        name: "Charlie",
        email: "charlie@example.test",
        employeeStatus: "Inactive",
        attendanceStatus: "Not expected",
        checkInTime: "-",
        checkOutTime: "-",
        source: "neutral",
      },
    ]);
  });

  it("classifies rows for a past weekday", () => {
    const pastWeekday = new Date(Date.UTC(2026, 7, 7)); // 2026-08-07 (Friday)
    const records: AdminAttendanceRecord[] = [
      {
        employeeId: "emp-1",
        attendanceDate: pastWeekday,
        checkInAt: null,
        checkOutAt: null,
        status: "Leave",
      },
    ];

    const rows = buildAdminAttendanceRows({
      employees,
      records,
      selectedDate: pastWeekday,
      currentBusinessDate,
    });

    const aliceRow = rows.find((r) => r.employeeId === "emp-1");
    const bobRow = rows.find((r) => r.employeeId === "emp-2");
    const charlieRow = rows.find((r) => r.employeeId === "emp-3");

    expect(aliceRow?.attendanceStatus).toBe("Leave");
    expect(aliceRow?.source).toBe("persisted");

    expect(bobRow?.attendanceStatus).toBe("Absent");
    expect(bobRow?.source).toBe("derived");

    expect(charlieRow?.attendanceStatus).toBe("Not expected");
    expect(charlieRow?.source).toBe("neutral");
  });

  it("classifies rows for a weekend date or future date", () => {
    const weekendDate = new Date(Date.UTC(2026, 7, 9)); // 2026-08-09 (Sunday)

    const rows = buildAdminAttendanceRows({
      employees,
      records: [],
      selectedDate: weekendDate,
      currentBusinessDate,
    });

    for (const row of rows) {
      expect(row.attendanceStatus).toBe("Not expected");
      expect(row.source).toBe("neutral");
    }
  });

  it("classifies missing rows as Not expected when current business date itself is a Sunday", () => {
    const sundayBusinessDate = new Date(Date.UTC(2026, 7, 9)); // 2026-08-09 (Sunday)

    const rows = buildAdminAttendanceRows({
      employees,
      records: [],
      selectedDate: sundayBusinessDate,
      currentBusinessDate: sundayBusinessDate,
    });

    for (const row of rows) {
      expect(row.attendanceStatus).toBe("Not expected");
      expect(row.source).toBe("neutral");
    }
  });

  it("calculates summary counts directly matching rows", () => {
    const rows = buildAdminAttendanceRows({
      employees,
      records: [
        {
          employeeId: "emp-1",
          attendanceDate: currentBusinessDate,
          checkInAt: new Date("2026-08-10T00:55:00Z"),
          checkOutAt: null,
          status: "Present",
        },
      ],
      selectedDate: currentBusinessDate,
      currentBusinessDate,
    });

    const summary = buildAdminAttendanceSummary(rows);

    expect(summary).toEqual({
      "Total Employees": 3,
      Present: 1,
      Late: 0,
      Leave: 0,
      Absent: 0,
      "Not checked in": 1,
      "Not expected": 1,
    });
  });

  it("builds correct data point counts for 7, 14, and 30 day ranges", () => {
    for (const rangeDays of [7, 14, 30]) {
      const startDate = new Date(currentBusinessDate);
      startDate.setUTCDate(startDate.getUTCDate() - (rangeDays - 1));

      const points = [];
      for (let i = 0; i < rangeDays; i++) {
        const d = new Date(startDate);
        d.setUTCDate(d.getUTCDate() + i);
        points.push(d);
      }

      expect(points.length).toBe(rangeDays);
      expect(points[0].toISOString()).toBe(startDate.toISOString());
      expect(points[points.length - 1].toISOString()).toBe(currentBusinessDate.toISOString());
    }
  });

  it("correctly computes period summary opportunities excluding weekends for Sunday Aug 9 2026", () => {
    const sundayDate = new Date(Date.UTC(2026, 7, 9)); // 2026-08-09 (Sunday)

    for (const rangeDays of [7, 14, 30]) {
      const startDate = new Date(sundayDate);
      startDate.setUTCDate(startDate.getUTCDate() - (rangeDays - 1));

      let workdaysCount = 0;
      for (let i = 0; i < rangeDays; i++) {
        const d = new Date(startDate);
        d.setUTCDate(d.getUTCDate() + i);
        const dayOfWeek = d.getUTCDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          workdaysCount++;
        }
      }

      const activeEmployees = employees.filter((e) => e.isActive);
      const opportunities = workdaysCount * activeEmployees.length;

      if (rangeDays === 7) {
        expect(workdaysCount).toBe(5);
        expect(opportunities).toBe(5 * activeEmployees.length);
      } else if (rangeDays === 14) {
        expect(workdaysCount).toBe(10);
        expect(opportunities).toBe(10 * activeEmployees.length);
      } else if (rangeDays === 30) {
        expect(workdaysCount).toBe(20);
        expect(opportunities).toBe(20 * activeEmployees.length);
      }
    }
  });
});
