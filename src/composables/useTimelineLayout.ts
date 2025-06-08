import { computed, ref, type Ref } from 'vue'
import type { LocationsMap, StepsList, Step, DaylightInfo } from '../types'

// Helper function to convert local time to UTC
function localTimeToUtc(dateTimeStr: string, timezoneOffset: number): Date {
  const localDate = new Date(dateTimeStr)
  // Convert timezone offset (hours) to milliseconds and subtract to get UTC
  return new Date(localDate.getTime() - (timezoneOffset * 60 * 60 * 1000))
}

// Helper function to get UTC date string from local datetime and timezone
function getUtcDateString(dateTimeStr: string, timezoneOffset: number): string {
  return localTimeToUtc(dateTimeStr, timezoneOffset).toISOString().split('T')[0]
}

// Helper function to get timezone offset for a location
function getLocationTimezone(locationName: string, locations: LocationsMap): number {
  return locations[locationName]?.timezone || 0
}

export interface DayCell {
  date: string
  displayDate: string
  locationName: string
  hasStay: boolean
  hasMove: boolean
  daylight?: DaylightInfo
  isEmpty: boolean
}

export interface MoveRectangle {
  id: string
  startLocationIndex: number
  endLocationIndex: number
  startDay: number
  endDay: number
  startTime: number // minutes from day start
  endTime: number // minutes from day start
  step: Step
}

export interface TimelineLayout {
  days: string[]
  locations: string[]
  dayLabels: string[]
  grid: DayCell[][]
  moves: MoveRectangle[]
  gridRows: number
  gridCols: number
}

export function useTimelineLayout(
  locations: Ref<LocationsMap>,
  steps: Ref<StepsList>
) {
  const containerRef = ref<HTMLElement>()
  
  // Calculate date range from steps
  const dateRange = computed(() => {
    if (steps.value.length === 0) return []
    
    const dates = new Set<string>()
    
    steps.value.forEach(step => {
      // Convert start and end times to UTC for proper date range calculation
      const startTimezone = getLocationTimezone(step.startLocation, locations.value)
      const endTimezone = step.type === 'move' && step.finishLocation 
        ? getLocationTimezone(step.finishLocation, locations.value)
        : startTimezone
      
      const startUtc = localTimeToUtc(step.startDate, startTimezone)
      const endUtc = localTimeToUtc(step.finishDate, endTimezone)
      
      // Add all UTC dates in the range
      const current = new Date(startUtc)
      current.setUTCHours(0, 0, 0, 0)
      
      const end = new Date(endUtc)
      end.setUTCHours(23, 59, 59, 999)
      
      while (current <= end) {
        dates.add(current.toISOString().split('T')[0])
        current.setUTCDate(current.getUTCDate() + 1)
      }
    })
    
    return Array.from(dates).sort().slice(0, 20) // Maximum 20 days
  })
  
  // Get unique locations used in steps
  const usedLocations = computed(() => {
    const locationSet = new Set<string>()
    
    steps.value.forEach(step => {
      locationSet.add(step.startLocation)
      if (step.finishLocation) {
        locationSet.add(step.finishLocation)
      }
    })
    
    return Array.from(locationSet).filter(name => locations.value[name])
  })
  
  // Create day labels
  const dayLabels = computed(() => {
    return dateRange.value.map(dateStr => {
      const date = new Date(dateStr + 'T00:00:00')
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })
    })
  })
  
  // Build grid structure
  const grid = computed(() => {
    const result: DayCell[][] = []
    
    usedLocations.value.forEach(locationName => {
      const locationRow: DayCell[] = []
      
      dateRange.value.forEach(dateStr => {
        const location = locations.value[locationName]
        const daylight = location?.daylight[dateStr]
        
        // Check if there's a stay on this day
        const hasStay = steps.value.some(step => {
          if (step.type !== 'stay') return false
          if (step.startLocation !== locationName) return false
          
          // For stays, both start and end are in the same location's timezone
          const timezone = getLocationTimezone(step.startLocation, locations.value)
          const stepStartUtc = getUtcDateString(step.startDate, timezone)
          const stepEndUtc = getUtcDateString(step.finishDate, timezone)
          
          return dateStr >= stepStartUtc && dateStr <= stepEndUtc
        })
        
        // Check if there's a move involving this location on this day
        const hasMove = steps.value.some(step => {
          if (step.type !== 'move') return false
          
          // For moves, start time is in start location's timezone, end time is in end location's timezone
          const startTimezone = getLocationTimezone(step.startLocation, locations.value)
          const endTimezone = step.finishLocation 
            ? getLocationTimezone(step.finishLocation, locations.value)
            : startTimezone
          
          const stepStartUtc = getUtcDateString(step.startDate, startTimezone)
          const stepEndUtc = getUtcDateString(step.finishDate, endTimezone)
          
          return (step.startLocation === locationName && dateStr >= stepStartUtc && dateStr <= stepEndUtc) ||
                 (step.finishLocation === locationName && dateStr >= stepStartUtc && dateStr <= stepEndUtc)
        })
        
        const isEmpty = !hasStay && !hasMove
        
        locationRow.push({
          date: dateStr,
          displayDate: new Date(dateStr + 'T00:00:00').toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          }),
          locationName,
          hasStay,
          hasMove,
          daylight,
          isEmpty
        })
      })
      
      result.push(locationRow)
    })
    
    return result
  })
  
  // Calculate move rectangles
  const moveRectangles = computed(() => {
    const result: MoveRectangle[] = []
    
    steps.value.forEach(step => {
      if (step.type !== 'move' || !step.finishLocation) return
      
      const startLocationIndex = usedLocations.value.indexOf(step.startLocation)
      const endLocationIndex = usedLocations.value.indexOf(step.finishLocation)
      
      if (startLocationIndex === -1 || endLocationIndex === -1) return
      
      // Convert local times to UTC for consistent positioning
      const startTimezone = getLocationTimezone(step.startLocation, locations.value)
      const endTimezone = step.finishLocation 
        ? getLocationTimezone(step.finishLocation, locations.value)
        : startTimezone
      
      const startUtc = localTimeToUtc(step.startDate, startTimezone)
      const endUtc = localTimeToUtc(step.finishDate, endTimezone)
      
      // Get UTC date strings for day positioning
      const startDateStr = startUtc.toISOString().split('T')[0]
      const endDateStr = endUtc.toISOString().split('T')[0]
      
      const startDay = dateRange.value.indexOf(startDateStr)
      const endDay = dateRange.value.indexOf(endDateStr)
      
      if (startDay === -1 || endDay === -1) return
      
      // Calculate time within day (minutes from UTC midnight)
      const startTime = startUtc.getUTCHours() * 60 + startUtc.getUTCMinutes()
      const endTime = endUtc.getUTCHours() * 60 + endUtc.getUTCMinutes()
      
      result.push({
        id: step.id,
        startLocationIndex,
        endLocationIndex,
        startDay,
        endDay,
        startTime,
        endTime,
        step
      })
    })
    
    return result
  })
  
  // Calculate daylight bar positioning within each cell
  const getDaylightStyle = (daylight: DaylightInfo) => {
    if (daylight.polar_night) {
      return {
        display: 'none'
      }
    }
    
    if (daylight.sunrise === '00:00' && daylight.sunset === '23:59') {
      return {
        left: '0%',
        width: '100%',
        height: '100%',
        top: '0%'
      }
    }
    
    const [sunriseHour, sunriseMin] = daylight.sunrise.split(':').map(Number)
    const [sunsetHour, sunsetMin] = daylight.sunset.split(':').map(Number)
    
    const sunriseMinutes = sunriseHour * 60 + sunriseMin
    const sunsetMinutes = sunsetHour * 60 + sunsetMin
    
    const startPercent = (sunriseMinutes / 1440) * 100
    const widthPercent = ((sunsetMinutes - sunriseMinutes) / 1440) * 100
    
    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`,
      height: '100%',
      top: '0%'
    }
  }
  
  // Calculate move rectangle positioning
  const getMoveRectangleStyle = (move: MoveRectangle, cellWidth: number, cellHeight: number) => {
    const locationLabelWidth = 200
    const rowHeight = 20
    const gapHeight = 50
    const totalRowHeight = rowHeight + gapHeight
    
    // Account for the fact that day columns start at column 2 (after location label column)
    const startTimeX = locationLabelWidth + move.startDay * cellWidth + (move.startTime / 1440) * cellWidth
    const endTimeX = locationLabelWidth + move.endDay * cellWidth + (move.endTime / 1440) * cellWidth
    
    const startLocationY = move.startLocationIndex * totalRowHeight
    const endLocationY = move.endLocationIndex * totalRowHeight + rowHeight
    
    const left = Math.min(startTimeX, endTimeX)
    const width = Math.abs(endTimeX - startTimeX)
    const top = Math.min(startLocationY, endLocationY)
    const height = Math.abs(endLocationY - startLocationY)
    
    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
      transform: 'none',
      transformOrigin: 'none'
    }
  }
  
  // Format time for display
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }
  
  // Responsive grid sizing
  const getCellDimensions = () => {
    if (!containerRef.value) return { width: 120, height: 20 }
    
    const containerWidth = containerRef.value.clientWidth
    const availableWidth = containerWidth - 200 // Leave space for location labels
    
    const cellWidth = Math.max(80, Math.min(150, availableWidth / dateRange.value.length))
    const cellHeight = 20 // Row height is 20px
    
    return { width: cellWidth, height: cellHeight }
  }
  
  const layout = computed((): TimelineLayout => ({
    days: dateRange.value,
    locations: usedLocations.value,
    dayLabels: dayLabels.value,
    grid: grid.value,
    moves: moveRectangles.value,
    gridRows: usedLocations.value.length + 1, // +1 for date labels
    gridCols: dateRange.value.length + 1 // +1 for location labels
  }))
  
  return {
    containerRef,
    layout,
    getDaylightStyle,
    getMoveRectangleStyle,
    getCellDimensions,
    formatTime
  }
} 