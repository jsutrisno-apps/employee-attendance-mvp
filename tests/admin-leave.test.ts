import { describe, expect, it, vi } from "vitest";
import { markEmployeeLeave, parseBusinessDateInput } from "@/lib/admin-leave";

describe("admin-leave", () => {
  describe("parseBusinessDateInput", () => {
    it("parses valid YYYY-MM-DD strings to UTC business dates", () => {
      const date = parseBusinessDateInput("2026-08-10");
      expect(date).not.toBeNull();
      expect(date?.toISOString()).toBe("2026-08-10T00:00:00.000Z");
    });

    it("rejects malformed or impossible dates", () => {
      expect(parseBusinessDateInput("invalid-date")).toBeNull();
      expect(parseBusinessDateInput("2026-02-31")).toBeNull();
      expect(parseBusinessDateInput("2026-13-01")).toBeNull();
      expect(parseBusinessDateInput("")).toBeNull();
    });
  });

  describe("markEmployeeLeave business validation", () => {
    function mockDb({
      employeeExists = true,
      existingRecord = null as {
        checkInAt: Date | null;
        checkOutAt: Date | null;
        status: string;
      } | null,
    }) {
      const createMock = vi.fn().mockResolvedValue({});
      return {
        database: {
          employee: {
            findUnique: vi
              .fn()
              .mockResolvedValue(employeeExists ? { id: "emp-1" } : null),
          },
          attendanceRecord: {
            findUnique: vi.fn().mockResolvedValue(existingRecord),
            create: createMock,
          },
        },
        createMock,
      };
    }

    it("rejects missing employee ID", async () => {
      const { database } = mockDb({});
      const result = await markEmployeeLeave({
        database,
        employeeId: "  ",
        attendanceDateKey: "2026-08-10",
        notes: "",
      });

      expect(result).toEqual({
        ok: false,
        field: "employeeId",
        message: "Employee is required.",
      });
    });

    it("rejects invalid business date key", async () => {
      const { database } = mockDb({});
      const result = await markEmployeeLeave({
        database,
        employeeId: "emp-1",
        attendanceDateKey: "2026-02-31",
        notes: "",
      });

      expect(result).toEqual({
        ok: false,
        field: "attendanceDate",
        message: "Enter a valid date.",
      });
    });

    it("rejects weekend leave marking", async () => {
      const { database } = mockDb({});
      const result = await markEmployeeLeave({
        database,
        employeeId: "emp-1",
        attendanceDateKey: "2026-08-09", // Sunday
        notes: "",
      });

      expect(result).toEqual({
        ok: false,
        field: "attendanceDate",
        message: "Leave can only be marked for Monday-Friday.",
      });
    });

    it("rejects notes longer than 250 characters", async () => {
      const { database } = mockDb({});
      const result = await markEmployeeLeave({
        database,
        employeeId: "emp-1",
        attendanceDateKey: "2026-08-10",
        notes: "a".repeat(251),
      });

      expect(result).toEqual({
        ok: false,
        field: "notes",
        message: "Notes must be 250 characters or fewer.",
      });
    });

    it("rejects when employee is not found", async () => {
      const { database } = mockDb({ employeeExists: false });
      const result = await markEmployeeLeave({
        database,
        employeeId: "unknown-emp",
        attendanceDateKey: "2026-08-10",
        notes: "",
      });

      expect(result).toEqual({
        ok: false,
        field: "employeeId",
        message: "Employee was not found.",
      });
    });

    it("rejects collision with existing Leave record", async () => {
      const { database } = mockDb({
        existingRecord: { checkInAt: null, checkOutAt: null, status: "Leave" },
      });
      const result = await markEmployeeLeave({
        database,
        employeeId: "emp-1",
        attendanceDateKey: "2026-08-10",
        notes: "",
      });

      expect(result).toEqual({
        ok: false,
        field: "form",
        message: "Leave is already recorded for this employee and date.",
      });
    });

    it("rejects collision with existing Present/Late record", async () => {
      const { database } = mockDb({
        existingRecord: {
          checkInAt: new Date(),
          checkOutAt: null,
          status: "Present",
        },
      });
      const result = await markEmployeeLeave({
        database,
        employeeId: "emp-1",
        attendanceDateKey: "2026-08-10",
        notes: "",
      });

      expect(result).toEqual({
        ok: false,
        field: "form",
        message: "Attendance already exists for this employee and date.",
      });
    });

    it("creates Leave record successfully when no collision exists", async () => {
      const { database, createMock } = mockDb({ existingRecord: null });
      const result = await markEmployeeLeave({
        database,
        employeeId: "emp-1",
        attendanceDateKey: "2026-08-10",
        notes: " Approved vacation ",
      });

      expect(result).toEqual({
        ok: true,
        attendanceDateKey: "2026-08-10",
      });

      expect(createMock).toHaveBeenCalledWith({
        data: {
          employeeId: "emp-1",
          attendanceDate: new Date(Date.UTC(2026, 7, 10)),
          checkInAt: null,
          checkOutAt: null,
          status: "Leave",
          notes: "Approved vacation",
        },
      });
    });
  });
});
