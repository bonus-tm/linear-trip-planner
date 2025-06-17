<script setup lang="ts">
import {ref, watch, watchEffect} from 'vue';
import Toast from 'primevue/toast';
import {useToast} from 'primevue/usetoast';
import {useAppState} from './composables/useAppState';
import LocationsTable from './components/LocationsTable.vue';
import StepsTable from './components/StepsTable.vue';
import Timeline from './components/Timeline.vue';

const {steps, error} = useAppState();

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
let tripPlaces = '';
let tripMonth = '';
const h1 = ref('');

watchEffect(() => {
  const places = new Set();
  const months: Set<string> = new Set();

  if (steps.value?.[0]?.type === 'move') {
    places.add(steps.value[0].startLocation);
  }

  steps.value.forEach((step) => {
    if (step.type === 'stay') {
      places.add(step.startLocation);
    } else {
      months.add(step.finishDate.substring(0, 7));
    }
  });

  tripPlaces = Array.from(places).join('&thinsp;—&thinsp;');

  const monthsUniq: string[] = Array.from(months).sort();

  if (monthsUniq.length === 1) {
    const [y, m] = monthsUniq[0].split('-');
    const d = new Date(parseInt(y), parseInt(m) - 1, 1);
    tripMonth = d.toLocaleDateString('en', {month: 'long', year: 'numeric'});
  }

  if (tripPlaces && tripMonth) {
    h1.value = `${tripPlaces}, ${tripMonth}`;
    document.title = `${Array.from(places).join('—')}, ${tripMonth} | ${defaultAppName}`;
  } else {
    h1.value = defaultAppName;
    document.title = defaultAppName;
  }
});
</script>

<template>
  <div class="app-container">
    <h1 v-html="h1"/>

    <Timeline/>
    <StepsTable/>
    <LocationsTable/>

    <Toast
      position="top-center"
      group="err"
      @close="clearError"
      @lifeEnd="clearError"
    />
  </div>
</template>

<style scoped>
.app-container {
}

h1 {
  margin: 0;
  padding-block: 0.5em;
  text-align: center;
  transition: color 0.3s ease;
  background-color: var(--color-surface)
}
</style>
