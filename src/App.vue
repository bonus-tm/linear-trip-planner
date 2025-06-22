<script lang="ts" setup>
import {watch} from 'vue';
import Toast from 'primevue/toast';
import {useToast} from 'primevue/usetoast';
import {useAppState} from './composables/useAppState';
import AppTitle from './components/AppTitle.vue';
import LocationsTable from './components/LocationsTable.vue';
import StepsTable from './components/StepsTable.vue';
import Timeline from './components/Timeline.vue';

const {error} = useAppState();

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
</script>

<template>
  <div class="app-container">
    <main>
      <AppTitle/>
      <Timeline/>
      <StepsTable/>
      <LocationsTable/>
    </main>
    <footer>
      <span>2025 bTM,</span>
      <a href="https://github.com/bonus-tm/linear-trip-planner" target="_blank" rel="noopener noreferrer"
         class="github-link">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path
            d="M12 0c6.627 0 12 5.373 12 12 0 5.3-3.434 9.797-8.199 11.386-.609.118-.801-.257-.801-.576V19.517c0-1.12-.393-1.85-.823-2.222 2.672-.297 5.479-1.312 5.479-5.921 0-1.31-.465-2.381-1.235-3.221.124-.302.535-1.523-.118-3.176 0 0-1.006-.322-3.297 1.23-.959-.266-1.986-.399-3.006-.404-1.02.005-2.046.138-3.003.404-2.293-1.552-3.301-1.23-3.301-1.23-.652 1.652-.241 2.873-.117 3.176-.767.84-1.236 1.91-1.236 3.221 0 4.597 2.802 5.626 5.467 5.931-.344.299-.655.829-.762 1.604-.685.307-2.422.837-3.492-.997 0 0-.634-1.153-1.839-1.237 0 0-1.172-.016-.083.729 0 0 .787.369 1.333 1.756 0 0 .695 2.142 4.033 1.416V22.81c0 .316-.194.688-.793.577C3.438 21.8 0 17.302 0 12 0 5.373 5.374 0 12 0Z"/>
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
