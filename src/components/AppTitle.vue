<script setup lang="ts">
import {useAppState} from '../composables/useAppState.ts';
import {ref, watchEffect} from 'vue';

const {steps, locations} = useAppState();

const defaultAppName = 'Travel Timeline';
const tripPlaces = ref('');
const tripMonth = ref('');
const h1 = ref('');

watchEffect(() => {
  const places = new Set();
  const months: Set<string> = new Set();

  if (steps.value?.[0]?.type === 'move') {
    const startLocation = locations.value[steps.value[0].startLocationId];
    if (startLocation) {
      places.add(startLocation.name);
    }
  }

  steps.value.forEach((step) => {
    if (step.type === 'stay') {
      const stayLocation = locations.value[step.startLocationId];
      if (stayLocation) {
        places.add(stayLocation.name);
      }
    } else {
      months.add(step.finishDate.substring(0, 7));
    }
  });

  tripPlaces.value = Array.from(places).join('&thinsp;—&thinsp;');

  const monthsUniq: string[] = Array.from(months).sort();

  if (monthsUniq.length === 1) {
    const [y, m] = monthsUniq[0].split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    tripMonth.value = d.toLocaleDateString('en', {month: 'long', year: 'numeric'});
  } else {
    // TODO When trip spans several months, show the first and the last with mdash in between
    // TODO If same year then show it once, else "monF yearF — monL yearL"
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
  <h1 v-if="tripPlaces && tripMonth">
    <span class="places" v-html="tripPlaces"/>
    <span class="month">{{ tripMonth }}</span>
  </h1>
  <h1 v-else>
    {{ defaultAppName }}
  </h1>
</template>

<style scoped>
h1 {
  margin: 0;
  padding: 0.5em 10rem;
  text-align: center;
  transition: color 0.3s ease;
  background-color: var(--color-surface);

  .places {
    margin-inline-end: 0.33em;
  }

  .month {
    font-weight: 400;
    opacity: 0.7;
  }
}
</style>