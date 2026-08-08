import type { AttendanceStatus } from "@/prisma/generated/client";

export const ATTENDANCE_TIME_ZONE = "Asia/Jakarta";
export const WORK_START_HOUR = 8;

export type JakartaDateParts = {
  year: number;
  month: number;
  day: number;
  weekday: string;
  hour: number;
  minute: number;
  second: number;
};

const jakartaDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: ATTENDANCE_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const jakartaDateDisplayFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

const jakartaTimeDisplayFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ATTENDANCE_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function partValue(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
) {
  const value = parts.find((part) => part.type === type)?.value;

  if (!value) {
    throw new Error(`Unable to determine Jakarta ${type}.`);
  }

  return value;
}

export function getJakartaDateParts(instant: Date): JakartaDateParts {
  const parts = jakartaDateTimeFormatter.formatToParts(instant);

  return {
    year: Number(partValue(parts, "year")),
    month: Number(partValue(parts, "month")),
    day: Number(partValue(parts, "day")),
    weekday: partValue(parts, "weekday"),
    hour: Number(partValue(parts, "hour")),
    minute: Number(partValue(parts, "minute")),
    second: Number(partValue(parts, "second")),
  };
}

export function getJakartaBusinessDate(instant: Date) {
  const { year, month, day } = getJakartaDateParts(instant);

  // Prisma maps this value to a PostgreSQL DATE. Build it from explicit
  // Jakarta calendar parts so the UTC calendar date cannot leak into policy.
  return new Date(Date.UTC(year, month - 1, day));
}

export function getJakartaBusinessDateKey(instant: Date) {
  const { year, month, day } = getJakartaDateParts(instant);

  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function isJakartaWorkday(instant: Date) {
  const { weekday } = getJakartaDateParts(instant);

  return weekday !== "Sat" && weekday !== "Sun";
}

export function determineAttendanceStatus(instant: Date): AttendanceStatus {
  const { hour, minute, second } = getJakartaDateParts(instant);

  if (hour < WORK_START_HOUR) {
    return "Present";
  }

  if (hour === WORK_START_HOUR && minute === 0 && second === 0) {
    return "Present";
  }

  return "Late";
}

export function formatJakartaBusinessDate(attendanceDate: Date) {
  return jakartaDateDisplayFormatter.format(attendanceDate);
}

export function formatJakartaTime(instant: Date | null) {
  return instant ? jakartaTimeDisplayFormatter.format(instant) : "-";
}
