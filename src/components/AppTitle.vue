<script setup lang="ts">
import {computed, ref, watchEffect} from 'vue';
import {useAppState} from '../composables/useAppState';
import {DAY_24_HRS, formatDurationDays, formatISOWithTZ, getDayBeginTimestamp} from '../utils/datetime';

const {sortedSteps: steps, locations} = useAppState();

const defaultAppName = 'Travel Timeline';

const h1 = ref('');
const tripPlaces = ref('');
const tripMonth = ref('');
const tripDuration = computed(() => {
  if (steps.value.length === 0) {
    return '';
  }

  const startTimezone = locations.value[steps.value[0].startLocationId].timezone;
  let start = getDayBeginTimestamp(steps.value[0].startTimestamp, startTimezone);

  const finishLocationId = steps.value[steps.value.length - 1]?.finishLocationId;
  const finishTimezone = finishLocationId
    ? locations.value[finishLocationId].timezone
    : 0;
  let finish = getDayBeginTimestamp(steps.value[steps.value.length - 1].finishTimestamp, finishTimezone);
  finish += DAY_24_HRS;

  return steps.value.length > 0
    ? formatDurationDays(formatISOWithTZ(start, startTimezone), formatISOWithTZ(finish, finishTimezone))
    : '';
});

watchEffect(() => {
  const places = new Set();
  const months: Set<string> = new Set();

  const startLocationId = steps.value[0]?.startLocationId;
  if (startLocationId) {
    const startLocation = locations.value[startLocationId];
    if (startLocation) {
      places.add(startLocation.name);
    }
  }
  steps.value.forEach((step) => {
    months.add(step.startDate.substring(0, 7));
    months.add(step.finishDate.substring(0, 7));
    if (step.type === 'stay') {
      const stayLocation = locations.value[step.startLocationId];
      if (stayLocation) {
        places.add(stayLocation.name);
      }
    }
  });
  const finishLocationId = steps.value[steps.value.length - 1]?.finishLocationId;
  if (finishLocationId) {
    const finishLocation = locations.value[finishLocationId];
    if (finishLocation) {
      places.add(finishLocation.name);
    }
  }

  tripPlaces.value = Array.from(places).join('&thinsp;—&thinsp;');

  const monthsUniq: string[] = Array.from(months).sort();

  if (monthsUniq.length === 1) {
    const [y, m] = monthsUniq[0].split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    tripMonth.value = d.toLocaleDateString('en', {month: 'long', year: 'numeric'});
  } else if (monthsUniq.length > 1) {
    const first = monthsUniq[0];
    const last = monthsUniq[monthsUniq.length - 1];

    const [firstYear, firstMonth] = first.split('-');
    const [lastYear, lastMonth] = last.split('-');

    const firstDate = new Date(parseInt(firstYear), parseInt(firstMonth) - 1, 1);
    const lastDate = new Date(parseInt(lastYear), parseInt(lastMonth) - 1, 1);

    if (firstYear === lastYear) {
      // Same year: "January — March 2024"
      const firstMonthName = firstDate.toLocaleDateString('en', {month: 'long'});
      const lastMonthName = lastDate.toLocaleDateString('en', {month: 'long'});
      tripMonth.value = `${firstMonthName}&thinsp;—&thinsp;${lastMonthName} ${firstYear}`;
    } else {
      // Different years: "December 2023 — February 2024"
      const firstMonthYear = firstDate.toLocaleDateString('en', {month: 'long', year: 'numeric'});
      const lastMonthYear = lastDate.toLocaleDateString('en', {month: 'long', year: 'numeric'});
      tripMonth.value = `${firstMonthYear}&thinsp;—&thinsp;${lastMonthYear}`;
    }
  }

  if (tripPlaces.value && tripMonth.value) {
    h1.value = `${tripPlaces.value}, ${tripMonth.value}`;
    document.title = `${Array.from(places).join('—')}, ${tripMonth.value} | ${defaultAppName}`;
  } else {
    h1.value = defaultAppName;
    document.title = defaultAppName;
  }
});
</script>

<template>
  <template v-if="tripPlaces && tripMonth && tripDuration">
    <h1 v-html="tripPlaces"/>
    <h2>
      <span class="days">{{ tripDuration }} in </span>
      <span v-html="tripMonth"/>
    </h2>
  </template>
  <h1 v-else>
    {{ defaultAppName }}
  </h1>
</template>

<style scoped>
h1 {
  margin: 0;
  padding: 0.75rem 10rem 0;
  text-align: center;
  transition: color 0.3s ease;
  background-color: var(--color-surface);
}

h2 {
  margin: 0;
  padding: 0 10rem 0.75rem;
  transition: color 0.3s ease;
  color: var(--color-text-muted);
  background-color: var(--color-surface);
  text-align: center;
  font-weight: 400;
  font-size: 1rem;
  line-height: 1;

  .days {
    color: var(--color-text-light);
  }
}
</style>