<script setup lang="ts">
import {watchEffect} from 'vue';
import {useAppState} from '../composables/useAppState';

const {tripMonth, tripPlaces, tripDuration} = useAppState();

const defaultAppName = 'Travel Timeline';

watchEffect(() => {
  if (tripPlaces.value && tripMonth.value) {
    document.title = `${tripPlaces.value}, ${tripMonth.value} | ${defaultAppName}`
      .replaceAll('&thinsp;', '');
  } else {
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