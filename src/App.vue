<script lang="ts" setup>
import {ref, watch, watchEffect} from 'vue';
import Toast from 'primevue/toast';
import {useToast} from 'primevue/usetoast';
import {useAppState} from './composables/useAppState';
import LocationsTable from './components/LocationsTable.vue';
import StepsTable from './components/StepsTable.vue';
import Timeline from './components/Timeline.vue';

const {steps, locations, error} = useAppState();

const toast = useToast();
watch(error, (msg: string | null) => {
  if (msg) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
      group: 'err',
      life: 5000,
    });
  }
});

const clearError = () => {
  error.value = null;
};

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
  <div class="app-container">
    <main>
      <h1 v-if="tripPlaces && tripMonth">
        <span class="places" v-html="tripPlaces"/>
        <span class="month">{{ tripMonth }}</span>
      </h1>
      <h1 v-else>
        {{ defaultAppName }}
      </h1>

      <Timeline/>
      <StepsTable/>
      <LocationsTable/>
    </main>
    <footer>
      <span>2025 bTM,</span>
      <a href="https://github.com/bonus-tm/linear-trip-planner" target="_blank" rel="noopener noreferrer" class="github-link">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        &nbsp;GitHub
      </a>
    </footer>

    <Toast
      group="err"
      position="top-center"
      @close="clearError"
      @lifeEnd="clearError"
    />
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-items: flex-start;
}

h1 {
  margin: 0;
  padding-block: 0.5em;
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

footer {
  padding: 1rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  margin-block-start: auto;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;

  .github-link {
    display: inline-flex;
    align-items: center;
    color: var(--color-text-muted);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--color-text);
    }

    svg {
      width: 14px;
      height: 14px;
    }
  }
}
</style>
