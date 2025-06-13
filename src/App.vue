<script setup lang="ts">
import LocationsTable from './components/LocationsTable.vue';
import StepsTable from './components/StepsTable.vue';
import Timeline from './components/Timeline.vue';
</script>

<template>
  <div class="app-container">
    <h1>Travel Itinerary Planner</h1>

    <LocationsTable/>
    <StepsTable/>
    <Timeline/>
  </div>
</template>

<style scoped>
.app-container {
  margin: 0 auto;
  padding: 1rem;
}

h1 {
  margin: 0 0 1rem;
  text-align: center;
  transition: color 0.3s ease;
}
</style>
