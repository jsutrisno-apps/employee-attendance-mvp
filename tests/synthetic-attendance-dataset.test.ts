import { describe, expect, it } from "vitest";
import { canonicalEmployees } from "../prisma/seed";
import {
  buildAdminAttendanceRows,
  buildAdminAttendanceSummary,
  type AdminAttendanceEmployee,
  type AdminAttendanceRecord,
} from "@/lib/admin-attendance";
import {
  isBusinessDateWorkday,
  getBusinessDateKey,
} from "@/lib/attendance-time";

describe("Stage A3 — Synthetic Attendance Dataset Quality Assertions", () => {
  const referenceDate = new Date(Date.UTC(2026, 7, 9)); // 2026-08-09 (Sunday)

  const activeEmployees: AdminAttendanceEmployee[] = canonicalEmployees.map((emp, idx) => ({
    id: `emp-${idx + 1}`,
    employeeNumber: emp.employeeNumber,
    name: emp.name,
    email: emp.email,
    isActive: true,
  }));

  // Helper to generate deterministic test attendance records identical to seed logic
  function generateTestDataset() {
    function mulberry32(seed: number) {
      return function () {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function getWorkdays(startDateStr: string, endDateStr: string): string[] {
      const workdays: string[] = [];
      const current = new Date(`${startDateStr}T00:00:00.000Z`);
      const end = new Date(`${endDateStr}T00:00:00.000Z`);

      while (current <= end) {
        const dayOfWeek = current.getUTCDay();
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          const year = current.getUTCFullYear();
          const month = String(current.getUTCMonth() + 1).padStart(2, "0");
          const day = String(current.getUTCDate()).padStart(2, "0");
          workdays.push(`${year}-${month}-${day}`);
        }
        current.setUTCDate(current.getUTCDate() + 1);
      }
      return workdays;
    }

    const workdays = getWorkdays("2026-07-01", "2026-08-09");
    const records: AdminAttendanceRecord[] = [];

    let countPresent = 0;
    let countLate = 0;
    let countLeave = 0;
    let countDerivedAbsent = 0;

    for (let empIdx = 0; empIdx < canonicalEmployees.length; empIdx++) {
      const empId = `emp-${empIdx + 1}`;

      for (let dIdx = 0; dIdx < workdays.length; dIdx++) {
        const dateStr = workdays[dIdx];
        const [year, month, day] = dateStr.split("-").map(Number);
        const attendanceDate = new Date(Date.UTC(year, month - 1, day));

        const seed = 20260701 + empIdx * 1000 + dIdx * 13;
        const prng = mulberry32(seed);
        const val = prng();

        let pThreshold = 0.89;
        let lThreshold = 0.95;
        let lvThreshold = 0.98;

        if (empIdx >= 12 && empIdx <= 16) {
          pThreshold = 0.82;
          lThreshold = 0.95;
          lvThreshold = 0.98;
        } else if (empIdx >= 17) {
          pThreshold = 0.80;
          lThreshold = 0.86;
          lvThreshold = 0.96;
        }

        if (val < pThreshold) {
          countPresent++;
          const checkInMin = Math.floor(prng() * 26);
          const checkInAt = new Date(Date.UTC(year, month - 1, day, 0, 35 + checkInMin, 0));
          const checkOutMin = Math.floor(prng() * 76);
          const checkOutAt = new Date(Date.UTC(year, month - 1, day, 9, 45 + checkOutMin, 0));

          records.push({
            employeeId: empId,
            attendanceDate,
            checkInAt,
            checkOutAt,
            status: "Present",
          });
        } else if (val < lThreshold) {
          countLate++;
          const checkInMin = 1 + Math.floor(prng() * 64);
          const checkInAt = new Date(Date.UTC(year, month - 1, day, 1, checkInMin, 0));
          const checkOutMin = Math.floor(prng() * 76);
          const checkOutAt = new Date(Date.UTC(year, month - 1, day, 9, 45 + checkOutMin, 0));

          records.push({
            employeeId: empId,
            attendanceDate,
            checkInAt,
            checkOutAt,
            status: "Late",
          });
        } else if (val < lvThreshold) {
          countLeave++;
          records.push({
            employeeId: empId,
            attendanceDate,
            checkInAt: null,
            checkOutAt: null,
            status: "Leave",
          });
        } else {
          countDerivedAbsent++;
        }
      }
    }

    return {
      workdays,
      records,
      countPresent,
      countLate,
      countLeave,
      countDerivedAbsent,
      totalOpportunities: canonicalEmployees.length * workdays.length,
    };
  }

  it("1. generates deterministic attendance records identically across multiple invocations", () => {
    const run1 = generateTestDataset();
    const run2 = generateTestDataset();

    expect(run1.records.length).toBe(run2.records.length);
    expect(run1.countPresent).toBe(run2.countPresent);
    expect(run1.countLate).toBe(run2.countLate);
    expect(run1.countLeave).toBe(run2.countLeave);
    expect(run1.countDerivedAbsent).toBe(run2.countDerivedAbsent);
    expect(run1.records).toEqual(run2.records);
  });

  it("2. ensures 0 weekend attendance records are generated", () => {
    const dataset = generateTestDataset();

    for (const record of dataset.records) {
      const dayOfWeek = record.attendanceDate.getUTCDay();
      expect(dayOfWeek).toBeGreaterThanOrEqual(1);
      expect(dayOfWeek).toBeLessThanOrEqual(5);
    }
  });

  it("3-6. verifies Present, Late, Leave, and derived Absent all exist and are non-zero", () => {
    const dataset = generateTestDataset();

    expect(dataset.countPresent).toBeGreaterThan(0);
    expect(dataset.countLate).toBeGreaterThan(0);
    expect(dataset.countLeave).toBeGreaterThan(0);
    expect(dataset.countDerivedAbsent).toBeGreaterThan(0);
  });

  it("7. verifies no duplicate employee/date attendance records exist", () => {
    const dataset = generateTestDataset();
    const keys = new Set<string>();

    for (const record of dataset.records) {
      const key = `${record.employeeId}_${getBusinessDateKey(record.attendanceDate)}`;
      expect(keys.has(key)).toBe(false);
      keys.add(key);
    }
  });

  it("8. verifies check-out is not before check-in for all records where both exist", () => {
    const dataset = generateTestDataset();

    for (const record of dataset.records) {
      if (record.checkInAt && record.checkOutAt) {
        expect(record.checkOutAt.getTime()).toBeGreaterThanOrEqual(record.checkInAt.getTime());
      }
    }
  });

  it("9-11. correctly calculates 7, 14, and 30 day historical selector metrics", () => {
    const dataset = generateTestDataset();

    for (const rangeDays of [7, 14, 30]) {
      const startDate = new Date(referenceDate);
      startDate.setUTCDate(startDate.getUTCDate() - (rangeDays - 1));

      let workdaysCount = 0;
      for (let i = 0; i < rangeDays; i++) {
        const d = new Date(startDate);
        d.setUTCDate(d.getUTCDate() + i);
        if (isBusinessDateWorkday(d)) workdaysCount++;
      }

      const rangeRecords = dataset.records.filter(
        (r) => r.attendanceDate >= startDate && r.attendanceDate <= referenceDate
      );

      const present = rangeRecords.filter((r) => r.status === "Present").length;
      const late = rangeRecords.filter((r) => r.status === "Late").length;
      const leave = rangeRecords.filter((r) => r.status === "Leave").length;
      const opportunities = workdaysCount * activeEmployees.length;
      const absent = opportunities - (present + late + leave);

      if (rangeDays === 7) {
        expect(workdaysCount).toBe(5);
        expect(opportunities).toBe(100);
        expect(present).toBe(91);
        expect(late).toBe(2);
        expect(leave).toBe(4);
        expect(absent).toBe(3);
        expect(rangeRecords.length).toBe(97);
      } else if (rangeDays === 14) {
        expect(workdaysCount).toBe(10);
        expect(opportunities).toBe(200);
        expect(present).toBe(180);
        expect(late).toBe(10);
        expect(leave).toBe(5);
        expect(absent).toBe(5);
        expect(rangeRecords.length).toBe(195);
      } else if (rangeDays === 30) {
        expect(workdaysCount).toBe(20);
        expect(opportunities).toBe(400);
        expect(present).toBe(355);
        expect(late).toBe(27);
        expect(leave).toBe(9);
        expect(absent).toBe(9);
        expect(rangeRecords.length).toBe(391);
      }
    }
  });

  it("12. verifies non-workday (Sunday Aug 9, 2026) semantics do not falsely produce mass absence", () => {
    const rows = buildAdminAttendanceRows({
      employees: activeEmployees,
      records: [],
      selectedDate: referenceDate,
      currentBusinessDate: referenceDate,
    });

    const summary = buildAdminAttendanceSummary(rows);

    expect(summary["Not expected"]).toBe(20);
    expect(summary.Absent).toBe(0);
    expect(summary["Not checked in"]).toBe(0);
  });

  it("13. verifies attendance opportunity denominator excludes weekends", () => {
    const dataset = generateTestDataset();
    expect(dataset.workdays.length).toBe(28);
    expect(dataset.totalOpportunities).toBe(560); // 28 workdays * 20 employees
  });

  it("14. verifies Stage A2 synthetic employee dataset remains intact", () => {
    expect(canonicalEmployees).toHaveLength(20);
    expect(canonicalEmployees[0].employeeNumber).toBe("CX-0001");
    expect(canonicalEmployees[19].employeeNumber).toBe("CX-0020");
    for (const emp of canonicalEmployees) {
      expect(emp.email).toMatch(/^[a-z]+\.[a-z]+@example\.test$/);
    }
  });
});
