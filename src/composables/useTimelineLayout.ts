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
import {formatDuration, getDatesBetween, getDayBeginTimestamp} from '../utils/datetime';
import {convertPositionToStyle} from '../utils/style';
import {calculateDaylight} from '../utils/daylight.ts';

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

  // Get unique locations used in steps
  const usedLocations = computed(() => {
    const locationSet = new Set<string>();

    steps.value.forEach(step => {
      locationSet.add(step.startLocation);
      if (step.finishLocation) {
        locationSet.add(step.finishLocation);
      }
    });

    return Array.from(locationSet).filter(name => locations.value[name]);
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
    if (earliestStep) {
      const tz = locations.value[earliestStep.startLocation].timezone;
      if (new Date(earliestStep.startDate).getHours() < 12) {
        minTimestamp -= DAY_24_HRS;
      }
      minTimestamp = getDayBeginTimestamp(minTimestamp, tz);
    }
    if (latestStep) {
      const tz = locations.value[latestStep.finishLocation || latestStep.startLocation].timezone;
      if (new Date(latestStep.startDate).getHours() >= 12) {
        maxTimestamp += DAY_24_HRS;
      }
      maxTimestamp = getDayBeginTimestamp(maxTimestamp, tz) + DAY_24_HRS;
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
    usedLocations.value.forEach((locationName, locationIndex) => {
      const location = locations.value[locationName];
      const locationTop = LAYOUT_PADDING_Y + (locationIndex * (LOCATION_HEIGHT + LOCATIONS_GAP)) - 16;
      const labelPosition: Position = {
        top: locationTop,
        left: 0,
        // width: LOCATION_LABEL_WIDTH,
        // height: LOCATION_HEIGHT + LOCATIONS_GAP,
      };
      const locationTimeline: TimelineLocation = {
        name: locationName,
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
          if (step.startLocation !== locationName) return false;

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

          const sameStartLocation = step.startLocation === locationName;
          const sameFinishLocation = step.finishLocation === locationName;

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
          id: `cell-${locationName}-${date}`,
          timestamp: dayBeginTimestamp,
          date,
          label: new Date(date).toLocaleDateString('en', {day: 'numeric', month: 'short'}),
          hasStay,
          hasMove,
          isEmpty,
          position,
          style: convertPositionToStyle(position),
          daylight,
          daylightStyle,
        });
      });

      locationTimelines[locationName] = locationTimeline;
      if (locationTop > layoutHeight) {
        layoutHeight = locationTop + LOCATION_HEIGHT + LAYOUT_PADDING_Y;
      }
    });

    // Iterate moves
    const moves: MoveBlock[] = [];
    steps.value.forEach(step => {
      if (step.type !== 'move' || !step.finishLocation) return;

      const startLocationTop = locationTimelines[step.startLocation].top;
      const finishLocationTop = locationTimelines[step.finishLocation].top;

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
            text: formatDuration(step.startTimestamp, step.finishTimestamp),
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