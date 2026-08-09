import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, AttendanceStatus } from "./generated/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const adminPassword = "admin-password";
const demoPassword = "demo-password";

export const canonicalAdminUser = {
  email: "admin@example.test",
  password: "admin-password",
};

export const canonicalDemoUser = {
  email: "demo@example.test",
  password: "demo-password",
};

export const canonicalEmployees = [
  { employeeNumber: "CX-0001", name: "Andi Pratama", email: "andi.pratama@example.test" },
  { employeeNumber: "CX-0002", name: "Maya Kurnia", email: "maya.kurnia@example.test" },
  { employeeNumber: "CX-0003", name: "Rizky Firmansyah", email: "rizky.firmansyah@example.test" },
  { employeeNumber: "CX-0004", name: "Nita Anggraini", email: "nita.anggraini@example.test" },
  { employeeNumber: "CX-0005", name: "Denny Kusuma", email: "denny.kusuma@example.test" },
  { employeeNumber: "CX-0006", name: "Citra Handayani", email: "citra.handayani@example.test" },
  { employeeNumber: "CX-0007", name: "Hadi Saputra", email: "hadi.saputra@example.test" },
  { employeeNumber: "CX-0008", name: "Sari Wulandari", email: "sari.wulandari@example.test" },
  { employeeNumber: "CX-0009", name: "Agung Wicaksono", email: "agung.wicaksono@example.test" },
  { employeeNumber: "CX-0010", name: "Fitri Rahmadani", email: "fitri.rahmadani@example.test" },
  { employeeNumber: "CX-0011", name: "Bayu Suhendra", email: "bayu.suhendra@example.test" },
  { employeeNumber: "CX-0012", name: "Tari Maharani", email: "tari.maharani@example.test" },
  { employeeNumber: "CX-0013", name: "Farhan Maulana", email: "farhan.maulana@example.test" },
  { employeeNumber: "CX-0014", name: "Rina Cahyani", email: "rina.cahyani@example.test" },
  { employeeNumber: "CX-0015", name: "Indra Setiawan", email: "indra.setiawan@example.test" },
  { employeeNumber: "CX-0016", name: "Nina Kartika", email: "nina.kartika@example.test" },
  { employeeNumber: "CX-0017", name: "Lukman Hakim", email: "lukman.hakim@example.test" },
  { employeeNumber: "CX-0018", name: "Anita Setyowati", email: "anita.setyowati@example.test" },
  { employeeNumber: "CX-0019", name: "Irfan Budiman", email: "irfan.budiman@example.test" },
  { employeeNumber: "CX-0020", name: "Yuni Astuti", email: "yuni.astuti@example.test" },
];

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getWorkdays(startDateStr: string, endDateStr: string): string[] {
  const workdays: string[] = [];
  const current = new Date(`${startDateStr}T00:00:00.000Z`);
  const end = new Date(`${endDateStr}T00:00:00.000Z`);

  while (current <= end) {
    const dayOfWeek = current.getUTCDay(); // 0 is Sun, 6 is Sat
    if (dayOfWeek >= 1 && dayOfWeek <= 5) {
      const year = current.getUTCFullYear();
      const month = String(current.getUTCMonth() + 1).padStart(2, "0");
      const day = String(current.getUTCDate()).padStart(2, "0");
      workdays.push(`${year}-${month}-${day}`);
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return workdays;
}

const leaveNotes = ["Annual leave", "Sick leave", "Personal leave"];

async function main() {
  const adminPasswordHash = await hash(adminPassword, 12);
  const demoPasswordHash = await hash(demoPassword, 12);

  // 1. Cleanup obsolete Employee users, obsolete Demo users, and Attendance records
  await prisma.user.deleteMany({
    where: {
      OR: [
        { role: "Employee" },
        { role: "Demo", email: { not: "demo@example.test" } },
      ],
    },
  });

  await prisma.attendanceRecord.deleteMany({});

  const canonicalNumbers = canonicalEmployees.map((e) => e.employeeNumber);
  await prisma.employee.deleteMany({
    where: {
      employeeNumber: {
        notIn: canonicalNumbers,
      },
    },
  });

  // 2. Upsert Canonical Admin
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

  // 2b. Upsert Canonical Demo
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.test" },
    update: {
      passwordHash: demoPasswordHash,
      role: "Demo",
      employeeId: null,
    },
    create: {
      email: "demo@example.test",
      passwordHash: demoPasswordHash,
      role: "Demo",
    },
  });

  // 3. Upsert 20 Canonical Employees
  const employeeRecordsMap = new Map<string, string>(); // employeeNumber -> id
  for (const empData of canonicalEmployees) {
    const emp = await prisma.employee.upsert({
      where: { employeeNumber: empData.employeeNumber },
      update: {
        name: empData.name,
        email: empData.email,
        isActive: true,
      },
      create: {
        employeeNumber: empData.employeeNumber,
        name: empData.name,
        email: empData.email,
        isActive: true,
      },
    });
    employeeRecordsMap.set(empData.employeeNumber, emp.id);
  }

  // 4. Generate Deterministic Historical Attendance (2026-07-01 to 2026-08-09)
  const workdays = getWorkdays("2026-07-01", "2026-08-09");
  const recordsToCreate: Array<{
    employeeId: string;
    attendanceDate: Date;
    checkInAt: Date | null;
    checkOutAt: Date | null;
    status: AttendanceStatus;
    notes: string | null;
  }> = [];

  let countPresent = 0;
  let countLate = 0;
  let countLeave = 0;
  let countDerivedAbsent = 0;

  for (let empIdx = 0; empIdx < canonicalEmployees.length; empIdx++) {
    const empData = canonicalEmployees[empIdx];
    const empId = employeeRecordsMap.get(empData.employeeNumber)!;

    for (let dIdx = 0; dIdx < workdays.length; dIdx++) {
      const dateStr = workdays[dIdx];
      const [year, month, day] = dateStr.split("-").map(Number);
      const attendanceDate = new Date(Date.UTC(year, month - 1, day));

      // Deterministic PRNG per employee & date
      const seed = 20260701 + empIdx * 1000 + dIdx * 13;
      const prng = mulberry32(seed);

      const val = prng();

      // Profile-based thresholds for natural distribution variation
      let pThreshold = 0.89;
      let lThreshold = 0.95;
      let lvThreshold = 0.98;

      if (empIdx >= 12 && empIdx <= 16) {
        // Late prone
        pThreshold = 0.82;
        lThreshold = 0.95;
        lvThreshold = 0.98;
      } else if (empIdx >= 17) {
        // Leave / Absent prone
        pThreshold = 0.80;
        lThreshold = 0.86;
        lvThreshold = 0.96;
      }

      if (val < pThreshold) {
        // Present
        countPresent++;
        // Check-in: 07:35 to 08:00 WIB -> 00:35 to 01:00 UTC
        const checkInMin = Math.floor(prng() * 26);
        const checkInAt = new Date(Date.UTC(year, month - 1, day, 0, 35 + checkInMin, 0));

        // Check-out: 16:45 to 18:00 WIB -> 09:45 to 11:00 UTC
        const checkOutMin = Math.floor(prng() * 76);
        const checkOutAt = new Date(Date.UTC(year, month - 1, day, 9, 45 + checkOutMin, 0));

        recordsToCreate.push({
          employeeId: empId,
          attendanceDate,
          checkInAt,
          checkOutAt,
          status: "Present",
          notes: null,
        });
      } else if (val < lThreshold) {
        // Late
        countLate++;
        // Check-in: 08:01 to 09:05 WIB -> 01:01 to 02:05 UTC
        const checkInMin = 1 + Math.floor(prng() * 64);
        const checkInAt = new Date(Date.UTC(year, month - 1, day, 1, checkInMin, 0));

        // Check-out: 16:45 to 18:00 WIB -> 09:45 to 11:00 UTC
        const checkOutMin = Math.floor(prng() * 76);
        const checkOutAt = new Date(Date.UTC(year, month - 1, day, 9, 45 + checkOutMin, 0));

        recordsToCreate.push({
          employeeId: empId,
          attendanceDate,
          checkInAt,
          checkOutAt,
          status: "Late",
          notes: null,
        });
      } else if (val < lvThreshold) {
        // Leave
        countLeave++;
        const note = leaveNotes[Math.floor(prng() * leaveNotes.length)];
        recordsToCreate.push({
          employeeId: empId,
          attendanceDate,
          checkInAt: null,
          checkOutAt: null,
          status: "Leave",
          notes: note,
        });
      } else {
        // Derived Absent -> Intentionally omit AttendanceRecord
        countDerivedAbsent++;
      }
    }
  }

  // Insert records in batch
  await prisma.attendanceRecord.createMany({
    data: recordsToCreate,
  });

  // 5. Verification & Reporting
  const totalEmployeesCount = await prisma.employee.count();
  const totalAdminCount = await prisma.user.count({ where: { role: "Admin" } });
  const totalDemoCount = await prisma.user.count({ where: { role: "Demo" } });
  const totalEmployeeUserCount = await prisma.user.count({ where: { role: "Employee" } });
  const totalUserCount = await prisma.user.count();
  const totalAttendanceRecordCount = await prisma.attendanceRecord.count();

  const totalOpportunities = canonicalEmployees.length * workdays.length;

  console.log("==========================================");
  console.log("STAGE A4 PUBLIC DEMO SEED COMPLETED SUCCESSFULLY");
  console.log("==========================================");
  console.log(`Employees Created: ${totalEmployeesCount}`);
  console.log(`User Admin Count: ${totalAdminCount} (${adminUser.email})`);
  console.log(`User Demo Count: ${totalDemoCount} (${demoUser.email})`);
  console.log(`User Employee Count: ${totalEmployeeUserCount}`);
  console.log(`Total User Count: ${totalUserCount}`);
  console.log(`Total Expected Opportunities: ${totalOpportunities} (${canonicalEmployees.length} employees * ${workdays.length} workdays)`);
  console.log(`Persisted Attendance Records: ${totalAttendanceRecordCount}`);
  console.log(`  - Present Count: ${countPresent} (${((countPresent / totalOpportunities) * 100).toFixed(1)}%)`);
  console.log(`  - Late Count: ${countLate} (${((countLate / totalOpportunities) * 100).toFixed(1)}%)`);
  console.log(`  - Leave Count: ${countLeave} (${((countLeave / totalOpportunities) * 100).toFixed(1)}%)`);
  console.log(`  - Derived Absent Count: ${countDerivedAbsent} (${((countDerivedAbsent / totalOpportunities) * 100).toFixed(1)}%)`);
  console.log("==========================================");

  // Assert programmatic quality (Stage A4 Quality Assertions)
  const allEmployees = await prisma.employee.findMany();
  if (allEmployees.length !== 20) throw new Error(`Expected 20 employees, found ${allEmployees.length}`);

  const employeeNumbers = new Set(allEmployees.map((e) => e.employeeNumber));
  if (employeeNumbers.size !== 20) throw new Error("Duplicate employee numbers found!");

  const employeeEmails = new Set(allEmployees.map((e) => e.email));
  if (employeeEmails.size !== 20) throw new Error("Duplicate employee emails found!");

  for (let i = 1; i <= 20; i++) {
    const expectedNum = `CX-${String(i).padStart(4, "0")}`;
    if (!employeeNumbers.has(expectedNum)) throw new Error(`Missing expected employee number ${expectedNum}`);
  }

  const forbiddenWords = ["test", "demo", "sample", "mvp", "validation", "stage"];
  for (const emp of allEmployees) {
    if (!emp.email.endsWith("@example.test")) throw new Error(`Invalid email domain for employee ${emp.email}`);
    if (!emp.name || emp.name.trim().length === 0) throw new Error(`Empty employee name for ${emp.employeeNumber}`);

    const nameLower = emp.name.toLowerCase();
    for (const forbidden of forbiddenWords) {
      if (nameLower.includes(forbidden)) {
        throw new Error(`Employee name '${emp.name}' contains prohibited test word '${forbidden}'`);
      }
    }
  }

  if (totalAdminCount !== 1) throw new Error(`Expected 1 admin user, found ${totalAdminCount}`);
  if (totalDemoCount !== 1) throw new Error(`Expected 1 demo user, found ${totalDemoCount}`);
  if (totalEmployeeUserCount !== 0) throw new Error(`Expected 0 employee users, found ${totalEmployeeUserCount}`);
  if (totalUserCount !== 2) throw new Error(`Expected 2 total users, found ${totalUserCount}`);
  if (demoUser.employeeId !== null) throw new Error("Expected demo user employeeId to be null");
  if (totalAttendanceRecordCount !== countPresent + countLate + countLeave) {
    throw new Error("Attendance record count mismatch!");
  }
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
