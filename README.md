# Travel Itinerary Planner

A Vue 3 single-page application for planning travel itineraries with automatic daylight calculations based on location coordinates and dates.

## Features

- **Location Management**: Add, edit, and delete travel locations with coordinates and timezone information
- **Step Management**: Create travel steps (moves between locations or stays at locations) with date/time tracking
- **Automatic Daylight Calculation**: Calculates sunrise/sunset times for each location based on dates in your itinerary
- **Real-time Persistence**: All data is automatically saved to localStorage
- **Inline Editing**: Edit all data directly in the tables
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Vue 3** with Composition API
- **TypeScript** for type safety
- **Vite** for fast development and building
- **PrimeVue** for UI components
- **VueUse** for composables and utilities
- **localStorage** for data persistence

## Getting Started

### Prerequisites

- Node.js 16+ and npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd linear-trip-planner
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

### Managing Locations

1. Click "Add Location" to create a new location
2. Click on any cell to edit:
   - **Name**: Unique identifier for the location
   - **Latitude**: -90 to 90 degrees
   - **Longitude**: -180 to 180 degrees
   - **Timezone**: UTC offset (-12 to +12)
3. Click the trash icon to delete a location (only if not used in steps)

### Managing Steps

1. Click "Add Step" to create a new travel step
2. Choose the step type:
   - **Move**: Travel between two locations
   - **Stay**: Remain at one location
3. Edit step details:
   - **Start/Finish Date**: Date and optional time
   - **Locations**: Select from your added locations
   - **Airports**: 3-letter codes (only for moves)
   - **Description**: Optional notes
4. Steps are automatically sorted by start date

### Daylight Information

- Automatically calculated when locations and steps are defined
- Shows sunrise/sunset times in local timezone
- Displays total daylight hours
- Handles polar nights and midnight sun

## Data Structure

### Location
```typescript
{
  name: string
  coordinates: { lat: number, lng: number }
  timezone: number // UTC offset
  daylight: Record<string, DaylightInfo> // auto-calculated
}
```

### Step
```typescript
{
  id: string
  type: 'move' | 'stay'
  startDate: string // ISO format
  finishDate: string
  startLocation: string
  finishLocation?: string // only for moves
  startAirport?: string // 3-letter code
  finishAirport?: string
  description?: string
}
```

## Features in Detail

### Automatic Prefilling
- New steps automatically use the finish date/location of the previous step
- Saves time when creating sequential itineraries

### Data Validation
- Coordinates are validated for valid ranges
- Finish dates cannot be before start dates
- Location names must be unique
- Locations cannot be deleted if used in steps

### Performance
- Debounced saves (500ms) to prevent excessive localStorage writes
- Efficient daylight calculations only for used date ranges
- Automatic cleanup of unused daylight data

## Browser Support

Works in all modern browsers that support:
- ES6+
- localStorage
- CSS Grid

## License

MIT
