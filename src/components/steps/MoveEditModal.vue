<script lang="ts" setup>
import {computed, ref, watch} from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Message from 'primevue/message';
import type {Step} from '../../types';
import {useAppState} from '../../composables/useAppState.ts';
import {formatTZ} from '../../utils/datetime.ts';
import LocationSelect from '../locations/LocationSelect.vue';

interface Props {
  visible: boolean;
  step: Step | null;
  isCreating?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isCreating: false,
});

const emit = defineEmits<{
  'update:visible': [value: boolean];
  save: [stepData: Partial<Step>];
  delete: [stepId: string];
  close: [];
}>();

const {locations} = useAppState();

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
    !formData.value.startLocationId || !formData.value.finishLocationId) {
    localError.value = 'Please fill in all required fields';
    return;
  }

  // Validation - need to consider timezones for proper date comparison
  const startTimezone = locations.value[formData.value.startLocationId]?.timezone || 0;
  const finishTimezone = locations.value[formData.value.finishLocationId]?.timezone || 0;

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
  emit('close');
  dialogVisible.value = false;
};
</script>

<template>
  <Dialog
    v-model:visible="dialogVisible"
    :header="isCreating ? 'Add Move' : 'Edit Move'"
    :modal="true"
    :style="{ width: '600px' }"
  >
    <div class="edit-form">
      <div class="form-row">
        <div class="form-field">
          <label>Departure Date/Time *</label>
          <InputText
            v-model="formData.startDate"
            :invalid="!formData.startDate"
            :step="60"
            autofocus
            tabindex="1"
            type="datetime-local"
          />
        </div>
        <div class="form-field">
          <label>Arrival Date/Time *</label>
          <InputText
            v-model="formData.finishDate"
            :invalid="!formData.finishDate"
            :step="60"
            tabindex="2"
            type="datetime-local"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>From Location *</label>
          <LocationSelect
            v-model="formData.startLocationId"
            placeholder="Select departure location"
            tabindex="3"
          />
        </div>
        <div class="form-field">
          <label>To Location *</label>
          <LocationSelect
            v-model="formData.finishLocationId"
            placeholder="Select arrival location"
            tabindex="4"
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
            tabindex="5"
          />
        </div>
        <div class="form-field">
          <label>To Airport</label>
          <InputText
            v-model="formData.finishAirport"
            :maxlength="3"
            placeholder="XXX"
            style="text-transform: uppercase"
            tabindex="6"
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
            tabindex="7"
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
          v-if="!isCreating"
          label="Delete"
          severity="danger"
          tabindex="12"
          text
          @click="confirmDelete"
        />
        <div class="footer-actions">
          <Button
            label="Cancel"
            tabindex="11"
            text
            @click="handleCancel"
          />
          <Button
            :label="isCreating ? 'Add' : 'Save'"
            severity="success"
            tabindex="10"
            @click="validateAndSave"
          />
        </div>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.form-row {
  display: flex;
  gap: 1rem;

  .form-field {
    flex: 1;
  }
}

.footer-actions {
  display: flex;
  gap: 0.5rem;
  margin-inline-start: auto;
}

@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style> 