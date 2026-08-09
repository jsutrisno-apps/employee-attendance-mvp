import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      userId: string;
      role: "Admin" | "Employee" | "Demo" | null;
      employeeId: string | null;
    };
  }

  interface User {
    role: "Admin" | "Employee" | "Demo";
    employeeId: string | null;
  }
}

export {};

declare module "next-auth/jwt" {
  interface JWT {
    userId: string;
    role: "Admin" | "Employee" | "Demo" | null;
    employeeId: string | null;
  }
}
