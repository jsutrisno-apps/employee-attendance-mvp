import "server-only";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export type AuthenticatedUser = {
  userId: string;
  role: "Admin" | "Employee";
  employeeId: string | null;
};

function redirectForRole(role: AuthenticatedUser["role"]) {
  redirect(role === "Admin" ? "/admin" : "/employee");
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

export async function requireAdmin() {
  const user = await requireUser();

  if (user.role !== "Admin") {
    redirectForRole(user.role);
  }

  return user;
}

export async function requireEmployee() {
  const user = await requireUser();

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
