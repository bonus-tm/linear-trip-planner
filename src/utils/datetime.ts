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
  const days = Math.floor(delta / (1000 * 60 * 60 * 24));

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
