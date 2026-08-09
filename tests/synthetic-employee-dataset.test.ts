import { describe, expect, it } from "vitest";
import { canonicalEmployees } from "../prisma/seed";

describe("Stage A2 — Synthetic Employee Dataset Quality Assertions", () => {
  it("contains exactly 20 canonical employee records", () => {
    expect(canonicalEmployees).toHaveLength(20);
  });

  it("has exact canonical employee numbers CX-0001 through CX-0020 without gaps or duplicates", () => {
    const numbers = canonicalEmployees.map((e) => e.employeeNumber);
    expect(new Set(numbers).size).toBe(20);

    const expectedNumbers = Array.from({ length: 20 }, (_, i) => `CX-${String(i + 1).padStart(4, "0")}`);
    expect(numbers).toEqual(expectedNumbers);
  });

  it("has unique emails ending with @example.test matching firstname.lastname format", () => {
    const emails = canonicalEmployees.map((e) => e.email);
    expect(new Set(emails).size).toBe(20);

    for (const emp of canonicalEmployees) {
      expect(emp.email).toMatch(/^[a-z]+\.[a-z]+@example\.test$/);
      
      const nameParts = emp.name.toLowerCase().split(" ");
      const emailFirst = emp.email.split(".")[0];
      const emailLast = emp.email.split(".")[1].split("@")[0];

      expect(emailFirst).toBe(nameParts[0]);
      expect(emailLast).toBe(nameParts[1]);
    }
  });

  it("ensures all names are unique, non-empty, and contain no test or reserved words", () => {
    const names = canonicalEmployees.map((e) => e.name);
    expect(new Set(names).size).toBe(20);

    const forbiddenWords = ["test", "demo", "sample", "mvp", "validation", "stage", "user", "employee", "one", "six"];

    for (const emp of canonicalEmployees) {
      expect(emp.name.trim().length).toBeGreaterThan(0);
      const nameLower = emp.name.toLowerCase();
      for (const forbidden of forbiddenWords) {
        expect(nameLower).not.toContain(forbidden);
      }
    }
  });

  it("does not contain known public figures or legacy employee identities", () => {
    const prohibitedNames = ["Joko Sutrisno", "Dewi Lestari", "Eko Patria"];
    const names = canonicalEmployees.map((e) => e.name);

    for (const prohibited of prohibitedNames) {
      expect(names).not.toContain(prohibited);
    }
  });
});
