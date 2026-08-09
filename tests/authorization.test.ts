import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Next.js server-only package for vitest environment
vi.mock("server-only", () => ({}));

// Mock next/navigation redirect
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

// Mock next/cache revalidatePath
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Auth.js session
let mockSessionUser: { userId: string; role: "Admin" | "Employee" | "Demo" | null; employeeId: string | null } | null = null;

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: mockSessionUser })),
  signOut: vi.fn(),
}));

// Mock Prisma DB
let mockUserDbRole: "Admin" | "Employee" | "Demo" | null = "Admin";
let mockUserDbEmployeeId: string | null = null;

vi.mock("@/lib/db", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(async () => {
        if (!mockUserDbRole) return null;
        return {
          id: mockSessionUser?.userId ?? "user-1",
          role: mockUserDbRole,
          employeeId: mockUserDbEmployeeId,
        };
      }),
    },
    employee: {
      findUnique: vi.fn(async () => ({ id: "emp-1", isActive: true })),
      create: vi.fn(async () => ({ id: "emp-new" })),
      update: vi.fn(async () => ({ id: "emp-1" })),
      delete: vi.fn(async () => ({ id: "emp-1" })),
    },
    attendanceRecord: {
      findUnique: vi.fn(async () => null),
      create: vi.fn(async () => ({ id: "att-1" })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
  },
}));

import {
  requireAdminView,
  requireAdminMutation,
  requireEmployeeView,
  requireEmployeeMutation,
  DemoAccessRestrictedError,
  DEMO_RESTRICTED_MESSAGE,
} from "@/lib/authorization";
import {
  createEmployeeAction,
  updateEmployeeAction,
  deleteEmployeeAction,
} from "@/app/admin/employees/actions";
import { markLeaveAction } from "@/app/admin/attendance/leave/actions";
import { checkInAction, checkOutAction } from "@/app/employee/actions";

describe("Stage A1 Authorization Contract & Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser = null;
    mockUserDbRole = null;
    mockUserDbEmployeeId = null;
  });

  describe("1. ADMIN Access Controls", () => {
    it("ADMIN can access admin read view (requireAdminView)", async () => {
      mockSessionUser = { userId: "admin-1", role: "Admin", employeeId: null };
      mockUserDbRole = "Admin";

      const user = await requireAdminView();
      expect(user.role).toBe("Admin");
    });

    it("ADMIN can pass mutation authorization check (requireAdminMutation)", async () => {
      mockSessionUser = { userId: "admin-1", role: "Admin", employeeId: null };
      mockUserDbRole = "Admin";

      const user = await requireAdminMutation();
      expect(user.role).toBe("Admin");
    });
  });

  describe("2. DEMO Read Access Capabilities", () => {
    it("DEMO can access permitted read views (requireAdminView)", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      const user = await requireAdminView();
      expect(user.role).toBe("Demo");
    });

    it("DEMO can access employee view (requireEmployeeView)", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      const user = await requireEmployeeView();
      expect(user.role).toBe("Demo");
      expect(user.employeeId).toBeDefined();
    });
  });

  describe("3. DEMO Server-Side Mutation Restrictions", () => {
    beforeEach(() => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";
    });

    it("DEMO throws DemoAccessRestrictedError on requireAdminMutation", async () => {
      await expect(requireAdminMutation()).rejects.toThrow(DemoAccessRestrictedError);
    });

    it("DEMO throws DemoAccessRestrictedError on requireEmployeeMutation", async () => {
      await expect(requireEmployeeMutation()).rejects.toThrow(DemoAccessRestrictedError);
    });

    it("DEMO cannot create employees (createEmployeeAction rejected server-side)", async () => {
      const formData = new FormData();
      formData.set("employeeNumber", "EMP999");
      formData.set("name", "Test Demo Create");
      formData.set("email", "democreate@test.com");

      const result = await createEmployeeAction({}, formData);
      expect(result.errors?.form).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("DEMO cannot edit employees (updateEmployeeAction rejected server-side)", async () => {
      const formData = new FormData();
      formData.set("employeeNumber", "EMP001");
      formData.set("name", "Updated Name");
      formData.set("email", "updated@test.com");

      const result = await updateEmployeeAction("emp-1", {}, formData);
      expect(result.errors?.form).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("DEMO cannot delete employees (deleteEmployeeAction rejected server-side)", async () => {
      const result = await deleteEmployeeAction("emp-1");
      expect(result.error).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("DEMO cannot perform leave mutations (markLeaveAction rejected server-side)", async () => {
      const formData = new FormData();
      formData.set("employeeId", "emp-1");
      formData.set("attendanceDate", "2026-08-10");
      formData.set("notes", "Personal Leave");

      const result = await markLeaveAction({}, formData);
      expect(result.errors?.form).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("DEMO cannot perform attendance check-in (checkInAction rejected server-side)", async () => {
      const formData = new FormData();
      const result = await checkInAction({}, formData);
      expect(result.error).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("DEMO cannot perform attendance check-out (checkOutAction rejected server-side)", async () => {
      const formData = new FormData();
      const result = await checkOutAction({}, formData);
      expect(result.error).toBe(DEMO_RESTRICTED_MESSAGE);
    });
  });

  describe("4. Direct URL / Unauthorized Access Protection", () => {
    it("Unauthenticated user is redirected to /login", async () => {
      mockSessionUser = null;
      mockUserDbRole = null;

      await expect(requireAdminView()).rejects.toThrow("REDIRECT:/login");
    });

    it("Employee role attempting admin view is redirected to /employee", async () => {
      mockSessionUser = { userId: "emp-user-1", role: "Employee", employeeId: "emp-1" };
      mockUserDbRole = "Employee";

      await expect(requireAdminView()).rejects.toThrow("REDIRECT:/employee");
    });

    it("Employee role attempting admin mutation is redirected to /employee", async () => {
      mockSessionUser = { userId: "emp-user-1", role: "Employee", employeeId: "emp-1" };
      mockUserDbRole = "Employee";

      await expect(requireAdminMutation()).rejects.toThrow("REDIRECT:/employee");
    });
  });
});
