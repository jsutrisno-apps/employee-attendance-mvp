"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@/prisma/generated/client";
import { requireAdmin } from "@/lib/authorization";
import { prisma } from "@/lib/db";

export type EmployeeFormState = {
  errors?: {
    employeeNumber?: string;
    name?: string;
    email?: string;
    form?: string;
  };
};

type EmployeeInput = {
  employeeNumber: string;
  name: string;
  email: string;
  isActive: boolean;
};

function readField(formData: FormData, fieldName: string) {
  const value = formData.get(fieldName);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateEmployeeInput(
  formData: FormData,
  includeActive: boolean,
): { data: EmployeeInput; errors: NonNullable<EmployeeFormState["errors"]> } {
  const employeeNumber = readField(formData, "employeeNumber");
  const name = readField(formData, "name");
  const email = readField(formData, "email").toLowerCase();
  const errors: NonNullable<EmployeeFormState["errors"]> = {};

  if (!employeeNumber) {
    errors.employeeNumber = "Employee number is required.";
  }

  if (!name) {
    errors.name = "Name is required.";
  }

  if (!email) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  return {
    data: {
      employeeNumber,
      name,
      email,
      isActive: includeActive ? formData.get("isActive") === "on" : true,
    },
    errors,
  };
}

function duplicateMessage(error: unknown) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
    const adapterFields =
      error.meta?.driverAdapterError &&
      typeof error.meta.driverAdapterError === "object" &&
      "cause" in error.meta.driverAdapterError &&
      error.meta.driverAdapterError.cause &&
      typeof error.meta.driverAdapterError.cause === "object" &&
      "constraint" in error.meta.driverAdapterError.cause &&
      error.meta.driverAdapterError.cause.constraint &&
      typeof error.meta.driverAdapterError.cause.constraint === "object" &&
      "fields" in error.meta.driverAdapterError.cause.constraint &&
      Array.isArray(error.meta.driverAdapterError.cause.constraint.fields)
        ? error.meta.driverAdapterError.cause.constraint.fields
        : [];
    const fields = [...target, ...adapterFields].map((field) =>
      typeof field === "string" ? field.replaceAll('"', "") : "",
    );

    if (fields.includes("employeeNumber")) {
      return { employeeNumber: "Employee number already exists." };
    }

    if (fields.includes("email")) {
      return { email: "Employee email already exists." };
    }

    return { form: "Employee already exists." };
  }

  return null;
}

export async function createEmployeeAction(
  _previousState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await requireAdmin();

  const { data, errors } = validateEmployeeInput(formData, false);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await prisma.employee.create({
      data,
    });
  } catch (error) {
    const duplicateErrors = duplicateMessage(error);

    if (duplicateErrors) {
      return { errors: duplicateErrors };
    }

    throw error;
  }

  revalidatePath("/admin/employees");
  redirect("/admin/employees");
}

export async function updateEmployeeAction(
  id: string,
  _previousState: EmployeeFormState,
  formData: FormData,
): Promise<EmployeeFormState> {
  await requireAdmin();

  const { data, errors } = validateEmployeeInput(formData, true);

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  try {
    await prisma.employee.update({
      where: { id },
      data,
    });
  } catch (error) {
    const duplicateErrors = duplicateMessage(error);

    if (duplicateErrors) {
      return { errors: duplicateErrors };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { errors: { form: "Employee was not found." } };
    }

    throw error;
  }

  revalidatePath("/admin/employees");
  revalidatePath(`/admin/employees/${id}/edit`);
  redirect("/admin/employees");
}
