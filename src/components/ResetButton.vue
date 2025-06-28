<script lang="ts" setup>
import Button from 'primevue/button';
import {useConfirm} from 'primevue/useconfirm';
import ConfirmDialog from 'primevue/confirmdialog';
import {useAppState} from '../composables/useAppState';
import {ref} from 'vue';

const {createNewTrip, isLoading} = useAppState();
const confirm = useConfirm();
const isResetting = ref(false);

const handleNewTravel = () => {
  confirm.require({
    message: 'You sure? All locations and steps will be deleted',
    header: 'New Travel',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Cancel',
      severity: 'secondary',
      outlined: true,
    },
    acceptProps: {
      label: 'Reset',
      severity: 'danger',
    },
    accept: async () => {
      try {
        isResetting.value = true;
        
        // Generate new trip ID, create trip document, and clear all locations and steps
        // Old trip data remains in PouchDB (no deletion) as specified in requirements
        await createNewTrip('My Trip', '');

        // Reset zoom level to 'fit' - keeping this in localStorage as specified
        localStorage.setItem('trip-planner-zoom', 'fit');
      } catch (error) {
        console.error('Failed to create new trip:', error);
      } finally {
        isResetting.value = false;
      }
    },
  });
};
</script>

<template>
  <Button
    class="reset-button"
    icon="pi pi-pen-to-square"
    label="New travel"
    severity="secondary"
    :loading="isLoading || isResetting"
    @click="handleNewTravel"
  />
  <ConfirmDialog/>
</template>

<style scoped>
.reset-button {
  position: absolute;
  top: 1rem;
  left: 1rem;
}
</style>