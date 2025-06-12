import type { DaylightInfo } from '../types'

/**
 * Calculate sunrise and sunset times for a given location and date
 * Using simplified astronomical calculations
 */
export function calculateDaylight(
  lat: number,
  lng: number,
  dateStr: string,
  timezone: number
): DaylightInfo     {
  const date = new Date(dateStr);
  // Julian day number
  const julianDay = getJulianDay(date)
  
  // Calculate sunrise and sunset in UTC
  const { sunrise, sunset, polarNight, polarDay } = calculateSunTimes(julianDay, lat, lng)
  
  if (polarNight) {
    return {
      sunrise: '--:--',
      sunset: '--:--',
      polar_night: true
    }
  }
  
  if (polarDay) {
    return {
      sunrise: '00:00',
      sunset: '23:59',
      polar_night: false
    }
  }
  
  // Convert to local time
  const sunriseLocal = utcToLocal(sunrise, timezone)
  const sunsetLocal = utcToLocal(sunset, timezone)
  
  return {
    sunrise: formatTime(sunriseLocal),
    sunset: formatTime(sunsetLocal),
    polar_night: false
  }
}

function getJulianDay(date: Date): number {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  
  const a = Math.floor((14 - month) / 12)
  const y = year + 4800 - a
  const m = month + 12 * a - 3
  
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + 
         Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045
}

function calculateSunTimes(julianDay: number, lat: number, lng: number) {
  // Calculate the equation of time and solar declination
  const n = julianDay - 2451545.0
  const L = (280.460 + 0.9856474 * n) % 360
  const g = toRadians((357.528 + 0.9856003 * n) % 360)
  const lambda = toRadians(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g))
  
  // Solar declination
  const declination = Math.asin(Math.sin(toRadians(23.44)) * Math.sin(lambda))
  
  // Hour angle
  const latRad = toRadians(lat)
  const cosH = -Math.tan(latRad) * Math.tan(declination)
  
  // Check for polar night or polar day
  if (cosH > 1) {
    return { sunrise: 0, sunset: 0, polarNight: true, polarDay: false }
  }
  if (cosH < -1) {
    return { sunrise: 0, sunset: 0, polarNight: false, polarDay: true }
  }
  
  const H = toDegrees(Math.acos(cosH))
  
  // Time corrections
  const equationOfTime = 4 * (L - 0.0057183 - toDegrees(lambda))
  const timeCorrection = equationOfTime - lng * 4
  
  // Calculate sunrise and sunset times (in minutes from midnight UTC)
  const solarNoon = 720 + timeCorrection
  const sunrise = solarNoon - H * 4
  const sunset = solarNoon + H * 4
  
  return {
    sunrise: sunrise,
    sunset: sunset,
    polarNight: false,
    polarDay: false
  }
}

function toRadians(degrees: number): number {
  return degrees * Math.PI / 180
}

function toDegrees(radians: number): number {
  return radians * 180 / Math.PI
}

function utcToLocal(utcMinutes: number, timezone: number): number {
  return utcMinutes + timezone * 60
}

function formatTime(minutes: number): string {
  // Handle day overflow
  while (minutes < 0) minutes += 1440
  while (minutes >= 1440) minutes -= 1440
  
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
}
