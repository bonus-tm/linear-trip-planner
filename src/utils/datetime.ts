/**
 * Convert timezone shift to parseable string, e.g.:
 * 0 → 'Z'
 * 3 → '+03:00'
 * -10 → '-10:00'
 */
export function formatTZ(shift: number) {
  if (shift > 0) {
    return `+${shift.toString().padStart(2, '0')}:00`;
  } else if (shift < 0) {
    return `-${shift.toString().padStart(2, '0')}`;
  } else {
    return 'Z';
  }
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
 * Format duration between two timestamps
 */
export function formatDuration(begin: number, end: number) {
  const delta = (end - begin) / 1000;
  const hours = Math.floor(delta / 3600);
  const minutes = Math.floor((delta % 3600) / 60);
  // @ts-ignore
  const formatter = new Intl.DurationFormat('en-US', {style: 'narrow'});
  return formatter.format({hours, minutes});
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