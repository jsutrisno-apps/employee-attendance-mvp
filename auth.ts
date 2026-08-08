import NextAuth from "next-auth";
import type { Session } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

type AuthorizedUser = {
  id: string;
  email: string;
  role: "Admin" | "Employee";
  employeeId: string | null;
};

type SessionUser = {
  userId: string;
  role: "Admin" | "Employee" | null;
  employeeId: string | null;
};

function readTrimmedCredential(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function readPassword(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readRole(value: unknown) {
  return value === "Admin" || value === "Employee" ? value : null;
}

function readEmployeeId(value: unknown) {
  return typeof value === "string" ? value : null;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials): Promise<AuthorizedUser | null> {
        const email = readTrimmedCredential(credentials?.email).toLowerCase();
        const password = readPassword(credentials?.password);

        if (!email || !password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            role: true,
            employeeId: true,
            employee: {
              select: {
                id: true,
                isActive: true,
              },
            },
          },
        });

        if (!user) {
          return null;
        }

        if (!user.passwordHash) {
          return null;
        }

        const isValidPassword = await verifyPassword(
          password,
          user.passwordHash,
        );

        if (!isValidPassword) {
          return null;
        }

        if (user.role === "Employee") {
          if (!user.employeeId || !user.employee?.isActive) {
            return null;
          }
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          employeeId: user.employeeId,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.userId = user.id ?? "";
        token.role = user.role;
        token.employeeId = user.employeeId;
      }

      return token;
    },
    session({ session, token }) {
      const sessionUser: SessionUser = {
        userId: readTrimmedCredential(token.userId),
        role: readRole(token.role),
        employeeId: readEmployeeId(token.employeeId),
      };

      return {
        ...session,
        user: sessionUser,
      } as Session;
    },
  },
});
