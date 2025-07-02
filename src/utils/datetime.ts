export const DAY_24_HRS = 24 * 60 * 60 * 1000;

/**
 * Convert timezone shift to parseable string, e.g.:
 * 0 → 'Z'
 * 3 → '+03:00'
 * -10 → '-10:00'
 */
export function formatTZ(shift: number) {
  return `${shift >= 0 ? '+' : '-'}${Math.abs(shift).toString().padStart(2, '0')}:00`;
}

/**
 * Format timestamp to date and time ISO string in specified timezone
 */
export function formatISOWithTZ(timestamp: number, timezoneShift: number) {
  const d = new Date(timestamp);
  return d.toLocaleString('sv', {timeZone: formatTZ(timezoneShift)})
    .replace(' ', 'T')
    .slice(0, 16);
}

export function formatAsYMD(timestamp: number, timezoneShift: number) {
  const d = new Date(timestamp);
  return d.toLocaleString('sv', {timeZone: formatTZ(timezoneShift)})
    .slice(0, 10);
}

/**
 * Format inputted date string to like "31.01.2025, 20:52"
 */
export function formatHumanDateTime(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);

  // 'de-DE' gives the desired dot format
  const formatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return formatter.format(date).replace(',', '');
}

/**
 * Format inputted date string to like "31.01.2025"
 */
export function formatHumanDate(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);

  // 'de-DE' gives the desired dot format
  const formatter = new Intl.DateTimeFormat('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  return formatter.format(date);
}

/**
 * Format duration as hours and minutes between two timestamps
 */
export function formatDurationTime(begin: number, end: number) {
  const delta = (end - begin) / 1000;
  const hours = Math.floor(delta / 3600);
  const minutes = Math.floor((delta % 3600) / 60);
  // @ts-ignore
  const formatter = new Intl.DurationFormat('en-US', {style: 'narrow'});
  return formatter.format({hours, minutes});
}

export function formatDurationDays(beginDate: string, endDate: string) {
  if (!beginDate || !endDate) return '';

  // Parse dates and ignore time parts by using only the date portion
  const begin = new Date(beginDate.split('T')[0]);
  const end = new Date(endDate.split('T')[0]);

  // Calculate difference in milliseconds and convert to days
  const delta = end.getTime() - begin.getTime();
  const days = Math.floor(delta / DAY_24_HRS);

  // Use Intl.DurationFormat to format the duration
  // @ts-ignore
  const formatter = new Intl.DurationFormat('en-US', {style: 'short'});
  return formatter.format({days});
}

export function getDayBeginTimestamp(date: string | number, timezoneShift: number): number {
  let dateString: string;

  if (typeof date === 'string') {
    dateString = date;
  } else {
    // Convert timestamp to date string in the specified timezone
    dateString = formatAsYMD(date, timezoneShift);
  }

  return new Date(`${dateString}T00:00:00${formatTZ(timezoneShift)}`).getTime();
}

/**
 * Generate an array of all dates in YMD strings between two specified dates, inclusive
 */
export function getDatesBetween(begin: number, end: number, timezoneShift: number) {
  const beginDate = new Date(begin);
  const endDate = new Date(end);
  const dates: string[] = [];

  let currentDate = new Date(beginDate);

  while (currentDate <= endDate) {
    dates.push(formatAsYMD(currentDate.getTime(), timezoneShift));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export function isWeekendDay(dateString: string) {
  const date = new Date(dateString);
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  return day === 0 || day === 6;
}

export function convertDateToYM(dateStr: string): number[] {
  if (!dateStr) return [];
  if (!dateStr.includes('-')) return [];
  const [y, m] = dateStr.split('-');
  return [parseInt(y), parseInt(m) - 1];
}

type ConvertRangeOptions = {
  dash?: string;
  space?: string;
  locale?: string;
}
const defaultConvertRangeOptions: ConvertRangeOptions = {
  dash: '—',
  space: '',
  locale: 'en-US',
};

/**
 * Convert stored range to human readable
 * @param range {number[][]} array of years and months (0-11), like [[y1, m1], [y2, m2]]
 * @param options {ConvertRangeOptions}
 * @return {string}
 */
export function convertYMRangeToMonths(
  range: number[][],
  options: ConvertRangeOptions = {},
): string {
  if (range.length === 0) {
    return '';
  }

  options = {...options, ...defaultConvertRangeOptions};

  const [firstYear, firstMonth] = range[0];
  const [lastYear, lastMonth] = range[1];

  const sameYear = firstYear === lastYear;
  const sameMonth = firstMonth === lastMonth;

  const firstDate = new Date(firstYear, firstMonth, 1);
  const lastDate = new Date(lastYear, lastMonth, 1);

  if (sameYear && sameMonth) {
    // Same year and month: "March 2024"
    return firstDate.toLocaleDateString(options.locale, {month: 'long', year: 'numeric'});
  } else if (sameYear) {
    // Same year: "January — March 2024"
    const firstMonthName = firstDate.toLocaleDateString(options.locale, {month: 'long'});
    const lastMonthName = lastDate.toLocaleDateString(options.locale, {month: 'long'});
    return `${firstMonthName}${options.space}${options.dash}${options.space}${lastMonthName} ${firstYear}`;
  } else {
    // Different years: "December 2023 — February 2024"
    const firstMonthYear = firstDate.toLocaleDateString(options.locale, {month: 'long', year: 'numeric'});
    const lastMonthYear = lastDate.toLocaleDateString(options.locale, {month: 'long', year: 'numeric'});
    return `${firstMonthYear}${options.space}${options.dash}${options.space}${lastMonthYear}`;
  }
}
