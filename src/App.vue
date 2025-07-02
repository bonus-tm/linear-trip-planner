<script lang="ts" setup>
import {onMounted, ref, watch} from 'vue';
import Toast from 'primevue/toast';
import {useToast} from 'primevue/usetoast';
import {useAppState} from './composables/useAppState';
import AppTitle from './components/AppTitle.vue';
import LocationsTable from './components/locations/LocationsTable.vue';
import StepsTable from './components/steps/StepsTable.vue';
import Timeline from './components/timeline/Timeline.vue';
import NewTripButton from './components/NewTripButton.vue';
import LinkToGithub from './components/LinkToGithub.vue';
import TripsList from './components/TripsList.vue';

const {error, initState} = useAppState();
const toast = useToast();

onMounted(initState);

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

// @ts-ignore
const version = ref(__APP_VERSION__);
</script>

<template>
  <div class="app-container">
    <nav>
      <NewTripButton/>
      <TripsList/>
      <footer>
        <span>2025 bTM,</span>
        <LinkToGithub/>
        <span class="app-ver">v{{ version }}</span>
      </footer>
    </nav>

    <main>
      <div class="timeline">
        <AppTitle/>
        <Timeline/>
      </div>
      <div class="cards">
        <StepsTable/>
        <LocationsTable/>
      </div>
    </main>

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
  display: grid;
  grid-template-columns: var(--nav-width) 1fr;
}

main {
  display: flex;
  flex-direction: column;

  .timeline {
    position: relative;
    border-bottom: thin solid var(--color-border);
  }

  .cards {
    background-color: var(--color-background);
    flex-grow: 1;
  }
}

nav {
  background-color: var(--color-nav-bg);
  border-right: thin solid var(--color-border);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

footer {
  margin: auto 1rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 0.5rem;

  .app-ver {
    opacity: 0.5;
    margin-inline-start: 1em;
  }
}
</style>
