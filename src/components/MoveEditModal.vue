<script lang="ts" setup>
import {computed, ref, watch} from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import Message from 'primevue/message';
import type {Step} from '../types';
import {useAppState} from '../composables/useAppState';
import {formatTZ} from '../utils/datetime';

interface Props {
  visible: boolean;
  step: Step | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [stepData: Partial<Step>];
  delete: [stepId: string];
}>();

const {locationNames, locations} = useAppState();

// Form data
const formData = ref<Partial<Step>>({});
const localError = ref<string | null>(null);

// Watch for step changes to populate form
watch(() => props.step, (newStep) => {
  if (newStep) {
    formData.value = {...newStep};
  } else {
    formData.value = {};
  }
  localError.value = null;
}, {immediate: true});

// Computed for dialog visibility
const dialogVisible = computed({
  get: () => props.visible,
  set: (value: boolean) => emit('update:visible', value),
});

const validateAndSave = () => {
  if (!formData.value.startDate || !formData.value.finishDate ||
    !formData.value.startLocation || !formData.value.finishLocation) {
    localError.value = 'Please fill in all required fields';
    return;
  }

  // Validation - need to consider timezones for proper date comparison
  const startTimezone = locations.value[formData.value.startLocation]?.timezone || 0;
  const finishTimezone = locations.value[formData.value.finishLocation]?.timezone || 0;

  const startTimestamp = new Date(`${formData.value.startDate}${formatTZ(startTimezone)}`).getTime();
  const finishTimestamp = new Date(`${formData.value.finishDate}${formatTZ(finishTimezone)}`).getTime();

  if (finishTimestamp < startTimestamp) {
    localError.value = 'Arrival date/time cannot be earlier than departure date/time (accounting for timezones)';
    return;
  }

  // Convert airport codes to uppercase
  if (formData.value.startAirport) {
    formData.value.startAirport = formData.value.startAirport.toUpperCase();
  }
  if (formData.value.finishAirport) {
    formData.value.finishAirport = formData.value.finishAirport.toUpperCase();
  }

  // Update timestamps
  formData.value.startTimestamp = startTimestamp;
  formData.value.finishTimestamp = finishTimestamp;

  emit('save', formData.value);
  dialogVisible.value = false;
};

const confirmDelete = () => {
  if (props.step?.id) {
    emit('delete', props.step.id);
    dialogVisible.value = false;
  }
};

const handleCancel = () => {
  localError.value = null;
  dialogVisible.value = false;
};
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :modal="true"
    :style="{ width: '600px' }"
    header="Edit Move"
  >
    <div class="edit-form">
      <div class="form-row">
        <div class="form-field">
          <label>Departure Date/Time *</label>
          <InputText
            v-model="formData.startDate"
            :invalid="!formData.startDate"
            :step="60"
            type="datetime-local"
          />
        </div>
        <div class="form-field">
          <label>Arrival Date/Time *</label>
          <InputText
            v-model="formData.finishDate"
            :invalid="!formData.finishDate"
            :step="60"
            type="datetime-local"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>From Location *</label>
          <Select
            v-model="formData.startLocation"
            :invalid="!formData.startLocation"
            :options="locationNames"
            placeholder="Select departure location"
          />
        </div>
        <div class="form-field">
          <label>To Location *</label>
          <Select
            v-model="formData.finishLocation"
            :invalid="!formData.finishLocation"
            :options="locationNames"
            placeholder="Select arrival location"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>From Airport</label>
          <InputText
            v-model="formData.startAirport"
            :maxlength="3"
            placeholder="XXX"
            style="text-transform: uppercase"
          />
        </div>
        <div class="form-field">
          <label>To Airport</label>
          <InputText
            v-model="formData.finishAirport"
            :maxlength="3"
            placeholder="XXX"
            style="text-transform: uppercase"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>Notes</label>
          <Textarea
            v-model="formData.description"
            placeholder="Description"
            rows="3"
          />
        </div>
      </div>

      <Message v-if="localError" :closable="true" severity="error" @close="localError = null">
        {{ localError }}
      </Message>
    </div>

    <template #footer>
      <div class="modal-footer">
        <Button
          label="Delete"
          severity="danger"
          text
          @click="confirmDelete"
        />
        <div class="footer-actions">
          <Button
            label="Cancel"
            text
            @click="handleCancel"
          />
          <Button
            label="Save"
            severity="success"
            @click="validateAndSave"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-field {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
}

.modal-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 