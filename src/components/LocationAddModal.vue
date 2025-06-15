<script lang="ts" setup>
import {ref, watch} from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import Dialog from 'primevue/dialog';

interface Props {
  visible: boolean;
}

interface Emits {
  (e: 'update:visible', value: boolean): void;
  (e: 'save', locationData: { name: string; timezone: number }): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const newLocationName = ref('');
const selectedTimezone = ref(0);

// Generate timezone options from -12 to +12
const timezoneOptions = Array.from({length: 25}, (_, i) => ({
  label: `UTC${i - 12 >= 0 ? '+' : ''}${i - 12}`,
  value: i - 12,
}));

// Watch for dialog visibility changes to reset form
watch(() => props.visible, (visible) => {
  if (visible) {
    newLocationName.value = '';
    selectedTimezone.value = 0;
  }
});

const closeDialog = () => {
  emit('update:visible', false);
  newLocationName.value = '';
  selectedTimezone.value = 0;
};

const createLocation = () => {
  if (!newLocationName.value.trim()) return;
  
  emit('save', {
    name: newLocationName.value.trim(),
    timezone: selectedTimezone.value
  });
  closeDialog();
};
</script>

<template>
  <Dialog
    :modal="true"
    :style="{ width: '400px' }"
    :visible="visible"
    header="New Location"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="form-field">
      <label for="locationName">Name</label>
      <InputText
        id="locationName"
        v-model="newLocationName"
        autofocus
        placeholder="Enter location name"
        @keyup.enter="createLocation"
      />
    </div>

    <div class="form-field">
      <label for="timezone">Timezone</label>
      <Select
        id="timezone"
        v-model="selectedTimezone"
        :options="timezoneOptions"
        optionLabel="label"
        optionValue="value"
        class="timezone-select"
      />
    </div>
    <template #footer>
      <Button
        label="Cancel"
        text
        @click="closeDialog"
      />
      <Button
        :disabled="!newLocationName.trim()"
        label="Create"
        @click="createLocation"
      />
    </template>
  </Dialog>
</template>

<style scoped>
.form-field {
  margin-bottom: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--color-text);
  transition: color 0.3s ease;
}

.form-field input {
  width: 100%;
}

.timezone-select {
  width: 100%;
}
</style> 