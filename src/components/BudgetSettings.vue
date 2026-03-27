<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'
import { useStore } from '../composables/useStore.js'

const store = useStore()
const emit = defineEmits(['close'])

const needs = ref(Math.round(store.categoryTargets.value.Needs * 100))
const wants = ref(Math.round(store.categoryTargets.value.Wants * 100))
const savings = ref(Math.round(store.categoryTargets.value.Savings * 100))

const presets = [
  { label: 'Standard', values: [50, 30, 20] },
  { label: 'Lean / HCOL', values: [60, 20, 20] },
  { label: 'Aggressive Saver', values: [40, 10, 50] },
]

function applyPreset(values) {
  needs.value = values[0]
  wants.value = values[1]
  savings.value = values[2]
}

function isActivePreset(values) {
  return needs.value === values[0] && wants.value === values[1] && savings.value === values[2]
}

function adjustLinked(changed, delta) {
  const others = ['needs', 'wants', 'savings'].filter(k => k !== changed)
  const refs = { needs, wants, savings }
  const total = refs[others[0]].value + refs[others[1]].value

  if (total === 0) {
    refs[others[0]].value = Math.round(-delta / 2)
    refs[others[1]].value = -delta - Math.round(-delta / 2)
    return
  }

  const ratio0 = refs[others[0]].value / total
  const adj0 = Math.round(-delta * ratio0)
  const adj1 = -delta - adj0

  refs[others[0]].value = Math.max(0, Math.min(100, refs[others[0]].value + adj0))
  refs[others[1]].value = Math.max(0, Math.min(100, refs[others[1]].value + adj1))

  // Ensure total is exactly 100
  const sum = needs.value + wants.value + savings.value
  if (sum !== 100) {
    const diff = 100 - sum
    // Apply remainder to the largest other bucket
    const largest = refs[others[0]].value >= refs[others[1]].value ? others[0] : others[1]
    refs[largest].value = Math.max(0, refs[largest].value + diff)
  }
}

function onSlider(field, event) {
  const refs = { needs, wants, savings }
  const oldVal = refs[field].value
  const newVal = Number(event.target.value)
  const delta = newVal - oldVal
  refs[field].value = newVal
  adjustLinked(field, delta)
}

function save() {
  store.setCategoryTargets({
    Needs: needs.value / 100,
    Wants: wants.value / 100,
    Savings: savings.value / 100
  })
  emit('close')
}

const dialogRef = ref(null)
onMounted(() => nextTick(() => dialogRef.value?.focus()))

const categoryColors = { needs: '#0a84ff', wants: '#bf5af2', savings: '#30d158' }
</script>

<template>
  <div class="confirm-overlay" @click.self="$emit('close')" @keydown.escape="$emit('close')">
    <div class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="budget-settings-title" ref="dialogRef" tabindex="-1">
      <h3 id="budget-settings-title">Budget Strategy</h3>

      <div class="presets">
        <button
          v-for="p in presets"
          :key="p.label"
          class="preset-btn"
          :class="{ active: isActivePreset(p.values) }"
          @click="applyPreset(p.values)"
        >
          {{ p.label }}
        </button>
      </div>

      <div class="sliders">
        <div class="slider-row">
          <label>
            <span class="slider-dot" style="background: #0a84ff" />
            Needs
          </label>
          <input type="range" min="0" max="100" :value="needs" @input="onSlider('needs', $event)" />
          <span class="slider-value">{{ needs }}%</span>
        </div>
        <div class="slider-row">
          <label>
            <span class="slider-dot" style="background: #bf5af2" />
            Wants
          </label>
          <input type="range" min="0" max="100" :value="wants" @input="onSlider('wants', $event)" />
          <span class="slider-value">{{ wants }}%</span>
        </div>
        <div class="slider-row">
          <label>
            <span class="slider-dot" style="background: #30d158" />
            Savings
          </label>
          <input type="range" min="0" max="100" :value="savings" @input="onSlider('savings', $event)" />
          <span class="slider-value">{{ savings }}%</span>
        </div>
      </div>

      <div class="preview-bar">
        <div class="preview-segment" :style="{ width: needs + '%', background: '#0a84ff' }" />
        <div class="preview-segment" :style="{ width: wants + '%', background: '#bf5af2' }" />
        <div class="preview-segment" :style="{ width: savings + '%', background: '#30d158' }" />
      </div>

      <div class="actions">
        <button class="btn btn-secondary" @click="$emit('close')">Cancel</button>
        <button class="btn" @click="save">Apply</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.settings-dialog {
  background: var(--surface);
  border-radius: var(--radius-lg);
  padding: 28px;
  max-width: 440px;
  width: 90%;
  box-shadow: var(--shadow-lg);
}

.settings-dialog h3 {
  margin-bottom: 16px;
  text-align: center;
}

.presets {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.preset-btn {
  flex: 1;
  padding: 8px 4px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--accent);
}

.preset-btn.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.sliders {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 16px;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-row label {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 80px;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}

.slider-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.slider-row input[type="range"] {
  flex: 1;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: var(--border);
  border-radius: 3px;
  outline: none;
}

.slider-row input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.slider-value {
  width: 40px;
  text-align: right;
  font-size: 14px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.preview-bar {
  display: flex;
  height: 8px;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.preview-segment {
  transition: width 0.3s ease;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}
</style>
