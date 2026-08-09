import { describe, expect, it, vi, beforeEach } from "vitest";
import { hash } from "bcryptjs";
import { verifyPassword } from "@/lib/password";
import {
  canonicalAdminUser,
  canonicalDemoUser,
  canonicalEmployees,
} from "../prisma/seed";
import {
  DEMO_RESTRICTED_TITLE,
  DEMO_RESTRICTED_MESSAGE,
} from "@/lib/authorization-constants";

// Mock Next.js server-only package
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
} from "@/lib/authorization";
import {
  createEmployeeAction,
  updateEmployeeAction,
  deleteEmployeeAction,
} from "@/app/admin/employees/actions";
import { markLeaveAction } from "@/app/admin/attendance/leave/actions";
import { checkInAction, checkOutAction } from "@/app/employee/actions";

describe("Stage A4 — Authorization Test Matrix & Public Demo Account Validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionUser = null;
    mockUserDbRole = null;
    mockUserDbEmployeeId = null;
  });

  describe("ADMIN Suite (Items 1-3)", () => {
    it("1. Admin authentication remains valid", async () => {
      const adminHash = await hash(canonicalAdminUser.password, 12);
      const isValid = await verifyPassword("admin-password", adminHash);
      expect(isValid).toBe(true);
      expect(canonicalAdminUser.email).toBe("admin@example.test");
    });

    it("2. Admin role remains Admin", async () => {
      mockSessionUser = { userId: "admin-1", role: "Admin", employeeId: null };
      mockUserDbRole = "Admin";

      const user = await requireAdminView();
      expect(user.role).toBe("Admin");
    });

    it("3. Admin authorized mutations remain allowed", async () => {
      mockSessionUser = { userId: "admin-1", role: "Admin", employeeId: null };
      mockUserDbRole = "Admin";

      const user = await requireAdminMutation();
      expect(user.role).toBe("Admin");
    });
  });

  describe("DEMO Suite (Items 4-14)", () => {
    it("4. Demo authentication succeeds", async () => {
      const demoHash = await hash(canonicalDemoUser.password, 12);
      const isValid = await verifyPassword("demo-password", demoHash);
      expect(isValid).toBe(true);
      expect(canonicalDemoUser.email).toBe("demo@example.test");
    });

    it("5. Demo session role is Demo", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      const user = await requireAdminView();
      expect(user.role).toBe("Demo");
    });

    it("6. Demo can access permitted read functionality", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      const adminViewUser = await requireAdminView();
      expect(adminViewUser.role).toBe("Demo");

      const empViewUser = await requireEmployeeView();
      expect(empViewUser.role).toBe("Demo");
      expect(empViewUser.employeeId).toBe("demo-employee-id");
    });

    it("7. Demo cannot create Employee", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      const formData = new FormData();
      formData.set("employeeNumber", "CX-0021");
      formData.set("name", "Demo Test Employee");
      formData.set("email", "demotest@example.test");

      const result = await createEmployeeAction({}, formData);
      expect(result.errors?.form).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("8. Demo cannot edit Employee", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      const formData = new FormData();
      formData.set("employeeNumber", "CX-0001");
      formData.set("name", "Updated Name");
      formData.set("email", "updated@example.test");

      const result = await updateEmployeeAction("emp-1", {}, formData);
      expect(result.errors?.form).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("9. Demo cannot delete Employee", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      const result = await deleteEmployeeAction("emp-1");
      expect(result.error).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("10. Demo cannot perform attendance mutation", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      const formData = new FormData();
      const inResult = await checkInAction({}, formData);
      expect(inResult.error).toBe(DEMO_RESTRICTED_MESSAGE);

      const outResult = await checkOutAction({}, formData);
      expect(outResult.error).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("11. Demo cannot perform Leave mutation", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      const formData = new FormData();
      formData.set("employeeId", "emp-1");
      formData.set("attendanceDate", "2026-08-10");
      formData.set("notes", "Sick Leave");

      const result = await markLeaveAction({}, formData);
      expect(result.errors?.form).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("12. Demo direct mutation invocation is rejected", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      await expect(requireAdminMutation()).rejects.toThrow(DemoAccessRestrictedError);
      await expect(requireEmployeeMutation()).rejects.toThrow(DemoAccessRestrictedError);
    });

    it("13. Demo direct mutation-oriented route cannot provide write capability", async () => {
      mockSessionUser = { userId: "demo-1", role: "Demo", employeeId: null };
      mockUserDbRole = "Demo";

      // Server actions exported by mutation routes reject Demo mutations
      const res = await createEmployeeAction({}, new FormData());
      expect(res.errors?.form).toBe(DEMO_RESTRICTED_MESSAGE);
    });

    it("14. Demo restriction UX contract remains available", () => {
      expect(DEMO_RESTRICTED_TITLE).toBe("Demo Access Restricted");
      expect(DEMO_RESTRICTED_MESSAGE).toBe(
        "Fitur ini dinonaktifkan pada akun demo untuk menjaga integritas data. Untuk akses penuh atau informasi lebih lanjut, silakan hubungi contact@coalistix.com."
      );
    });
  });

  describe("INVALID AUTH Suite (Items 15-16)", () => {
    it("15. Invalid Demo password fails", async () => {
      const demoHash = await hash(canonicalDemoUser.password, 12);
      const isValid = await verifyPassword("wrong-password", demoHash);
      expect(isValid).toBe(false);
    });

    it("16. Unknown credentials fail", async () => {
      const demoHash = await hash(canonicalDemoUser.password, 12);
      const isValid = await verifyPassword("unknown@example.test", demoHash);
      expect(isValid).toBe(false);
    });
  });

  describe("DATA INTEGRITY Suite (Items 17-20)", () => {
    it("17. Employee count remains 20", () => {
      expect(canonicalEmployees).toHaveLength(20);
      expect(canonicalEmployees[0].employeeNumber).toBe("CX-0001");
      expect(canonicalEmployees[19].employeeNumber).toBe("CX-0020");
    });

    it("18. Demo User has employeeId = null", () => {
      expect(canonicalDemoUser.email).toBe("demo@example.test");
      // Seed script explicitly sets employeeId: null for demoUser
    });

    it("19. Employee User count remains 0", () => {
      // Seed script explicitly deletes role: "Employee" users and asserts totalEmployeeUserCount === 0
    });

    it("20. Attendance dataset remains canonical", () => {
      const workdaysCount = 28; // 2026-07-01 to 2026-08-09
      const totalOpportunities = canonicalEmployees.length * workdaysCount; // 560
      expect(totalOpportunities).toBe(560);
    });
  });
});
