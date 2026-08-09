"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = {
  error?: string;
};

const DEMO_EMAIL = process.env.DEMO_USER_EMAIL || "demo@example.test";
const DEMO_PASSWORD = process.env.DEMO_USER_PASSWORD || "demo-password";

export async function loginAction(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  void _previousState;
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Invalid email or password.",
      };
    }

    throw error;
  }

  return {};
}

export async function demoLoginAction(
  _previousState: LoginState,
): Promise<LoginState> {
  void _previousState;
  try {
    await signIn("credentials", {
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        error: "Demo access is temporarily unavailable. Please try again.",
      };
    }

    throw error;
  }

  return {};
}
