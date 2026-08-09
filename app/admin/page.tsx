import { signOut } from "@/auth";
import Link from "next/link";
import { requireAdminView } from "@/lib/authorization";
import { prisma } from "@/lib/db";
import {
  buildAdminAttendanceRows,
  buildAdminAttendanceSummary,
} from "@/lib/admin-attendance";
import {
  formatJakartaBusinessDate,
  getBusinessDateKey,
  getJakartaBusinessDate,
  isBusinessDateWorkday,
} from "@/lib/attendance-time";
import { AppShell } from "@/components/app-shell";
import { KPICard } from "@/components/kpi-card";
import { StatusBadge } from "@/components/status-badge";
import { AttendanceTrendChart, type TrendDataPoint } from "@/components/attendance-trend-chart";
import { AttendanceDonutChart } from "@/components/attendance-donut-chart";
import { PeriodSummaryCard } from "@/components/period-summary-card";
import { RecentActivityCard, type ActivityItem } from "@/components/recent-activity-card";
import {
  UsersIcon,
  CheckCircleIcon,
  ClockWarningIcon,
  LeaveIcon,
  MinusCircleIcon,
  UserPlusIcon,
  CalendarIcon,
  FileTextIcon,
} from "@/components/icons";

type AdminPageProps = {
  searchParams?: Promise<{
    range?: string | string[];
  }>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const adminUser = await requireAdminView();

  const resolvedSearchParams = await searchParams;
  const rawRange = Array.isArray(resolvedSearchParams?.range)
    ? resolvedSearchParams.range[0]
    : resolvedSearchParams?.range;

  let selectedRange = 7;
  if (rawRange === "14") selectedRange = 14;
  else if (rawRange === "30") selectedRange = 30;

  const currentBusinessDate = getJakartaBusinessDate(new Date());
  const currentBusinessDateKey = getBusinessDateKey(currentBusinessDate);
  const isTodayWorkday = isBusinessDateWorkday(currentBusinessDate);

  // Dynamic range date window calculation
  const startDate = new Date(currentBusinessDate);
  startDate.setUTCDate(startDate.getUTCDate() - (selectedRange - 1));

  const [employees, allRangeRecords] = await Promise.all([
    prisma.employee.findMany({
      orderBy: [{ employeeNumber: "asc" }],
      select: {
        id: true,
        employeeNumber: true,
        name: true,
        email: true,
        isActive: true,
      },
    }),
    prisma.attendanceRecord.findMany({
      where: {
        attendanceDate: {
          gte: startDate,
          lte: currentBusinessDate,
        },
      },
      select: {
        employeeId: true,
        attendanceDate: true,
        checkInAt: true,
        checkOutAt: true,
        status: true,
      },
    }),
  ]);

  // Group records by date key
  const recordsByDateKey = new Map<string, typeof allRangeRecords>();
  for (const rec of allRangeRecords) {
    const key = getBusinessDateKey(rec.attendanceDate);
    const existing = recordsByDateKey.get(key) ?? [];
    existing.push(rec);
    recordsByDateKey.set(key, existing);
  }

  // Build dynamic range trend data points, KPI sparkline series & Period Summary metrics
  const trendData: TrendDataPoint[] = [];
  const totalSeries: number[] = [];
  const presentSeries: number[] = [];
  const lateSeries: number[] = [];
  const leaveSeries: number[] = [];
  const uncheckedSeries: number[] = [];

  let periodWorkdaysCount = 0;
  let periodPresent = 0;
  let periodLate = 0;
  let periodLeave = 0;
  let periodAbsent = 0;

  for (let i = 0; i < selectedRange; i++) {
    const d = new Date(startDate);
    d.setUTCDate(d.getUTCDate() + i);
    const dateKey = getBusinessDateKey(d);
    const dayRecords = recordsByDateKey.get(dateKey) ?? [];

    const dayRows = buildAdminAttendanceRows({
      employees,
      records: dayRecords,
      selectedDate: d,
      currentBusinessDate,
    });
    const daySummary = buildAdminAttendanceSummary(dayRows);

    totalSeries.push(daySummary["Total Employees"]);
    presentSeries.push(daySummary.Present);
    lateSeries.push(daySummary.Late);
    leaveSeries.push(daySummary.Leave);
    uncheckedSeries.push(daySummary["Not checked in"] + daySummary.Absent);

    const isWorkday = isBusinessDateWorkday(d);
    if (isWorkday) {
      periodWorkdaysCount += 1;
      periodPresent += daySummary.Present;
      periodLate += daySummary.Late;
      periodLeave += daySummary.Leave;
      periodAbsent += daySummary.Absent;
    }

    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];
    const dateLabel = `${d.getUTCDate()} ${monthNames[d.getUTCMonth()]}`;

    trendData.push({
      dateLabel,
      dateKey,
      count: daySummary.Present + daySummary.Late,
      total: daySummary["Total Employees"],
      isToday: dateKey === currentBusinessDateKey,
    });
  }

  const periodOpportunities = periodWorkdaysCount * employees.length;

  // Today's specific rows & summary
  const todayRecords = recordsByDateKey.get(currentBusinessDateKey) ?? [];
  const rows = buildAdminAttendanceRows({
    employees,
    records: todayRecords,
    selectedDate: currentBusinessDate,
    currentBusinessDate,
  });

  const summary = buildAdminAttendanceSummary(rows);
  const totalEmployees = summary["Total Employees"];
  const presentCount = summary.Present;
  const lateCount = summary.Late;
  const leaveCount = summary.Leave;
  const notCheckedInCount = summary["Not checked in"];
  const absentCount = summary.Absent;

  function calcPct(count: number) {
    if (totalEmployees === 0) return "0.0";
    return ((count / totalEmployees) * 100).toFixed(1);
  }

  // Build Recent Activity Items
  const recentActivities: ActivityItem[] = [];

  for (const row of rows) {
    if (row.attendanceStatus === "Present") {
      recentActivities.push({
        id: `act-present-${row.employeeId}`,
        employeeName: row.name,
        type: "check-in",
        message: "melakukan check-in",
        timeLabel: row.checkInTime !== "-" ? `Hari ini, ${row.checkInTime} WIB` : "Hari ini",
      });
    } else if (row.attendanceStatus === "Late") {
      recentActivities.push({
        id: `act-late-${row.employeeId}`,
        employeeName: row.name,
        type: "late",
        message: "terlambat check-in",
        timeLabel: row.checkInTime !== "-" ? `Hari ini, ${row.checkInTime} WIB` : "Hari ini",
      });
    } else if (row.attendanceStatus === "Leave") {
      recentActivities.push({
        id: `act-leave-${row.employeeId}`,
        employeeName: row.name,
        type: "leave",
        message: "mengajukan cuti",
        timeLabel: "Hari ini",
      });
    } else if (row.attendanceStatus === "Not checked in" && isTodayWorkday) {
      recentActivities.push({
        id: `act-unchecked-${row.employeeId}`,
        employeeName: row.name,
        type: "not-checked-in",
        message: "belum melakukan check-in",
        timeLabel: "Hari ini",
      });
    }
  }

  const signOutAction = async () => {
    "use server";
    await signOut({ redirectTo: "/login" });
  };

  return (
    <AppShell
      title="Dashboard"
      subtitle={`Ringkasan kehadiran hari ini • ${formatJakartaBusinessDate(currentBusinessDate)}${!isTodayWorkday ? " (Bukan Hari Kerja)" : ""}`}
      headerDate={formatJakartaBusinessDate(currentBusinessDate)}
      user={{
        role: adminUser.role,
      }}
      signOutAction={signOutAction}
    >
      <div className="space-y-6">
        {/* ROW 1: Top 5 KPI Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <KPICard
            title="TOTAL KARYAWAN"
            value={totalEmployees}
            subtitle="Semua karyawan aktif"
            icon={<UsersIcon size={20} />}
            variant="blue"
            sparklineData={totalSeries}
            sparklinePeriod={`Trend ${selectedRange} hari`}
          />
          <KPICard
            title="HADIR"
            value={presentCount}
            subtitle={`Hari ini · ${calcPct(presentCount)}%`}
            icon={<CheckCircleIcon size={20} />}
            variant="green"
            sparklineData={presentSeries}
            sparklinePeriod={`Trend ${selectedRange} hari`}
          />
          <KPICard
            title="TERLAMBAT"
            value={lateCount}
            subtitle={`Hari ini · ${calcPct(lateCount)}%`}
            icon={<ClockWarningIcon size={20} />}
            variant="orange"
            sparklineData={lateSeries}
            sparklinePeriod={`Trend ${selectedRange} hari`}
          />
          <KPICard
            title="CUTI"
            value={leaveCount}
            subtitle={`Hari ini · ${calcPct(leaveCount)}%`}
            icon={<LeaveIcon size={20} />}
            variant="purple"
            sparklineData={leaveSeries}
            sparklinePeriod={`Trend ${selectedRange} hari`}
          />
          <KPICard
            title="BELUM CHECK-IN"
            value={notCheckedInCount + absentCount}
            subtitle={`Hari ini · ${calcPct(notCheckedInCount + absentCount)}%`}
            icon={<MinusCircleIcon size={20} />}
            variant="gray"
            sparklineData={uncheckedSeries}
            sparklinePeriod={`Trend ${selectedRange} hari`}
          />
        </div>

        {/* ROW 2: Ringkasan Kehadiran Table (2 cols) | Stack of Distribusi Kehadiran + Aksi Cepat (1 col) */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Left Panel: Today's Attendance Overview Table */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md transition-colors shadow-sm h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/[0.08]">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                      Ringkasan Kehadiran
                    </h2>
                  </div>
                  <Link
                    href="/admin/attendance"
                    className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 transition hover:bg-blue-500/20"
                  >
                    Lihat Semua
                  </Link>
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="dark-table">
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">KARYAWAN</th>
                        <th scope="col">STATUS</th>
                        <th scope="col">Check-in</th>
                        <th scope="col">Check-out</th>
                        <th scope="col">Keterangan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length > 0 ? (
                        rows.slice(0, 5).map((row, idx) => {
                          const initials = row.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase();
                          return (
                            <tr key={row.employeeId}>
                              <td className="text-slate-400 dark:text-slate-500 font-medium">{idx + 1}</td>
                              <td>
                                <div className="flex items-center gap-3">
                                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-white/[0.08] shrink-0">
                                    {initials}
                                  </div>
                                  <div>
                                    <p className="font-semibold text-slate-900 dark:text-white">{row.name}</p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{row.employeeNumber}</p>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <StatusBadge status={row.attendanceStatus} />
                              </td>
                              <td className="font-mono text-xs">{row.checkInTime}</td>
                              <td className="font-mono text-xs">{row.checkOutTime}</td>
                              <td className="text-xs text-slate-500 dark:text-slate-400">
                                {row.attendanceStatus === "Leave" ? "Cuti Tahunan" : "-"}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-500">
                            Tidak ada data karyawan.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel Stack: Distribusi Kehadiran + Aksi Cepat */}
          <div className="lg:col-span-1 space-y-6">
            <AttendanceDonutChart
              total={totalEmployees}
              present={presentCount}
              late={lateCount}
              leave={leaveCount}
              notCheckedIn={notCheckedInCount}
              absent={absentCount}
              notExpected={summary["Not expected"]}
              isWorkday={isTodayWorkday}
            />

            {/* Aksi Cepat */}
            <div className="rounded-xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#0F172A]/90 p-5 backdrop-blur-md space-y-3 transition-colors shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Aksi Cepat</h3>
              <div className="grid grid-cols-3 gap-2">
                <Link
                  href="/admin/employees/new"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] p-2.5 text-center transition hover:border-blue-500/40 hover:bg-blue-500/10 group"
                >
                  <UserPlusIcon size={18} className="text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight">Tambah Karyawan</span>
                </Link>
                <Link
                  href="/admin/attendance/leave"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] p-2.5 text-center transition hover:border-purple-500/40 hover:bg-purple-500/10 group"
                >
                  <CalendarIcon size={18} className="text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight">Catat Cuti</span>
                </Link>
                <Link
                  href="/admin/attendance"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-white/[0.03] p-2.5 text-center transition hover:border-emerald-500/40 hover:bg-emerald-500/10 group"
                >
                  <FileTextIcon size={18} className="text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 leading-tight">Rekap Kehadiran</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: 3-Column Layout (Statistik Kehadiran | Ringkasan Periode | Notifikasi) */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Col 1: Statistik Kehadiran */}
          <div className="lg:col-span-1">
            <AttendanceTrendChart data={trendData} selectedRange={selectedRange} />
          </div>

          {/* Col 2: Ringkasan Periode */}
          <div className="lg:col-span-1">
            <PeriodSummaryCard
              selectedRange={selectedRange}
              workdaysCount={periodWorkdaysCount}
              periodOpportunities={periodOpportunities}
              presentCount={periodPresent}
              lateCount={periodLate}
              leaveCount={periodLeave}
              absentCount={periodAbsent}
            />
          </div>

          {/* Col 3: Notifikasi */}
          <div className="lg:col-span-1">
            <RecentActivityCard
              activities={recentActivities}
              isWorkday={isTodayWorkday}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
