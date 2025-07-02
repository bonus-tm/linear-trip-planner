<script setup lang="ts">
import {computed, watchEffect} from 'vue';
import {useAppState} from '../composables/useAppState';
import {convertYMRangeToMonths} from '../utils/datetime';

const {tripMonth, tripPlaces, tripDuration} = useAppState();

const defaultAppName = 'Travel Timeline';
const showDefault = computed(() => {
  return tripPlaces.value.length === 0 ||
    tripMonth.value.length === 0 ||
    tripDuration.value === 0
})

watchEffect(() => {
  let title = defaultAppName;
  if (tripPlaces.value.length > 0 && tripMonth.value.length > 0) {
    const months = convertYMRangeToMonths(tripMonth.value, {dash: '–', space: ''});
    title = `${tripPlaces.value.join('–')}, ${months} | ${defaultAppName}`;
  }
  document.title = title;
});
</script>

<template>
  <h1 v-if="showDefault">
    {{ defaultAppName }}
  </h1>
  <template v-else>
    <h1 v-html="tripPlaces.join('&thinsp;—&thinsp;')"/>
    <h2>
      <span class="days">{{ tripDuration }} {{ tripDuration > 1 ? 'days' : 'day'}} in </span>
      <span v-html="convertYMRangeToMonths(tripMonth, {space:'&thinsp;'})"/>
    </h2>
  </template>
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