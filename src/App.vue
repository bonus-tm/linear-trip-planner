<script setup lang="ts">
import LocationsTable from './components/LocationsTable.vue'
import StepsTable from './components/StepsTable.vue'
import DaylightDisplay from './components/DaylightDisplay.vue'
</script>

<template>
  <div class="app-container">
    <h1>Travel Itinerary Planner</h1>
    
    <LocationsTable />
    <StepsTable />
    <DaylightDisplay />
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

h1 {
  color: var(--color-text);
  margin-bottom: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
  transition: color 0.3s ease;
}
</style>
