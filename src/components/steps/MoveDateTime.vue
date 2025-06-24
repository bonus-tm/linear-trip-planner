<script setup lang="ts">
import {computed, ref, watch} from 'vue';
import {isWeekendDay} from '../../utils/datetime.ts';

const props = defineProps<{
  date: string;
  showDate: boolean;
}>();

const d = ref();
watch(
  () => props.date,
  (val) => {
    d.value = new Date(val);
  },
  {immediate: true},
);

const weekday = computed(() => d.value.toLocaleDateString('en', {weekday: 'short'}));
const isWeekend = computed(() => isWeekendDay(props.date));
const day = computed(() => d.value.getDate());
const month = computed(() => d.value.toLocaleDateString('en', {month: 'short'}));
const year = computed(() => d.value.getFullYear());

const time = computed(() => d.value.toLocaleTimeString('en', {hour: '2-digit', minute: '2-digit', hour12: false}));
</script>

<template>
  <div class="datetime" :class="{weekend: isWeekend}">
    <div class="time">{{ time }}</div>
    <template v-if="showDate">
      <div class="day">{{ day }}</div>
      <div class="month">{{ month }}</div>
      <div class="year">{{ year }}</div>
      <div class="weekday">{{ weekday }}</div>
    </template>
  </div>
</template>

<style scoped>
.datetime {
  display: grid;
  justify-content: start;
  align-items: baseline;
  grid-template-columns: repeat(3, auto);
  column-gap: 0.15rem;
  line-height: 1.5rem;
}

.weekday {
  grid-column: 1/-1;
  font-size: 0.75em;
  line-height: 1;
  font-weight: 400;

  .weekend & {
    color: var(--color-weekend);
  }
}

.day {
  font-size: 1.5em;
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

.time {
  grid-column: 1/-1;
  font-size: 1.8em;
  font-weight: 800;
  line-height: 1.2;
}
</style>