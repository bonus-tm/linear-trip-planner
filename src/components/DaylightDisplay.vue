<template>
  <div class="daylight-display">
    <h2>Daylight Information</h2>
    
    <div v-if="Object.keys(daylightData).length === 0" class="no-data">
      <p>No daylight data available. Add locations and steps to see sunrise/sunset times.</p>
    </div>
    
    <div v-else class="daylight-grid">
      <Card v-for="(locationData, locationName) in daylightData" :key="locationName" class="location-card">
        <template #header>
          <div class="card-header">
            <h3>{{ locationName }}</h3>
            <span class="timezone">UTC{{ locations[locationName].timezone >= 0 ? '+' : '' }}{{ locations[locationName].timezone }}</span>
          </div>
        </template>
        
        <template #content>
          <div v-if="Object.keys(locationData).length === 0" class="no-dates">
            No dates assigned to this location
          </div>
          
          <div v-else class="daylight-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Sunrise</th>
                  <th>Sunset</th>
                  <th>Daylight Hours</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(daylight, date) in locationData" :key="date">
                  <td>{{ formatDate(date) }}</td>
                  <td>
                    <span v-if="daylight.polar_night" class="polar-night">Polar Night</span>
                    <span v-else>{{ daylight.sunrise }}</span>
                  </td>
                  <td>
                    <span v-if="daylight.polar_night" class="polar-night">Polar Night</span>
                    <span v-else>{{ daylight.sunset }}</span>
                  </td>
                  <td>{{ calculateDaylightHours(daylight) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAppState } from '../composables/useAppState'
import Card from 'primevue/card'
import type { DaylightInfo } from '../types'

const { locations, steps } = useAppState()

// Aggregate daylight data by location
const daylightData = computed(() => {
  const result: Record<string, Record<string, DaylightInfo>> = {}
  
  // Get locations that are actually used in steps
  const usedLocations = new Set<string>()
  steps.value.forEach(step => {
    usedLocations.add(step.startLocation)
    if (step.finishLocation) {
      usedLocations.add(step.finishLocation)
    }
  })
  
  // Collect daylight data for used locations
  usedLocations.forEach(locationName => {
    const location = locations.value[locationName]
    if (location && Object.keys(location.daylight).length > 0) {
      // Sort dates
      const sortedDaylight: Record<string, DaylightInfo> = {}
      Object.keys(location.daylight)
        .sort()
        .forEach(date => {
          sortedDaylight[date] = location.daylight[date]
        })
      
      result[locationName] = sortedDaylight
    }
  })
  
  return result
})

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const calculateDaylightHours = (daylight: DaylightInfo) => {
  if (daylight.polar_night) return '0h 0m'
  
  if (daylight.sunrise === '00:00' && daylight.sunset === '23:59') {
    return '24h 0m'
  }
  
  const [sunriseHour, sunriseMin] = daylight.sunrise.split(':').map(Number)
  const [sunsetHour, sunsetMin] = daylight.sunset.split(':').map(Number)
  
  const sunriseMinutes = sunriseHour * 60 + sunriseMin
  const sunsetMinutes = sunsetHour * 60 + sunsetMin
  
  const daylightMinutes = sunsetMinutes - sunriseMinutes
  const hours = Math.floor(daylightMinutes / 60)
  const minutes = daylightMinutes % 60
  
  return `${hours}h ${minutes}m`
}
</script>

<style scoped>
.daylight-display {
  margin-top: 2rem;
}

.no-data {
  text-align: center;
  padding: 2rem;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #6c757d;
}

.daylight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.location-card {
  background-color: #fff;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
  font-size: 1.25rem;
}

.timezone {
  color: #6c757d;
  font-size: 0.875rem;
}

.no-dates {
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 1rem;
}

.daylight-table {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th {
  text-align: left;
  padding: 0.5rem;
  border-bottom: 2px solid #dee2e6;
  font-weight: 600;
}

td {
  padding: 0.5rem;
  border-bottom: 1px solid #f0f0f0;
}

tr:hover {
  background-color: #f8f9fa;
}

.polar-night {
  color: #dc3545;
  font-style: italic;
}
</style> 