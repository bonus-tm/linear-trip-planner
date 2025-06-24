<script lang="ts" setup>
import Button from 'primevue/button';
import {useConfirm} from 'primevue/useconfirm';
import ConfirmDialog from 'primevue/confirmdialog';
import {useAppState} from '../composables/useAppState';

const {locations, steps} = useAppState();
const confirm = useConfirm();

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
    accept: () => {
      // Clear all locations and steps
      locations.value = {};
      steps.value = [];

      // Reset zoom level to 'fit'
      localStorage.setItem('trip-planner-zoom', 'fit');
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