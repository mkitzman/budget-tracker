<script setup>
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore.js'

const store = useStore()

const today = new Date()
const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth())

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const monthLabel = computed(() => `${monthNames[viewMonth.value]} ${viewYear.value}`)

function prev() {
  if (viewMonth.value === 0) {
    viewMonth.value = 11
    viewYear.value--
  } else {
    viewMonth.value--
  }
}

function next() {
  if (viewMonth.value === 11) {
    viewMonth.value = 0
    viewYear.value++
  } else {
    viewMonth.value++
  }
}

const calendarDays = computed(() => {
  const first = new Date(viewYear.value, viewMonth.value, 1)
  const startDay = first.getDay()
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate()
  const days = []

  for (let i = 0; i < startDay; i++) {
    days.push({ day: null })
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const billsOnDay = store.bills.value.filter(b => {
      if (b.seasonalRates && Object.keys(b.seasonalRates).length > 0) {
        const rate = b.seasonalRates[viewMonth.value]
        if (rate === 0 || rate === '0') return false
      }
      return Number(b.dueDate) === d
    })
    const subsOnDay = store.subscriptions.value.filter(s => {
      if (s.seasonalRates && Object.keys(s.seasonalRates).length > 0) {
        const rate = s.seasonalRates[viewMonth.value]
        if (rate === 0 || rate === '0') return false
      }
      return Number(s.renewalDate) === d
    })
    days.push({
      day: d,
      isToday: d === today.getDate() && viewMonth.value === today.getMonth() && viewYear.value === today.getFullYear(),
      bills: billsOnDay,
      subs: subsOnDay
    })
  }

  return days
})

const hoveredDay = ref(null)
</script>

<template>
  <div class="card calendar">
    <div class="flex items-center justify-between mb-16">
      <h3>Calendar</h3>
      <div class="flex items-center gap-8">
        <button class="btn-icon" @click="prev">&larr;</button>
        <span class="month-label">{{ monthLabel }}</span>
        <button class="btn-icon" @click="next">&rarr;</button>
      </div>
    </div>

    <div class="cal-grid">
      <div v-for="name in dayNames" :key="name" class="cal-header">{{ name }}</div>
      <div
        v-for="(cell, i) in calendarDays"
        :key="i"
        :class="['cal-cell', { today: cell.isToday, empty: !cell.day }]"
        @mouseenter="hoveredDay = cell.day ? cell : null"
        @mouseleave="hoveredDay = null"
      >
        <span v-if="cell.day" class="day-num">{{ cell.day }}</span>
        <div v-if="cell.day" class="dots">
          <span v-for="b in (cell.bills || []).slice(0, 3)" :key="'b'+b.id" class="dot dot-bill" :title="b.name" />
          <span v-for="s in (cell.subs || []).slice(0, 3)" :key="'s'+s.id" class="dot dot-sub" :title="s.name" />
        </div>
      </div>
    </div>

    <div v-if="hoveredDay && (hoveredDay.bills?.length || hoveredDay.subs?.length)" class="cal-tooltip">
      <div v-for="b in hoveredDay.bills" :key="'tb'+b.id" class="tooltip-item">
        <span class="dot dot-bill" /> {{ b.name }} — ${{ Number(b.amount).toFixed(2) }}
      </div>
      <div v-for="s in hoveredDay.subs" :key="'ts'+s.id" class="tooltip-item">
        <span class="dot dot-sub" /> {{ s.name }} — ${{ Number(s.cost).toFixed(2) }}
      </div>
    </div>

    <div class="legend mt-8">
      <span><span class="dot dot-bill" /> Bills</span>
      <span><span class="dot dot-sub" /> Subscriptions</span>
    </div>
  </div>
</template>

<style scoped>
.calendar {
  position: relative;
}

.month-label {
  font-weight: 600;
  font-size: 15px;
  min-width: 160px;
  text-align: center;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.cal-header {
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 6px 0;
}

.cal-cell {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 4px 2px;
  border-radius: var(--radius-sm);
  transition: background 0.15s;
  min-height: 48px;
  cursor: default;
}

.cal-cell:not(.empty):hover {
  background: var(--surface-secondary);
}

.cal-cell.today .day-num {
  background: var(--accent);
  color: #fff;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.day-num {
  font-size: 13px;
  font-weight: 500;
  margin-bottom: 2px;
}

.dots {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
  justify-content: center;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.dot-bill { background: var(--orange); }
.dot-sub { background: var(--accent); }

.cal-tooltip {
  position: absolute;
  bottom: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(28, 28, 30, 0.95);
  color: #fff;
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  z-index: 10;
  white-space: nowrap;
  box-shadow: var(--shadow-lg);
}

.tooltip-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}

.legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--text-secondary);
}

.legend span {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
