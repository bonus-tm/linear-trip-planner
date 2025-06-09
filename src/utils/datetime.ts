export function formatTZ(shift: number) {
  if (shift > 0) {
    return `+${shift.toString().padStart(2, '0')}:00`;
  } else if (shift < 0) {
    return `-${shift.toString().padStart(2, '0')}`;
  } else {
    return 'Z';
  }
}

export function formatISOWithTZ(timestamp: number, timezoneShift: number) {
  const d = new Date(timestamp);
  return d.toLocaleString('sv', {timeZone: formatTZ(timezoneShift)})
    .replace(' ', 'T')
    .slice(0, 16);
}
