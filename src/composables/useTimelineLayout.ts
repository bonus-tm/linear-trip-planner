import {computed, ref, type Ref, type ShallowRef, watch, watchEffect} from 'vue';
import {useLocalStorage, useThrottleFn} from '@vueuse/core';
import type {
  CssStyle,
  DaylightInfo,
  LocationsMap,
  MoveBlock,
  Position,
  StepsList,
  TimelineLayout,
  TimelineLocation,
  ZoomLevel,
} from '../types';
import {formatDurationTime, getDatesBetween, getDayBeginTimestamp, isWeekendDay} from '../utils/datetime';
import {convertPositionToStyle} from '../utils/style';
import {calculateDaylight} from '../utils/daylight';

// Constants
const LAYOUT_PADDING_Y = 30;
const LOCATION_HEIGHT = 20;
const LOCATIONS_GAP = 50;
const DAY_24_HRS = 24 * 60 * 60 * 1000;
const MOVE_TIME_LABEL_MARGIN = 2;

const widthsOfDay = [20, 30, 40, 60, 90, 120, 180, 240];
const dayMinWidth = widthsOfDay[0];
const dayMaxWidth = widthsOfDay.at(-1) ?? 240;
const defaultZoomLevel = 5;

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
  container: ShallowRef<HTMLDivElement | null>,
) {
  const dayWidth = ref(120);
  const zoomLevel = useLocalStorage<ZoomLevel>('trip-planner-zoom', 'fit');
  const isMaxZoom = computed(() => zoomLevel.value === widthsOfDay.length - 1);
  const isMinZoom = computed(() => zoomLevel.value === 0);
  const isFitZoom = computed(() => zoomLevel.value === 'fit');

  const zoomIn = () => {
    const i = widthsOfDay.findIndex((w) => w > dayWidth.value);
    zoomLevel.value = i !== -1 ? i : widthsOfDay.length - 1;
  };
  const zoomOut = () => {
    const i = widthsOfDay.findLastIndex((w) => w < dayWidth.value);
    zoomLevel.value = i !== -1 ? i : 0;
  };
  const zoomToFit = () => {
    zoomLevel.value = 'fit';
    const daysCount = Math.round(
      (layout.value.maxTimestamp - layout.value.minTimestamp) / DAY_24_HRS,
    );
    if (container.value) {
      const containerWidth = container.value.getBoundingClientRect().width;
      const labelWidth = getLocationsLabelWidth();
      let width = Math.trunc((containerWidth - labelWidth) / daysCount);
      if (width > dayMaxWidth) {
        width = dayMaxWidth;
      } else if (width < dayMinWidth) {
        width = dayMinWidth;
      }
      dayWidth.value = width;
    }
  };

  const resizeObserver = new ResizeObserver(
    useThrottleFn(zoomToFit, 100),
  );
  watchEffect(() => {
    if (container.value) {
      if (zoomLevel.value === 'fit') {
        resizeObserver.observe(container.value);
      } else {
        resizeObserver.unobserve(container.value);
        zoomLevel.value = zoomLevel.value >= widthsOfDay.length
          ? widthsOfDay.length - 1
          : (zoomLevel.value < 0
            ? 0
            : zoomLevel.value);
        if (!widthsOfDay[zoomLevel.value]) {
          zoomLevel.value = defaultZoomLevel;
        }
        dayWidth.value = widthsOfDay[zoomLevel.value];
      }
    }
  });

  const getLocationsLabelWidth = () => {
    let width = 0;
    if (!container.value) {
      return 0;
    }
    container.value.querySelectorAll('.location-name').forEach((el) => {
      const elWidth = el.getBoundingClientRect().width;
      if (elWidth > width) {
        width = elWidth;
      }
    });
    return width;
  };

  // Get unique location IDs used in steps
  const usedLocationIds = computed(() => {
    const locationIdSet = new Set<string>();

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
  const minTimestamp = computed(() => {
    let min = Number.MAX_SAFE_INTEGER;
    let earliestStep = steps.value.at(0);
    steps.value.forEach(step => {
      if (step.startTimestamp < min) {
        earliestStep = step;
        min = step.startTimestamp;
      }
    });

    if (earliestStep?.startLocationId) {
      const tz = locations.value[earliestStep.startLocationId].timezone;
      if (earliestStep.type === 'move' && new Date(earliestStep.startDate).getHours() < 12) {
        min -= DAY_24_HRS;
      }
      min = getDayBeginTimestamp(min, tz);
    }

    return min;
  });
  const maxTimestamp = computed(() => {
    let max = Number.MIN_SAFE_INTEGER;
    let latestStep = steps.value.at(-1);
    steps.value.forEach(step => {
      if (step.finishTimestamp > max) {
        latestStep = step;
        max = step.finishTimestamp;
      }
    });

    if (latestStep?.finishLocationId || latestStep?.startLocationId) {
      const locationId = latestStep.finishLocationId || latestStep.startLocationId;
      const tz = locations.value[locationId].timezone;
      max = getDayBeginTimestamp(max, tz) + DAY_24_HRS - 1;
      if (latestStep.type === 'move' && new Date(latestStep.finishDate).getHours() >= 12) {
        max += DAY_24_HRS;
      }
    }
    return max;
  });

  watch([minTimestamp, maxTimestamp], () => {
    if (zoomLevel.value === 'fit') {
      zoomToFit();
    }
  });

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
      const dates = getDatesBetween(minTimestamp.value, maxTimestamp.value, location.timezone);

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
        const labelWidth = getLocationsLabelWidth();

        const position: Position = {
          left: labelWidth + ((dayBeginTimestamp - minTimestamp.value) / (DAY_24_HRS / dayWidth.value)),
          top: locationTop,
          width: dayWidth.value,
          height: LOCATION_HEIGHT - 2,
        };
        const daylight = calculateDaylight(
          location.coordinates.lat,
          location.coordinates.lng,
          date,
          location.timezone,
        );
        const daylightStyle = getDaylightStyle(daylight, dayWidth.value, LOCATION_HEIGHT - 2);

        locationTimeline.days.push({
          id: `cell-${locationId}-${date}`,
          timestamp: dayBeginTimestamp,
          date,
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

      const labelWidth = getLocationsLabelWidth();

      const position: Position = {
        left: labelWidth + ((step.startTimestamp - minTimestamp.value) / (DAY_24_HRS / dayWidth.value)),
        top: Math.min(startLocationTop, finishLocationTop),
        width: (step.finishTimestamp - step.startTimestamp) / (DAY_24_HRS / dayWidth.value),
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
      minTimestamp: minTimestamp.value,
      maxTimestamp: maxTimestamp.value,
      width: Math.round((maxTimestamp.value - minTimestamp.value) / (DAY_24_HRS / dayWidth.value)),
      height: layoutHeight,
      locations: locationTimelines,
      moves,
    };
  });

  return {
    layout,
    dayWidth,
    isMinZoom,
    isMaxZoom,
    isFitZoom,
    zoomIn,
    zoomOut,
    zoomToFit,
  };
} 