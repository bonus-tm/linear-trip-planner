<script lang="ts" setup>
import {computed, ref, watch} from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Message from 'primevue/message';
import type {Step} from '../types';
import {useAppState} from '../composables/useAppState';
import {formatTZ} from '../utils/datetime';
import LocationSelect from './LocationSelect.vue';

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
  if (!formData.value.startDate || !formData.value.finishDate || !formData.value.startLocationId) {
    localError.value = 'Please fill in all required fields';
    return;
  }

  // Validation - need to consider timezones for proper date comparison
  const startTimezone = locations.value[formData.value.startLocationId]?.timezone || 0;
  const finishTimezone = startTimezone; // Stay steps use same location

  const startTimestamp = new Date(`${formData.value.startDate}${formatTZ(startTimezone)}`).getTime();
  const finishTimestamp = new Date(`${formData.value.finishDate}${formatTZ(finishTimezone)}`).getTime();

  if (finishTimestamp < startTimestamp) {
    localError.value = 'Check-out date/time cannot be earlier than check-in date/time';
    return;
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
    :style="{ width: '500px' }"
    header="Edit Stay"
  >
    <div class="edit-form">
      <div class="form-row">
        <div class="form-field">
          <label>Check-in Date/Time *</label>
          <InputText
            v-model="formData.startDate"
            :invalid="!formData.startDate"
            type="datetime-local"
          />
        </div>
        <div class="form-field">
          <label>Check-out Date/Time *</label>
          <InputText
            v-model="formData.finishDate"
            :invalid="!formData.finishDate"
            :min="formData.startDate"
            type="datetime-local"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>Location *</label>
          <LocationSelect v-model="formData.startLocationId"/>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>Notes</label>
          <Textarea
            v-model="formData.description"
            placeholder="Optional description"
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