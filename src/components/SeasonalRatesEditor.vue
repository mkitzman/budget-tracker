<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Object, default: () => ({}) },
  baseAmount: { type: Number, default: 0 }
})

const emit = defineEmits(['update:modelValue'])

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const rates = computed(() => {
  const obj = {}
  for (let i = 0; i < 12; i++) {
    obj[i] = props.modelValue[i] !== undefined && props.modelValue[i] !== null
      ? props.modelValue[i]
      : ''
  }
  return obj
})

function update(monthIdx, value) {
  const newRates = { ...props.modelValue }
  if (value === '' || value === null || value === undefined) {
    delete newRates[monthIdx]
  } else {
    newRates[monthIdx] = Number(value)
  }
  emit('update:modelValue', newRates)
}
</script>

<template>
  <div class="seasonal-editor">
    <p class="text-secondary text-sm mb-8">
      Set monthly overrides. Empty = base amount (${{ baseAmount }}). Enter 0 for inactive months.
    </p>
    <div class="months-grid">
      <div v-for="(label, idx) in months" :key="idx" class="month-input">
        <label>{{ label }}</label>
        <input
          type="number"
          :value="rates[idx]"
          :placeholder="baseAmount.toString()"
          @input="update(idx, $event.target.value === '' ? '' : $event.target.value)"
          @blur="update(idx, $event.target.value === '' ? '' : Number($event.target.value))"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.seasonal-editor {
  padding: 12px 0;
}

.months-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

@media (max-width: 600px) {
  .months-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.month-input {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.month-input label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}

.month-input input {
  padding: 6px 8px;
  font-size: 13px;
  text-align: center;
  width: 100%;
}
</style>
