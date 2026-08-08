import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const adminPassword = "admin-password";
const employeePassword = "employee-password";

async function main() {
  const [adminPasswordHash, employeePasswordHash] = await Promise.all([
    hash(adminPassword, 12),
    hash(employeePassword, 12),
  ]);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.test" },
    update: {
      passwordHash: adminPasswordHash,
      role: "Admin",
      employeeId: null,
    },
    create: {
      email: "admin@example.test",
      passwordHash: adminPasswordHash,
      role: "Admin",
    },
  });

  const employee = await prisma.employee.upsert({
    where: { employeeNumber: "EMP-001" },
    update: {
      name: "MVP Employee",
      email: "employee@example.test",
      isActive: true,
    },
    create: {
      employeeNumber: "EMP-001",
      name: "MVP Employee",
      email: "employee@example.test",
      isActive: true,
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: "employee.login@example.test" },
    update: {
      passwordHash: employeePasswordHash,
      role: "Employee",
      employeeId: employee.id,
    },
    create: {
      email: "employee.login@example.test",
      passwordHash: employeePasswordHash,
      role: "Employee",
      employeeId: employee.id,
    },
  });

  const attendanceDate = new Date("2026-01-15T00:00:00.000Z");

  const attendanceRecord = await prisma.attendanceRecord.upsert({
    where: {
      employeeId_attendanceDate: {
        employeeId: employee.id,
        attendanceDate,
      },
    },
    update: {
      checkInAt: new Date("2026-01-15T01:00:00.000Z"),
      checkOutAt: new Date("2026-01-15T09:00:00.000Z"),
      status: "Present",
      notes: "Deterministic development seed record.",
    },
    create: {
      employeeId: employee.id,
      attendanceDate,
      checkInAt: new Date("2026-01-15T01:00:00.000Z"),
      checkOutAt: new Date("2026-01-15T09:00:00.000Z"),
      status: "Present",
      notes: "Deterministic development seed record.",
    },
  });

  const readBack = await prisma.employee.findUniqueOrThrow({
    where: { id: employee.id },
    include: {
      user: true,
      attendanceRecords: true,
    },
  });

  console.log(
    JSON.stringify(
      {
        adminUser: {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role,
        },
        employeeUser: {
          id: employeeUser.id,
          email: employeeUser.email,
          role: employeeUser.role,
          employeeId: employeeUser.employeeId,
        },
        employee: {
          id: readBack.id,
          employeeNumber: readBack.employeeNumber,
          email: readBack.email,
          isActive: readBack.isActive,
          attendanceRecordCount: readBack.attendanceRecords.length,
        },
        attendanceRecord: {
          id: attendanceRecord.id,
          attendanceDate: attendanceRecord.attendanceDate.toISOString().slice(0, 10),
          status: attendanceRecord.status,
        },
      },
      null,
      2,
    ),
  );
}

main()
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
