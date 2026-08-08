import { describe, expect, it } from "vitest";
import {
  addBusinessDateDays,
  determineAttendanceStatus,
  formatBusinessDateKey,
  formatJakartaBusinessDate,
  formatJakartaTime,
  getBusinessDateKey,
  getJakartaBusinessDate,
  getJakartaBusinessDateKey,
  getJakartaDateParts,
  isBusinessDateWorkday,
  isJakartaWorkday,
} from "@/lib/attendance-time";

describe("attendance-time", () => {
  describe("Jakarta timezone conversion & business date boundaries", () => {
    it("converts 2026-08-09T16:59:59Z to 2026-08-09 23:59:59 in Jakarta (Sunday)", () => {
      const instant = new Date("2026-08-09T16:59:59Z");
      const parts = getJakartaDateParts(instant);

      expect(parts).toEqual({
        year: 2026,
        month: 8,
        day: 9,
        weekday: "Sun",
        hour: 23,
        minute: 59,
        second: 59,
      });

      expect(getJakartaBusinessDateKey(instant)).toBe("2026-08-09");
      expect(isJakartaWorkday(instant)).toBe(false);

      const businessDate = getJakartaBusinessDate(instant);
      expect(businessDate.toISOString()).toBe("2026-08-09T00:00:00.000Z");
      expect(getBusinessDateKey(businessDate)).toBe("2026-08-09");
    });

    it("converts 2026-08-09T17:00:00Z to 2026-08-10 00:00:00 in Jakarta (Monday)", () => {
      const instant = new Date("2026-08-09T17:00:00Z");
      const parts = getJakartaDateParts(instant);

      expect(parts).toEqual({
        year: 2026,
        month: 8,
        day: 10,
        weekday: "Mon",
        hour: 0,
        minute: 0,
        second: 0,
      });

      expect(getJakartaBusinessDateKey(instant)).toBe("2026-08-10");
      expect(isJakartaWorkday(instant)).toBe(true);

      const businessDate = getJakartaBusinessDate(instant);
      expect(businessDate.toISOString()).toBe("2026-08-10T00:00:00.000Z");
      expect(getBusinessDateKey(businessDate)).toBe("2026-08-10");
    });
  });

  describe("determineAttendanceStatus (Present vs Late threshold 08:00:00)", () => {
    it("returns Present for check-in before 08:00:00 (e.g. 07:59:59)", () => {
      const instant = new Date("2026-08-10T00:59:59Z"); // 07:59:59 WIB
      expect(determineAttendanceStatus(instant)).toBe("Present");
    });

    it("returns Present for check-in at exactly 08:00:00", () => {
      const instant = new Date("2026-08-10T01:00:00Z"); // 08:00:00 WIB
      expect(determineAttendanceStatus(instant)).toBe("Present");
    });

    it("returns Late for check-in after 08:00:00 (e.g. 08:00:01)", () => {
      const instant = new Date("2026-08-10T01:00:01Z"); // 08:00:01 WIB
      expect(determineAttendanceStatus(instant)).toBe("Late");
    });
  });

  describe("workday policy", () => {
    it("identifies Monday through Friday as workdays", () => {
      // 2026-08-10 (Mon) to 2026-08-14 (Fri)
      for (let day = 10; day <= 14; day++) {
        const date = new Date(Date.UTC(2026, 7, day));
        expect(isBusinessDateWorkday(date)).toBe(true);
      }
    });

    it("identifies Saturday and Sunday as non-workdays", () => {
      const sat = new Date(Date.UTC(2026, 7, 8)); // Sat
      const sun = new Date(Date.UTC(2026, 7, 9)); // Sun
      expect(isBusinessDateWorkday(sat)).toBe(false);
      expect(isBusinessDateWorkday(sun)).toBe(false);
    });
  });

  describe("formatting & date math helpers", () => {
    it("formats business date keys", () => {
      expect(formatBusinessDateKey(2026, 8, 9)).toBe("2026-08-09");
    });

    it("adds business date days cleanly", () => {
      const start = new Date(Date.UTC(2026, 7, 10));
      const next = addBusinessDateDays(start, 5);
      expect(getBusinessDateKey(next)).toBe("2026-08-15");
    });

    it("formats Jakarta display time and dates", () => {
      const date = new Date(Date.UTC(2026, 7, 10));
      expect(formatJakartaBusinessDate(date)).toContain("August 10, 2026");

      const instant = new Date("2026-08-10T01:15:30Z");
      expect(formatJakartaTime(instant)).toBe("08:15:30");
      expect(formatJakartaTime(null)).toBe("-");
    });
  });
});
