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

const canonicalEmployees = [
  { employeeNumber: "CX-0001", name: "Joko Sutrisno", email: "joko.sutrisno@example.test" },
  { employeeNumber: "CX-0002", name: "Eko Patria", email: "eko.patria@example.test" },
  { employeeNumber: "CX-0003", name: "Taufan Wira", email: "taufan.wira@example.test" },
  { employeeNumber: "CX-0004", name: "Dewi Lestari", email: "dewi.lestari@example.test" },
  { employeeNumber: "CX-0005", name: "Budi Santoso", email: "budi.santoso@example.test" },
  { employeeNumber: "CX-0006", name: "Siti Rahayu", email: "siti.rahayu@example.test" },
  { employeeNumber: "CX-0007", name: "Agus Wijaya", email: "agus.wijaya@example.test" },
  { employeeNumber: "CX-0008", name: "Rina Kusuma", email: "rina.kusuma@example.test" },
  { employeeNumber: "CX-0009", name: "Hendra Setiawan", email: "hendra.setiawan@example.test" },
  { employeeNumber: "CX-0010", name: "Sri Wahyuni", email: "sri.wahyuni@example.test" },
  { employeeNumber: "CX-0011", name: "Bambang Pratama", email: "bambang.pratama@example.test" },
  { employeeNumber: "CX-0012", name: "Indah Permata", email: "indah.permata@example.test" },
  { employeeNumber: "CX-0013", name: "Rizky Ramadhan", email: "rizky.ramadhan@example.test" },
  { employeeNumber: "CX-0014", name: "Maya Utami", email: "maya.utami@example.test" },
  { employeeNumber: "CX-0015", name: "Aditya Nugroho", email: "aditya.nugroho@example.test" },
  { employeeNumber: "CX-0016", name: "Putri Handayani", email: "putri.handayani@example.test" },
  { employeeNumber: "CX-0017", name: "Fajar Hidayat", email: "fajar.hidayat@example.test" },
  { employeeNumber: "CX-0018", name: "Dian Saputra", email: "dian.saputra@example.test" },
  { employeeNumber: "CX-0019", name: "Arif Rahman", email: "arif.rahman@example.test" },
  { employeeNumber: "CX-0020", name: "Nurul Huda", email: "nurul.huda@example.test" },
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

  // 1. Cleanup obsolete Employee users and Attendance records
  await prisma.user.deleteMany({
    where: { role: "Employee" },
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

  // 4. Generate Deterministic Historical Attendance (2026-07-01 to 2026-08-08)
  const workdays = getWorkdays("2026-07-01", "2026-08-08");
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
  const totalEmployeeUserCount = await prisma.user.count({ where: { role: "Employee" } });
  const totalAttendanceRecordCount = await prisma.attendanceRecord.count();

  const totalOpportunities = canonicalEmployees.length * workdays.length;

  console.log("==========================================");
  console.log("P8B DEMO SEED COMPLETED SUCCESSFULLY");
  console.log("==========================================");
  console.log(`Employees Created: ${totalEmployeesCount}`);
  console.log(`User Admin Count: ${totalAdminCount} (${adminUser.email})`);
  console.log(`User Employee Count: ${totalEmployeeUserCount}`);
  console.log(`Total Expected Opportunities: ${totalOpportunities} (${canonicalEmployees.length} employees * ${workdays.length} workdays)`);
  console.log(`Persisted Attendance Records: ${totalAttendanceRecordCount}`);
  console.log(`  - Present Count: ${countPresent} (${((countPresent / totalOpportunities) * 100).toFixed(1)}%)`);
  console.log(`  - Late Count: ${countLate} (${((countLate / totalOpportunities) * 100).toFixed(1)}%)`);
  console.log(`  - Leave Count: ${countLeave} (${((countLeave / totalOpportunities) * 100).toFixed(1)}%)`);
  console.log(`  - Derived Absent Count: ${countDerivedAbsent} (${((countDerivedAbsent / totalOpportunities) * 100).toFixed(1)}%)`);
  console.log("==========================================");

  // Assert programmatic quality
  if (totalEmployeesCount !== 20) throw new Error(`Expected 20 employees, found ${totalEmployeesCount}`);
  if (totalAdminCount !== 1) throw new Error(`Expected 1 admin user, found ${totalAdminCount}`);
  if (totalEmployeeUserCount !== 0) throw new Error(`Expected 0 employee users, found ${totalEmployeeUserCount}`);
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
