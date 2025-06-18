import {describe, expect, it} from 'vitest';
import {calculateDaylight} from '../daylight';

describe('Daylight Calculations', () => {
  describe('calculateDaylight', () => {
    it('should calculate correct sunrise/sunset for New York in summer', () => {
      // New York: 40.7128°N, 74.0060°W, UTC-4 (EDT)
      // June 21, 2024 (Summer Solstice)
      const result = calculateDaylight(40.7128, -74.0060, '2024-06-21', -4);

      console.log('🗽 NEW YORK (Summer Solstice 2024-06-21, EDT):');
      console.log(`   Calculated: Sunrise ${result.sunrise}, Sunset ${result.sunset}`);
      console.log(`   Expected: Sunrise ~5:25, Sunset ~8:30`);
      console.log(`   Polar night: ${result.polar_night}`);

      expect(result.polar_night).toBe(false);
      expect(result.sunrise).toMatch(/^05:2[0-9]$/); // Should be around 5:25 AM
      expect(result.sunset).toMatch(/^20:[23][0-9]$/); // Should be around 8:30 PM
    });

    it('should calculate correct sunrise/sunset for London in winter', () => {
      // London: 51.5074°N, 0.1278°W, UTC+0 (GMT)
      // December 21, 2024 (Winter Solstice)
      const result = calculateDaylight(51.5074, -0.1278, '2024-12-21', 0);

      console.log('🇬🇧 LONDON (Winter Solstice 2024-12-21, GMT):');
      console.log(`   Calculated: Sunrise ${result.sunrise}, Sunset ${result.sunset}`);
      console.log(`   Expected: Sunrise ~8:03, Sunset ~3:53`);
      console.log(`   Polar night: ${result.polar_night}`);

      expect(result.polar_night).toBe(false);
      expect(result.sunrise).toMatch(/^0[8-9]:[0-9]{2}$/); // Should be around 8:03 AM
      expect(result.sunset).toMatch(/^1[5-6]:[0-9]{2}$/); // Should be around 3:53 PM
    });

    it('should calculate correct sunrise/sunset for Sydney in summer', () => {
      // Sydney: 33.8688°S, 151.2093°E, UTC+11 (AEDT)
      // December 21, 2024 (Summer Solstice in Southern Hemisphere)
      const result = calculateDaylight(-33.8688, 151.2093, '2024-12-21', 11);

      console.log('🇦🇺 SYDNEY (Summer Solstice 2024-12-21, AEDT):');
      console.log(`   Calculated: Sunrise ${result.sunrise}, Sunset ${result.sunset}`);
      console.log(`   Expected: Sunrise ~5:42, Sunset ~7:57`);
      console.log(`   Polar night: ${result.polar_night}`);

      expect(result.polar_night).toBe(false);
      expect(result.sunrise).toMatch(/^0[5-6]:[0-9]{2}$/); // Should be around 5:42 AM
      expect(result.sunset).toMatch(/^(19|20):[0-9]{2}$/); // Should be around 7:57-8:04 PM
    });

    it('should calculate correct sunrise/sunset for Reykjavik', () => {
      // Reykjavik: 64.1466°N, 21.9426°W, UTC+0 (GMT)
      // March 20, 2024 (Equinox)
      const result = calculateDaylight(64.1466, -21.9426, '2024-03-20', 0);

      console.log('🇮🇸 REYKJAVIK (Equinox 2024-03-20, GMT):');
      console.log(`   Calculated: Sunrise ${result.sunrise}, Sunset ${result.sunset}`);
      console.log(`   Expected: Sunrise ~6:47, Sunset ~6:59`);
      console.log(`   Polar night: ${result.polar_night}`);

      expect(result.polar_night).toBe(false);
      expect(result.sunrise).toMatch(/^0[6-7]:[0-9]{2}$/); // Should be around 6:47 AM
      expect(result.sunset).toMatch(/^(18|19):[0-9]{2}$/); // Should be around 6:59-7:21 PM
    });

    it('should handle polar night in northern Alaska', () => {
      // Barrow (Utqiagvik), Alaska: 71.2906°N, 156.7886°W, UTC-9 (AKST)
      // December 21, 2024 (Winter Solstice)
      const result = calculateDaylight(71.2906, -156.7886, '2024-12-21', -9);

      console.log('❄️ BARROW, ALASKA (Polar Night 2024-12-21, AKST):');
      console.log(`   Calculated: Sunrise ${result.sunrise}, Sunset ${result.sunset}`);
      console.log(`   Expected: Polar night (no sunrise/sunset)`);
      console.log(`   Polar night: ${result.polar_night}`);

      expect(result.polar_night).toBe(true);
      expect(result.sunrise).toBe('--:--');
      expect(result.sunset).toBe('--:--');
    });

    it('should handle polar day in northern Alaska', () => {
      // Barrow (Utqiagvik), Alaska: 71.2906°N, 156.7886°W, UTC-9 (AKDT)
      // June 21, 2024 (Summer Solstice)
      const result = calculateDaylight(71.2906, -156.7886, '2024-06-21', -8);

      console.log('☀️ BARROW, ALASKA (Polar Day 2024-06-21, AKDT):');
      console.log(`   Calculated: Sunrise ${result.sunrise}, Sunset ${result.sunset}`);
      console.log(`   Expected: Polar day (24h daylight)`);
      console.log(`   Polar night: ${result.polar_night}`);

      expect(result.polar_night).toBe(false);
      expect(result.sunrise).toBe('00:00');
      expect(result.sunset).toBe('23:59');
    });

    it('should handle polar night in Antarctica', () => {
      // McMurdo Station, Antarctica: 77.8419°S, 166.6863°E, UTC+12 (NZST)
      // June 21, 2024 (Winter Solstice in Southern Hemisphere)
      const result = calculateDaylight(-77.8419, 166.6863, '2024-06-21', 12);

      expect(result.polar_night).toBe(true);
      expect(result.sunrise).toBe('--:--');
      expect(result.sunset).toBe('--:--');
    });

    it('should handle polar day in Antarctica', () => {
      // McMurdo Station, Antarctica: 77.8419°S, 166.6863°E, UTC+12 (NZST)
      // December 21, 2024 (Summer Solstice in Southern Hemisphere)
      const result = calculateDaylight(-77.8419, 166.6863, '2024-12-21', 12);

      expect(result.polar_night).toBe(false);
      expect(result.sunrise).toBe('00:00');
      expect(result.sunset).toBe('23:59');
    });

    it('should calculate equinox correctly for various locations', () => {
      const equinoxDate = '2024-09-22'; // Autumnal Equinox

      console.log('🌍 EQUINOX COMPARISON (2024-09-22):');

      // Test multiple locations on equinox - sunrise/sunset should be close to 6:00/18:00
      const locations = [
        {lat: 0, lng: 0, tz: 0, name: 'Equator'},
        {lat: 40.7128, lng: -74.0060, tz: -4, name: 'New York'},
        {lat: 51.5074, lng: -0.1278, tz: 0, name: 'London'},
        {lat: -33.8688, lng: 151.2093, tz: 11, name: 'Sydney'},
      ];

      locations.forEach(loc => {
        const result = calculateDaylight(loc.lat, loc.lng, equinoxDate, loc.tz);

        const [sunriseHour] = result.sunrise.split(':').map(Number);
        const [sunsetHour] = result.sunset.split(':').map(Number);
        const dayLength = sunsetHour - sunriseHour;

        console.log(`   ${loc.name}: Sunrise ${result.sunrise}, Sunset ${result.sunset} (${dayLength}h)`);

        expect(result.polar_night).toBe(false);

        // On equinox, day length should be approximately 12 hours everywhere
        // Allow some variance due to atmospheric refraction and calculation approximations
        expect(dayLength).toBeGreaterThan(10);
        expect(dayLength).toBeLessThan(14);
      });
    });

    it('should handle timezone correctly', () => {
      // Same location, different timezones
      const lat = 40.7128;
      const lng = -74.0060;
      const date = '2024-06-21';

      const utc = calculateDaylight(lat, lng, date, 0);
      const est = calculateDaylight(lat, lng, date, -4);

      console.log('🕐 TIMEZONE COMPARISON (NYC 2024-06-21):');
      console.log(`   UTC (GMT+0): Sunrise ${utc.sunrise}, Sunset ${utc.sunset}`);
      console.log(`   EDT (GMT-4): Sunrise ${est.sunrise}, Sunset ${est.sunset}`);

      // Times should be different by exactly 4 hours
      const utcSunrise = timeToMinutes(utc.sunrise);
      const estSunrise = timeToMinutes(est.sunrise);
      const timeDiff = Math.abs((utcSunrise - estSunrise) - 240);

      console.log(`   Time difference: ${Math.abs(utcSunrise - estSunrise)}min (expected: 240min, diff: ${timeDiff}min)`);

      expect(timeDiff).toBeLessThan(2); // 4 hours = 240 minutes
    });
  });

  describe('Edge cases and validation', () => {
    it('should handle extreme latitudes gracefully', () => {
      const northPole = calculateDaylight(90, 0, '2024-06-21', 0);
      const southPole = calculateDaylight(-90, 0, '2024-06-21', 0);

      // North pole should have polar day in June
      expect(northPole.polar_night).toBe(false);
      expect(northPole.sunrise).toBe('00:00');
      expect(northPole.sunset).toBe('23:59');

      // South pole should have polar night in June
      expect(southPole.polar_night).toBe(true);
      expect(southPole.sunrise).toBe('--:--');
      expect(southPole.sunset).toBe('--:--');
    });

    it.skip('should handle date line crossing', () => {
      // Test locations near international date line
      const result = calculateDaylight(
        64.0685, // Fairbanks, Alaska (close to date line)
        -147.7208,
        '2024-06-21',
        -8,
      );

      expect(result.polar_night).toBe(false);
      expect(result.sunrise).toMatch(/^\d{2}:\d{2}$/);
      expect(result.sunset).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should produce consistent results for same input', () => {
      const lat = 40.7128;
      const lng = -74.0060;
      const date = '2024-06-21';
      const tz = -4;

      const result1 = calculateDaylight(lat, lng, date, tz);
      const result2 = calculateDaylight(lat, lng, date, tz);

      expect(result1).toEqual(result2);
    });

    it('should handle leap year dates correctly', () => {
      // Test February 29, 2024 (leap year)
      const result = calculateDaylight(40.7128, -74.0060, '2024-02-29', -5);

      expect(result.polar_night).toBe(false);
      expect(result.sunrise).toMatch(/^\d{2}:\d{2}$/);
      expect(result.sunset).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle different coordinate precision', () => {
      // Test with high precision coordinates
      const result1 = calculateDaylight(40.712775, -74.005973, '2024-06-21', -4);
      const result2 = calculateDaylight(40.71, -74.01, '2024-06-21', -4);

      // Results should be very close but may not be identical due to precision
      expect(result1.polar_night).toBe(false);
      expect(result2.polar_night).toBe(false);
      expect(result1.sunrise).toMatch(/^\d{2}:\d{2}$/);
      expect(result2.sunrise).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should handle year boundary correctly', () => {
      // Test New Year's Day
      const result = calculateDaylight(40.7128, -74.0060, '2024-01-01', -5);

      expect(result.polar_night).toBe(false);
      expect(result.sunrise).toMatch(/^0[7-8]:[0-9]{2}$/); // Winter sunrise
      expect(result.sunset).toMatch(/^1[6-7]:[0-9]{2}$/); // Winter sunset
    });
  });
});

// Helper function to convert time string to minutes
function timeToMinutes(timeStr: string): number {
  if (timeStr === '--:--') return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
} 