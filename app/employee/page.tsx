import { signOut } from "@/auth";
import { requireEmployee } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import {
  formatJakartaBusinessDate,
  formatJakartaTime,
  getJakartaBusinessDate,
  getJakartaBusinessDateKey,
  isJakartaWorkday,
} from "@/lib/attendance-time";
import { AttendanceActionForm } from "./attendance-action-form";

function actionForRecord(
  record: {
    checkInAt: Date | null;
    checkOutAt: Date | null;
    status: string;
  } | null,
  isWorkday: boolean,
) {
  if (!record) {
    return isWorkday ? "check-in" : null;
  }

  if (record.status === "Present" || record.status === "Late") {
    return record.checkInAt && !record.checkOutAt ? "check-out" : null;
  }

  return null;
}

export default async function EmployeePage() {
  const employee = await requireEmployee();
  const now = new Date();
  const attendanceDate = getJakartaBusinessDate(now);
  const businessDateKey = getJakartaBusinessDateKey(now);
  const isWorkday = isJakartaWorkday(now);
  const attendanceRecord = await prisma.attendanceRecord.findUnique({
    where: {
      employeeId_attendanceDate: {
        employeeId: employee.employeeId,
        attendanceDate,
      },
    },
    select: {
      status: true,
      checkInAt: true,
      checkOutAt: true,
    },
  });
  const attendanceStatus = attendanceRecord
    ? attendanceRecord.status
    : isWorkday
      ? "Not checked in"
      : "Not a workday";
  const actionType = actionForRecord(attendanceRecord, isWorkday);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10 text-slate-950">
      <section className="w-full max-w-md space-y-6 rounded-md border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-500">
            {formatJakartaBusinessDate(attendanceDate)}
          </p>
          <h1 className="text-3xl font-semibold tracking-normal">
            Employee Area
          </h1>
          <p className="text-sm text-slate-600">
            Jakarta business date: {businessDateKey}
          </p>
        </div>

        <dl className="grid gap-4 rounded-md border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-slate-600">Status</dt>
            <dd className="text-sm font-semibold">{attendanceStatus}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-slate-600">Check-in time</dt>
            <dd className="text-sm font-semibold">
              {formatJakartaTime(attendanceRecord?.checkInAt ?? null)}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-sm text-slate-600">Check-out time</dt>
            <dd className="text-sm font-semibold">
              {formatJakartaTime(attendanceRecord?.checkOutAt ?? null)}
            </dd>
          </div>
        </dl>

        {actionType ? <AttendanceActionForm actionType={actionType} /> : null}

        {!actionType && !attendanceRecord && !isWorkday ? (
          <p className="text-sm text-slate-600">
            Check-in is not available on weekends.
          </p>
        ) : null}

        {attendanceRecord?.status === "Leave" ? (
          <p className="text-sm text-slate-600">
            You are marked as Leave today.
          </p>
        ) : null}

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-950"
            type="submit"
          >
            Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
