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
    formData.value = {
      ...newStep,
      // Convert datetime strings to date-only strings for HTML date inputs
      startDate: newStep.startDate ? newStep.startDate.split('T')[0] : '',
      finishDate: newStep.finishDate ? newStep.finishDate.split('T')[0] : '',
    };
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

  formData.value.startDate += 'T23:59:59';
  formData.value.finishDate += 'T00:00:01';

  // Validation - need to consider timezones for proper date comparison
  const startTimezone = locations.value[formData.value.startLocationId]?.timezone || 0;
  const finishTimezone = startTimezone; // Stay steps use same location

  const startTimestamp = new Date(`${formData.value.startDate}${formatTZ(startTimezone)}`).getTime();
  const finishTimestamp = new Date(`${formData.value.finishDate}${formatTZ(finishTimezone)}`).getTime();

  if (finishTimestamp < startTimestamp) {
    localError.value = 'Check-out date/time cannot be earlier than check-in date/time';
    return;
  }

  // Update timestamps and full datetime strings
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
    :header="isCreating ? 'Add Stay' : 'Edit Stay'"
    :modal="true"
    :style="{ width: '500px' }"
  >
    <div class="edit-form">
      <div class="form-row">
        <div class="form-field">
          <label>Check-in Date *</label>
          <InputText
            v-model="formData.startDate"
            :invalid="!formData.startDate"
            autofocus
            tabindex="1"
            type="date"
          />
        </div>
        <div class="form-field">
          <label>Check-out Date *</label>
          <InputText
            v-model="formData.finishDate"
            :invalid="!formData.finishDate"
            :min="formData.startDate"
            tabindex="2"
            type="date"
          />
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>Location *</label>
          <LocationSelect v-model="formData.startLocationId" tabindex="3"/>
        </div>
      </div>

      <div class="form-row">
        <div class="form-field">
          <label>Notes</label>
          <Textarea
            v-model="formData.description"
            placeholder="Optional description"
            rows="3"
            tabindex="4"
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
          tabindex="7"
          text
          @click="confirmDelete"
        />
        <div class="footer-actions">
          <Button
            label="Cancel"
            tabindex="6"
            text
            @click="handleCancel"
          />
          <Button
            :label="isCreating ? 'Add' : 'Save'"
            severity="success"
            tabindex="5"
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