import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import {
  DEMO_RESTRICTED_TITLE,
  DEMO_RESTRICTED_MESSAGE,
} from "@/lib/authorization-constants";

export { DEMO_RESTRICTED_TITLE, DEMO_RESTRICTED_MESSAGE };

export type UserRole = "Admin" | "Employee" | "Demo";

export type AuthenticatedUser = {
  userId: string;
  role: UserRole;
  employeeId: string | null;
};

export class DemoAccessRestrictedError extends Error {
  constructor(message = DEMO_RESTRICTED_MESSAGE) {
    super(message);
    this.name = "DemoAccessRestrictedError";
  }
}

function redirectForRole(role: AuthenticatedUser["role"]) {
  redirect(role === "Admin" || role === "Demo" ? "/admin" : "/employee");
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const session = await auth();
  const sessionUser = session?.user;

  if (!sessionUser?.userId || !sessionUser.role) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.userId },
    select: {
      id: true,
      role: true,
      employeeId: true,
    },
  });

  if (!user) {
    redirect("/login");
  }

  return {
    userId: user.id,
    role: user.role,
    employeeId: user.employeeId,
  };
}

export async function requireAdminView(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (user.role !== "Admin" && user.role !== "Demo") {
    redirectForRole(user.role);
  }

  return user;
}

export async function requireAdminMutation(): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (user.role === "Demo") {
    throw new DemoAccessRestrictedError();
  }

  if (user.role !== "Admin") {
    redirectForRole(user.role);
  }

  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  return requireAdminMutation();
}

export async function requireEmployeeView(): Promise<AuthenticatedUser & { employeeId: string }> {
  const user = await requireUser();

  if (user.role === "Demo") {
    return {
      ...user,
      employeeId: user.employeeId ?? "demo-employee-id",
    };
  }

  if (user.role !== "Employee") {
    redirectForRole(user.role);
  }

  if (!user.employeeId) {
    redirect("/login");
  }

  const employee = await prisma.employee.findUnique({
    where: { id: user.employeeId },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!employee?.isActive) {
    redirect("/login");
  }

  return {
    ...user,
    employeeId: employee.id,
  };
}

export async function requireEmployeeMutation(): Promise<AuthenticatedUser & { employeeId: string }> {
  const user = await requireUser();

  if (user.role === "Demo") {
    throw new DemoAccessRestrictedError();
  }

  return requireEmployeeView();
}

export async function requireEmployee(): Promise<AuthenticatedUser & { employeeId: string }> {
  return requireEmployeeMutation();
}
