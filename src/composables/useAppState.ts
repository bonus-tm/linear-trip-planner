import { useLocalStorage, watchDebounced } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import type { LocationsMap, StepsList } from '../types'
import { calculateDaylightForRange } from '../utils/daylight'

export function useAppState() {
  // Persisted state using localStorage
  const locations = useLocalStorage<LocationsMap>('trip-planner-locations', {})
  const steps = useLocalStorage<StepsList>('trip-planner-steps', [])
  
  // Loading states
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  
  // Location operations
  const addLocation = (location: Omit<LocationsMap[string], 'daylight'>) => {
    if (locations.value[location.name]) {
      error.value = 'Location with this name already exists'
      return false
    }
    
    locations.value[location.name] = {
      ...location,
      daylight: {}
    }
    error.value = null
    return true
  }
  
  const updateLocation = (locationId: string, updatedLocation: Omit<LocationsMap[string], 'daylight'>) => {
    console.log('update location', locationId, updatedLocation)
    // Since location names are now immutable IDs, we don't need to handle name changes
    if (!locations.value[locationId]) {
      error.value = 'Location not found'
      return false
    }
    
    locations.value[locationId] = {
      ...updatedLocation,
      daylight: locations.value[locationId]?.daylight || {}
    }
    
    error.value = null
    return true
  }
  
  const deleteLocation = (name: string) => {
    // Check if location is used in any step
    const isUsed = steps.value.some(step => 
      step.startLocation === name || step.finishLocation === name
    )
    
    if (isUsed) {
      error.value = 'Cannot delete location that is used in steps'
      return false
    }
    
    delete locations.value[name]
    error.value = null
    return true
  }
  
  // Step operations
  const addStep = (step: Omit<StepsList[0], 'id'>) => {
    const newStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }
    
    steps.value.push(newStep)
    error.value = null
    return true
  }
  
  const updateStep = (id: string, updatedStep: Partial<StepsList[0]>) => {
    const index = steps.value.findIndex(s => s.id === id)
    if (index === -1) {
      error.value = 'Step not found'
      return false
    }
    
    steps.value[index] = {
      ...steps.value[index],
      ...updatedStep
    }
    
    error.value = null
    return true
  }
  
  const deleteStep = (id: string) => {
    steps.value = steps.value.filter(s => s.id !== id)
    error.value = null
    return true
  }
  
  // Helper function to convert local time to UTC for comparison
  const localTimeToUtc = (dateTimeStr: string, timezoneOffset: number): Date => {
    const localDate = new Date(dateTimeStr)
    return new Date(localDate.getTime() - (timezoneOffset * 60 * 60 * 1000))
  }

  // Computed values
  const locationNames = computed(() => Object.keys(locations.value))
  const sortedSteps = computed(() => 
    [...steps.value].sort((a, b) => {
      // Convert start dates to UTC for proper sorting
      const aTimezone = locations.value[a.startLocation]?.timezone || 0
      const bTimezone = locations.value[b.startLocation]?.timezone || 0
      
      const aUtc = localTimeToUtc(a.startDate, aTimezone)
      const bUtc = localTimeToUtc(b.startDate, bTimezone)
      
      return aUtc.getTime() - bUtc.getTime()
    })
  )
  
  // Daylight calculation function
  const updateDaylightForLocation = (locationName: string) => {
    const location = locations.value[locationName]
    if (!location) return
    
    // Find all date ranges where this location is used
    const dateRanges = new Set<string>()
    
    steps.value.forEach(step => {
      if (step.startLocation === locationName || step.finishLocation === locationName) {
        // For timezone-aware date calculation, we need to consider:
        // - Start location timezone for start date
        // - End location timezone for end date (moves) or start location timezone (stays)
        let startDateStr: string, finishDateStr: string
        
        if (step.startLocation === locationName) {
          // This location is the start location
          const startTimezone = location.timezone
          const startUtc = localTimeToUtc(step.startDate, startTimezone)
          startDateStr = startUtc.toISOString().split('T')[0]
          
          if (step.type === 'stay') {
            // For stays, end is also in the same timezone
            const finishUtc = localTimeToUtc(step.finishDate, startTimezone)
            finishDateStr = finishUtc.toISOString().split('T')[0]
          } else {
            // For moves, end might be in different timezone, but we use the date range
            const finishTimezone = step.finishLocation ? (locations.value[step.finishLocation]?.timezone || 0) : startTimezone
            const finishUtc = localTimeToUtc(step.finishDate, finishTimezone)
            finishDateStr = finishUtc.toISOString().split('T')[0]
          }
        } else {
          // This location is the finish location (only for moves)
          const endTimezone = location.timezone
          const startTimezone = locations.value[step.startLocation]?.timezone || 0
          
          const startUtc = localTimeToUtc(step.startDate, startTimezone)
          const finishUtc = localTimeToUtc(step.finishDate, endTimezone)
          
          startDateStr = startUtc.toISOString().split('T')[0]
          finishDateStr = finishUtc.toISOString().split('T')[0]
        }
        
        // Add all dates in range (in UTC)
        const start = new Date(startDateStr + 'T00:00:00Z')
        const end = new Date(finishDateStr + 'T00:00:00Z')
        const current = new Date(start)
        
        while (current <= end) {
          dateRanges.add(current.toISOString().split('T')[0])
          current.setUTCDate(current.getUTCDate() + 1)
        }
      }
    })
    
    // Calculate daylight for all dates
    const newDaylight: Record<string, any> = {}
    
    dateRanges.forEach(date => {
      const daylight = calculateDaylightForRange(
        location.coordinates.lat,
        location.coordinates.lng,
        date,
        date,
        location.timezone
      )
      Object.assign(newDaylight, daylight)
    })
    
    // Update location with new daylight data
    locations.value[locationName] = {
      ...location,
      daylight: newDaylight
    }
  }
  
  // Watch for changes and update daylight calculations
  watchDebounced(
    [locations, steps],
    () => {
      // Update daylight for all locations
      Object.keys(locations.value).forEach(locationName => {
        updateDaylightForLocation(locationName)
      })
    },
    { debounce: 500, deep: true }
  )
  
  // Clean up daylight data for unused dates
  const cleanupDaylightData = () => {
    Object.keys(locations.value).forEach(locationName => {
      const location = locations.value[locationName]
      const usedDates = new Set<string>()
      
      // Collect all dates where this location is used (timezone-aware)
      steps.value.forEach(step => {
        if (step.startLocation === locationName || step.finishLocation === locationName) {
          let startDateStr: string, finishDateStr: string
          
          if (step.startLocation === locationName) {
            const startTimezone = location.timezone
            const startUtc = localTimeToUtc(step.startDate, startTimezone)
            startDateStr = startUtc.toISOString().split('T')[0]
            
            if (step.type === 'stay') {
              const finishUtc = localTimeToUtc(step.finishDate, startTimezone)
              finishDateStr = finishUtc.toISOString().split('T')[0]
            } else {
              const finishTimezone = step.finishLocation ? (locations.value[step.finishLocation]?.timezone || 0) : startTimezone
              const finishUtc = localTimeToUtc(step.finishDate, finishTimezone)
              finishDateStr = finishUtc.toISOString().split('T')[0]
            }
          } else {
            const endTimezone = location.timezone
            const startTimezone = locations.value[step.startLocation]?.timezone || 0
            
            const startUtc = localTimeToUtc(step.startDate, startTimezone)
            const finishUtc = localTimeToUtc(step.finishDate, endTimezone)
            
            startDateStr = startUtc.toISOString().split('T')[0]
            finishDateStr = finishUtc.toISOString().split('T')[0]
          }
          
          const start = new Date(startDateStr + 'T00:00:00Z')
          const end = new Date(finishDateStr + 'T00:00:00Z')
          const current = new Date(start)
          
          while (current <= end) {
            usedDates.add(current.toISOString().split('T')[0])
            current.setUTCDate(current.getUTCDate() + 1)
          }
        }
      })
      
      // Remove daylight data for unused dates
      const newDaylight: Record<string, any> = {}
      Object.keys(location.daylight).forEach(date => {
        if (usedDates.has(date)) {
          newDaylight[date] = location.daylight[date]
        }
      })
      
      if (Object.keys(newDaylight).length !== Object.keys(location.daylight).length) {
        locations.value[locationName] = {
          ...location,
          daylight: newDaylight
        }
      }
    })
  }
  
  // Watch for step deletions to clean up daylight data
  watch(steps, (newSteps, oldSteps) => {
    if (oldSteps && newSteps.length < oldSteps.length) {
      cleanupDaylightData()
    }
  })
  
  return {
    // State
    locations,
    steps,
    isLoading,
    error,
    
    // Computed
    locationNames,
    sortedSteps,
    
    // Location operations
    addLocation,
    updateLocation,
    deleteLocation,
    
    // Step operations
    addStep,
    updateStep,
    deleteStep
  }
} 