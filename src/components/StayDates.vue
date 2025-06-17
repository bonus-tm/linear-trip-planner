<script setup lang="ts">
import {computed, ref, watch} from 'vue';

const props = defineProps<{
  begin: string;
  end: string;
}>();

const b = ref();
watch(
  () => props.begin,
  (val) => {
    b.value = new Date(val);
  },
  {immediate: true},
);
const e = ref();
watch(
  () => props.end,
  (val) => {
    e.value = new Date(val);
  },
  {immediate: true},
);

const beginDay = computed(() => b.value.getDate());
const beginMonth = computed(() => b.value.toLocaleDateString('en', {month: 'long'}));
const beginYear = computed(() => b.value.getFullYear());

const endDay = computed(() => e.value.getDate());
const endMonth = computed(() => e.value.toLocaleDateString('en', {month: 'long'}));
const endYear = computed(() => e.value.getFullYear());

const sameMonth = computed(() => b.value.getMonth() === e.value.getMonth());
const sameYear = computed(() => b.value.getFullYear() === e.value.getFullYear());
</script>

<template>
  <div class="dates">
    <div class="date date-begin">
      <div class="day">{{ beginDay }}</div>
      <div class="month" v-if="!sameMonth || !sameYear"> {{ beginMonth }}</div>
      <div class="year" v-if="!sameYear">{{ beginYear }}</div>
      <div class="day">–</div>
    </div>
    <div class="date date-end">
      <div class="day">{{ endDay }}</div>
      <div class="month"> {{ endMonth }}</div>
      <div class="year">{{ endYear }}</div>
    </div>
  </div>
</template>

<style scoped>
.dates {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
  flex-wrap: wrap;
  line-height: 1.2rem;
}

.date {
  display: flex;
  align-items: baseline;
  gap: 0.15rem;
}

.day {
  font-size: 1.8em;
  font-weight: 700;

  .weekend & {
    color: var(--color-weekend);
  }
}

.month {
  font-size: 1.5em;
  font-weight: 400;
}

.year {
  font-size: 1.15em;
  font-weight: 300;
  opacity: 0.7;
}
</style>