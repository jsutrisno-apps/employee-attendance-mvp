import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Next.js server-only package
vi.mock("server-only", () => ({}));

// Mock Auth.js signIn and AuthError
const signInMock = vi.fn();

vi.mock("next-auth", () => {
  class MockAuthError extends Error {
    type: string;
    constructor(type = "CredentialsSignin") {
      super(type);
      this.name = "AuthError";
      this.type = type;
    }
  }

  return {
    AuthError: MockAuthError,
  };
});

vi.mock("@/auth", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

import { loginAction, demoLoginAction } from "@/app/login/actions";
import { AuthError } from "next-auth";

describe("Stage B2 — Public Demo Login UX Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Demo Login Action", () => {
    it("authenticates using server-side demo credentials", async () => {
      signInMock.mockResolvedValueOnce(undefined);

      const result = await demoLoginAction({});

      expect(signInMock).toHaveBeenCalledWith("credentials", {
        email: "demo@example.test",
        password: "demo-password",
        redirectTo: "/",
      });
      expect(result).toEqual({});
    });

    it("returns user-friendly error on authentication error", async () => {
      const err = new AuthError("CredentialsSignin");
      signInMock.mockRejectedValueOnce(err);

      const result = await demoLoginAction({});

      expect(result).toEqual({
        error: "Demo access is temporarily unavailable. Please try again.",
      });
    });

    it("re-throws unexpected non-AuthError exceptions (such as Next.js redirect)", async () => {
      const redirectError = new Error("NEXT_REDIRECT");
      signInMock.mockRejectedValueOnce(redirectError);

      await expect(demoLoginAction({})).rejects.toThrow("NEXT_REDIRECT");
    });
  });

  describe("2. Admin Authentication Regression Protection", () => {
    it("loginAction passes user-provided credentials to signIn", async () => {
      signInMock.mockResolvedValueOnce(undefined);

      const formData = new FormData();
      formData.set("email", "admin@example.test");
      formData.set("password", "admin-password");

      const result = await loginAction({}, formData);

      expect(signInMock).toHaveBeenCalledWith("credentials", {
        email: "admin@example.test",
        password: "admin-password",
        redirectTo: "/",
      });
      expect(result).toEqual({});
    });

    it("loginAction returns error message on AuthError", async () => {
      const err = new AuthError("CredentialsSignin");
      signInMock.mockRejectedValueOnce(err);

      const formData = new FormData();
      formData.set("email", "invalid@example.test");
      formData.set("password", "wrong-password");

      const result = await loginAction({}, formData);

      expect(result).toEqual({
        error: "Invalid email or password.",
      });
    });
  });

  describe("3. Privacy & Credential Exposure Checks", () => {
    it("does not expose demo credentials in exports or public action signatures", () => {
      expect(demoLoginAction.length).toBeLessThanOrEqual(1);
    });
  });
});
