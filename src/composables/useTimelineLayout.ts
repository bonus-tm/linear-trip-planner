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
import {formatDuration, getDatesBetween, getDayBeginTimestamp} from '../utils/datetime.ts';
import {convertPositionToStyle} from '../utils/style.ts';

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
        let daylightStyle: CssStyle = {};
        if (location?.daylight[date]) {
          daylightStyle = getDaylightStyle(location?.daylight[date], DAY_WIDTH, LOCATION_HEIGHT - 2);
        }

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
          daylight: location?.daylight[date],
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

  // Calculate timeline start timestamp (start of first day at UTC midnight)
  // const timelineStartTimestamp = computed(() => {
  //   if (timelineRange.value.days.length === 0) return 0;
  //   return timelineRange.value.days[0].utcTimestamp;
  // });

  // Convert timestamp to pixel position
  // const timestampToPosition = (timestamp: number): number => {
  //   const daysSinceStart = (timestamp - timelineStartTimestamp.value) / (24 * 60 * 60 * 1000);
  //   return LOCATION_LABEL_WIDTH + (daysSinceStart * DAY_WIDTH);
  // };

  // Location labels
  // const locationLabels = computed((): TimelineLocationLabel[] => {
  //   return usedLocations.value.map((locationName, index) => ({
  //     name: locationName,
  //     timezone: locations.value[locationName].timezone,
  //     position: {
  //       left: 0,
  //       top: index * LOCATION_HEIGHT,
  //       width: LOCATION_LABEL_WIDTH,
  //       height: LOCATION_HEIGHT,
  //     },
  //   }));
  // });

  // Date labels
  // const dateLabels = computed((): TimelineDateLabel[] => {
  //   return timelineRange.value.days.map((day, index) => ({
  //     date: day.date,
  //     displayDate: day.displayDate,
  //     position: {
  //       left: LOCATION_LABEL_WIDTH + (index * DAY_WIDTH),
  //       top: usedLocations.value.length * LOCATION_HEIGHT,
  //       width: DAY_WIDTH,
  //       height: DATE_LABEL_HEIGHT,
  //     },
  //   }));
  // });
  //
  // // Day cells
  // const dayCells = computed((): TimelineDayCell[] => {
  //   const cells: TimelineDayCell[] = [];
  //
  //   usedLocations.value.forEach((locationName, locationIndex) => {
  //     timelineRange.value.days.forEach((day, dayIndex) => {
  //       const location = locations.value[locationName];
  //       const daylight = location?.daylight[day.date];
  //
  //       // Check if there's a stay on this day
  //       const hasStay = steps.value.some(step => {
  //         if (step.type !== 'stay') return false;
  //         if (step.startLocation !== locationName) return false;
  //
  //         const timezone = getLocationTimezone(step.startLocation, locations.value);
  //         const stepStartUtc = getUtcDateString(step.startDate, timezone);
  //         const stepEndUtc = getUtcDateString(step.finishDate, timezone);
  //
  //         return day.date >= stepStartUtc && day.date <= stepEndUtc;
  //       });
  //
  //       // Check if there's a move involving this location on this day
  //       const hasMove = steps.value.some(step => {
  //         if (step.type !== 'move') return false;
  //
  //         const startTimezone = getLocationTimezone(step.startLocation, locations.value);
  //         const endTimezone = step.finishLocation
  //           ? getLocationTimezone(step.finishLocation, locations.value)
  //           : startTimezone;
  //
  //         const stepStartUtc = getUtcDateString(step.startDate, startTimezone);
  //         const stepEndUtc = getUtcDateString(step.finishDate, endTimezone);
  //
  //         return (step.startLocation === locationName && day.date >= stepStartUtc && day.date <= stepEndUtc) ||
  //           (step.finishLocation === locationName && day.date >= stepStartUtc && day.date <= stepEndUtc);
  //       });
  //
  //       const isEmpty = !hasStay && !hasMove;
  //
  //       cells.push({
  //         id: `cell-${locationName}-${day.date}`,
  //         date: day.date,
  //         locationName,
  //         hasStay,
  //         hasMove,
  //         daylight,
  //         isEmpty,
  //         position: {
  //           left: LOCATION_LABEL_WIDTH + (dayIndex * DAY_WIDTH),
  //           top: locationIndex * LOCATION_HEIGHT,
  //           width: DAY_WIDTH,
  //           height: LOCATION_HEIGHT,
  //         },
  //       });
  //     });
  //   });
  //
  //   return cells;
  // });

  // Move rectangles
  // const moveRectangles = computed((): TimelineMoveRectangle[] => {
  //   const rectangles: TimelineMoveRectangle[] = [];
  //
  //   steps.value.forEach(step => {
  //     if (step.type !== 'move' || !step.finishLocation) return;
  //
  //     const startLocationIndex = usedLocations.value.indexOf(step.startLocation);
  //     const endLocationIndex = usedLocations.value.indexOf(step.finishLocation);
  //
  //     if (startLocationIndex === -1 || endLocationIndex === -1) return;
  //
  //     // Convert local times to UTC for positioning
  //     const startTimezone = getLocationTimezone(step.startLocation, locations.value);
  //     const endTimezone = getLocationTimezone(step.finishLocation, locations.value);
  //
  //     const startUtc = localTimeToUtc(step.startDate, startTimezone);
  //     const endUtc = localTimeToUtc(step.finishDate, endTimezone);
  //
  //     // Calculate positions
  //     const startX = timestampToPosition(startUtc.getTime());
  //     const endX = timestampToPosition(endUtc.getTime());
  //
  //     const startY = startLocationIndex * LOCATION_HEIGHT;
  //     const endY = endLocationIndex * LOCATION_HEIGHT + LOCATION_HEIGHT;
  //
  //     const left = Math.min(startX, endX);
  //     const width = Math.abs(endX - startX);
  //     const top = Math.min(startY, endY);
  //     const height = Math.abs(endY - startY);
  //
  //     rectangles.push({
  //       id: step.id,
  //       startLocationIndex,
  //       endLocationIndex,
  //       startTimestamp: startUtc.getTime(),
  //       endTimestamp: endUtc.getTime(),
  //       step,
  //       position: {
  //         left,
  //         top,
  //         width,
  //         height,
  //       },
  //     });
  //   });
  //
  //   return rectangles;
  // });

  // Time labels for moves
  // const timeLabels = computed((): TimelineTimeLabel[] => {
  //   const labels: TimelineTimeLabel[] = [];
  //
  //   moveRectangles.value.forEach(move => {
  //     // Get the original local times for display
  //     const step = move.step;
  //     const startDate = new Date(step.startDate);
  //     const endDate = new Date(step.finishDate);
  //
  //     const startLocalTime = startDate.getHours() * 60 + startDate.getMinutes();
  //     const endLocalTime = endDate.getHours() * 60 + endDate.getMinutes();
  //
  //     const formatTime = (minutes: number) => {
  //       const hours = Math.floor(minutes / 60);
  //       const mins = minutes % 60;
  //       return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  //     };
  //
  //     // Position labels vertically centered on the move rectangle
  //     const rectangleCenterY = move.position.top + (move.position.height / 2);
  //
  //     labels.push({
  //       id: `${move.id}-start`,
  //       time: formatTime(startLocalTime),
  //       position: {
  //         left: move.position.left - 10,
  //         top: rectangleCenterY - 10,
  //       },
  //       type: 'start',
  //     });
  //
  //     labels.push({
  //       id: `${move.id}-end`,
  //       time: formatTime(endLocalTime),
  //       position: {
  //         left: move.position.left + move.position.width + 10,
  //         top: rectangleCenterY - 10,
  //       },
  //       type: 'end',
  //     });
  //   });
  //
  //   return labels;
  // });

  // Main layout computed property
  // const layout = computed((): TimelineLayout => {
  //   // const totalDays = timelineRange.value.days.length;
  //   const totalLocations = usedLocations.value.length;
  //
  //   return {
  //     // width: LOCATION_LABEL_WIDTH + (totalDays * DAY_WIDTH),
  //     height: (totalLocations * LOCATION_HEIGHT) + DATE_LABEL_HEIGHT,
  //     // days: timelineRange.value.days,
  //     // dayCells: dayCells.value,
  //     // moveRectangles: moveRectangles.value,
  //     locationLabels: locationLabels.value,
  //     // dateLabels: dateLabels.value,
  //     // timeLabels: timeLabels.value,
  //     // timelineStart: timelineStartTimestamp.value,
  //     // timelineEnd: timelineStartTimestamp.value + (totalDays * 24 * 60 * 60 * 1000),
  //   };
  // });

  return {
    layout,
    // containerRef,
  };
} 