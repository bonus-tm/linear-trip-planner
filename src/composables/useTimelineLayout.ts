import {computed, type Ref} from 'vue';
import type {
  CssStyle,
  DaylightInfo,
  LocationsMap,
  MoveBlock,
  Position,
  StepsList,
  TimelineLayout,
  TimelineLocation,
} from '../types';
import {formatDurationTime, getDatesBetween, getDayBeginTimestamp, isWeekendDay} from '../utils/datetime';
import {convertPositionToStyle} from '../utils/style';
import {calculateDaylight} from '../utils/daylight';

// Constants
const LAYOUT_PADDING_Y = 30;
const LOCATION_HEIGHT = 20;
const LOCATIONS_GAP = 50;
const LOCATION_LABEL_WIDTH = 200;
const DAY_24_HRS = 24 * 60 * 60 * 1000;
const DAY_WIDTH = 120;
const SCALE = DAY_24_HRS / DAY_WIDTH; // ms per px
const MOVE_TIME_LABEL_MARGIN = 2;

// Calculate daylight bar positioning within each cell
const getDaylightStyle = (daylight: DaylightInfo, cellWidth: number, cellHeight: number): CssStyle => {
  if (daylight.polar_night) {
    return {
      display: 'none',
    };
  }

  const [sunriseHour, sunriseMin] = daylight.sunrise.split(':').map(Number);
  const [sunsetHour, sunsetMin] = daylight.sunset.split(':').map(Number);

  const sunriseMinutes = sunriseHour * 60 + sunriseMin;
  const sunsetMinutes = sunsetHour * 60 + sunsetMin;

  const startPercent = (sunriseMinutes / (24 * 60)) * 100;
  const widthPercent = ((sunsetMinutes - sunriseMinutes) / (24 * 60)) * 100;

  const leftPx = (startPercent / 100) * cellWidth;
  const widthPx = (widthPercent / 100) * cellWidth;

  return {
    top: '0',
    left: `${leftPx}px`,
    width: `${widthPx}px`,
    height: `${cellHeight}px`,
  };
};

export function useTimelineLayout(
  locations: Ref<LocationsMap>,
  steps: Ref<StepsList>,
) {
  // const containerRef = ref<HTMLElement>();

  // Get unique location IDs used in steps
  const usedLocationIds = computed(() => {
    const locationIdSet = new Set<number>();

    steps.value.forEach(step => {
      locationIdSet.add(step.startLocationId);
      if (step.finishLocationId) {
        locationIdSet.add(step.finishLocationId);
      }
    });

    return Array.from(locationIdSet).filter(id => locations.value[id]);
  });

  /**
   * Find the earliest and the latest timestamps of days in steps list
   */
  const getStepsBeginAndEnd = () => {
    let minTimestamp = Number.MAX_SAFE_INTEGER;
    let maxTimestamp = Number.MIN_SAFE_INTEGER;

    let earliestStep = steps.value.at(0);
    let latestStep = steps.value.at(-1);

    steps.value.forEach(step => {
      if (step.startTimestamp < minTimestamp) {
        earliestStep = step;
        minTimestamp = step.startTimestamp;
      }
      if (step.finishTimestamp > maxTimestamp) {
        latestStep = step;
        maxTimestamp = step.finishTimestamp;
      }
    });

    if (earliestStep?.startLocationId) {
      const tz = locations.value[earliestStep.startLocationId].timezone;
      if (earliestStep.type === 'move' && new Date(earliestStep.startDate).getHours() < 12) {
        minTimestamp -= DAY_24_HRS;
      }
      minTimestamp = getDayBeginTimestamp(minTimestamp, tz);
    }
    
    if (latestStep?.finishLocationId || latestStep?.startLocationId) {
      const locationId = latestStep.finishLocationId || latestStep.startLocationId;
      const tz = locations.value[locationId].timezone;
      maxTimestamp = getDayBeginTimestamp(maxTimestamp, tz) + DAY_24_HRS - 1;
      if (latestStep.type === 'move' && new Date(latestStep.finishDate).getHours() >= 12) {
        maxTimestamp += DAY_24_HRS;
      }
    }
    return [minTimestamp, maxTimestamp];
  };

  // Calculate the timeline date range from steps
  const layout = computed<TimelineLayout>(() => {
    if (steps.value.length === 0) {
      return {
        minTimestamp: 0,
        maxTimestamp: 0,
        width: 0,
        height: 0,
        locations: {},
        moves: [],
      };
    }

    const [minTimestamp, maxTimestamp] = getStepsBeginAndEnd();
    let layoutHeight = 0;

    const locationTimelines: Record<string, TimelineLocation> = {};
    // Iterate locations
    usedLocationIds.value.forEach((locationId, locationIndex) => {
      const location = locations.value[locationId];
      const locationTop = LAYOUT_PADDING_Y + (locationIndex * (LOCATION_HEIGHT + LOCATIONS_GAP)) - 16;
      const labelPosition: Position = {
        top: locationTop,
        left: 0,
      };
      const locationTimeline: TimelineLocation = {
        name: location.name,
        timezone: location.timezone,
        top: locationTop,
        label: {
          text: location.name,
          position: labelPosition,
          style: convertPositionToStyle(labelPosition),
        },
        days: [],
      };

      // all dates mentioned in all steps
      const dates = getDatesBetween(minTimestamp, maxTimestamp, location.timezone);

      // Fill location days
      dates.forEach(date => {
        const dayBeginTimestamp = getDayBeginTimestamp(date, location.timezone);
        const dayEndTimestamp = dayBeginTimestamp + DAY_24_HRS;

        // Check if there's a stay on this day
        const hasStay = steps.value.some((step) => {
          if (step.type !== 'stay') return false;
          if (step.startLocationId !== locationId) return false;

          const stepBeginsOnThatDay =
            step.startTimestamp >= dayBeginTimestamp &&
            step.startTimestamp <= dayEndTimestamp;
          const stepContinuesThatDay = dayBeginTimestamp > step.startTimestamp &&
            dayEndTimestamp <= step.finishTimestamp;
          const stepEndsOnThatDay =
            step.finishTimestamp >= dayBeginTimestamp &&
            step.finishTimestamp <= dayEndTimestamp;
          return stepBeginsOnThatDay || stepContinuesThatDay || stepEndsOnThatDay;
        });

        // Check if there's a move involving this location on this day
        const hasMove = steps.value.some((step) => {
          if (step.type !== 'move') return false;

          const sameStartLocation = step.startLocationId === locationId;
          const sameFinishLocation = step.finishLocationId === locationId;

          const stepBeginsOnThatDay =
            step.startTimestamp >= dayBeginTimestamp &&
            step.startTimestamp <= dayEndTimestamp;
          const stepEndsOnThatDay =
            step.finishTimestamp >= dayBeginTimestamp &&
            step.finishTimestamp <= dayEndTimestamp;

          return (stepBeginsOnThatDay || stepEndsOnThatDay) &&
            (sameStartLocation || sameFinishLocation);
        });

        const isEmpty = !hasStay && !hasMove;

        const position: Position = {
          left: LOCATION_LABEL_WIDTH + ((dayBeginTimestamp - minTimestamp) / SCALE),
          top: locationTop,
          width: DAY_WIDTH,
          height: LOCATION_HEIGHT - 2,
        };
        const daylight = calculateDaylight(
          location.coordinates.lat,
          location.coordinates.lng,
          date,
          location.timezone,
        );
        const daylightStyle = getDaylightStyle(daylight, DAY_WIDTH, LOCATION_HEIGHT - 2);

        locationTimeline.days.push({
          id: `cell-${locationId}-${date}`,
          timestamp: dayBeginTimestamp,
          date,
          label: new Date(date).toLocaleDateString('en', {day: 'numeric', month: 'short', weekday: 'short'}),
          hasStay,
          hasMove,
          isEmpty,
          isWeekend: isWeekendDay(date),
          position,
          style: convertPositionToStyle(position),
          daylight,
          daylightStyle,
        });
      });

      locationTimelines[location.name] = locationTimeline;
      if (locationTop > layoutHeight) {
        layoutHeight = locationTop + LOCATION_HEIGHT + LAYOUT_PADDING_Y;
      }
    });

    // Iterate moves
    const moves: MoveBlock[] = [];
    steps.value.forEach(step => {
      if (step.type !== 'move' || !step.finishLocationId) return;

      const startLocation = locations.value[step.startLocationId];
      const finishLocation = locations.value[step.finishLocationId];
      
      if (!startLocation || !finishLocation) return;

      const startLocationTop = locationTimelines[startLocation.name].top;
      const finishLocationTop = locationTimelines[finishLocation.name].top;

      const position: Position = {
        left: LOCATION_LABEL_WIDTH + ((step.startTimestamp - minTimestamp) / SCALE),
        top: Math.min(startLocationTop, finishLocationTop),
        width: (step.finishTimestamp - step.startTimestamp) / SCALE,
        height: Math.abs(finishLocationTop - startLocationTop) + LOCATION_HEIGHT,
      };
      const beginTimePosition: Position = {
        left: position.left - MOVE_TIME_LABEL_MARGIN,
        top: position.top + (position.height ?? 0) / 2,
      };
      const endTimePosition: Position = {
        left: position.left + (position.width ?? 0) + MOVE_TIME_LABEL_MARGIN,
        top: position.top + (position.height ?? 0) / 2,
      };
      const durationPosition: Position = {
        left: position.left + (position.width ?? 0) / 2,
        top: position.top + (position.height ?? 0) - LOCATION_HEIGHT,
      };
      moves.push({
        stepId: step.id,
        position,
        style: convertPositionToStyle(position),
        labels: {
          beginTime: {
            text: step.startDate.substring(11, 16),
            position: beginTimePosition,
            style: convertPositionToStyle(beginTimePosition),
          },
          endTime: {
            text: step.finishDate.substring(11, 16),
            position: endTimePosition,
            style: convertPositionToStyle(endTimePosition),
          },
          duration: {
            text: formatDurationTime(step.startTimestamp, step.finishTimestamp),
            position: durationPosition,
            style: convertPositionToStyle(durationPosition),
          },
        },
      });
    });

    return {
      minTimestamp,
      maxTimestamp,
      width: Math.round((maxTimestamp - minTimestamp) / SCALE),
      height: layoutHeight,
      locations: locationTimelines,
      moves,
    };
  });

  return {
    layout,
  };
} 