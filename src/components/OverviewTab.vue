<script setup>
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore.js'
import PieChart from './PieChart.vue'
import CalendarView from './CalendarView.vue'

const store = useStore()

const editingIncome = ref(false)
const incomeInput = ref(null)

function startEditIncome() {
  editingIncome.value = true
  setTimeout(() => incomeInput.value?.select(), 10)
}

function finishEditIncome() {
  editingIncome.value = false
}

const expandedCategory = ref(null)

function toggleCategory(cat) {
  expandedCategory.value = expandedCategory.value === cat ? null : cat
}

const fmt = (n) => {
  const num = Number(n) || 0
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const categoryColors = { Needs: '#0a84ff', Wants: '#bf5af2', Savings: '#30d158' }
const categoryIcons = { Needs: 'N', Wants: 'W', Savings: 'S' }

// Pie chart data
const incomeBreakdown = computed(() => {
  const hasExpenses = store.totalExpenses.value > 0
  const finalRemaining = hasExpenses ? store.adjustedRemaining.value : store.remaining.value
  const labels = ['Bills', 'Subscriptions']
  const data = [store.totalBills.value, store.totalSubscriptions.value]
  const colors = ['#ff9f0a', '#0a84ff']

  if (hasExpenses) {
    labels.push('Expenses')
    data.push(store.totalExpenses.value)
    colors.push('#ff453a')
  }

  labels.push(finalRemaining >= 0 ? 'Remaining' : 'Over Budget')
  data.push(Math.abs(finalRemaining))
  colors.push(finalRemaining >= 0 ? '#30d158' : '#ff453a')

  return { labels, data, colors }
})

const billsBreakdown = computed(() => {
  const activeBills = store.bills.value.filter(b => store.getBillCurrentAmount(b) > 0)
  return {
    labels: activeBills.map(b => b.name || 'Unnamed'),
    data: activeBills.map(b => store.getBillCurrentAmount(b)),
    colors: []
  }
})

const subsBreakdown = computed(() => {
  const active = store.subscriptions.value.filter(s => store.monthlyAmount(s) > 0)
  return {
    labels: active.map(s => s.name || 'Unnamed'),
    data: active.map(s => store.monthlyAmount(s)),
    colors: []
  }
})
</script>

<template>
  <div>
    <!-- Income -->
    <div class="income-section mb-24">
      <span class="text-secondary text-sm">Monthly Income</span>
      <div class="income-display" @click="startEditIncome" v-if="!editingIncome">
        <span class="dollar">$</span>
        <span class="amount">{{ fmt(store.income.value) }}</span>
        <span class="edit-hint text-secondary text-sm">click to edit</span>
      </div>
      <div class="income-edit" v-else>
        <span class="dollar">$</span>
        <input
          ref="incomeInput"
          type="number"
          v-model.number="store.income.value"
          @blur="finishEditIncome"
          @keydown.enter="finishEditIncome"
          class="income-input"
        />
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-cards mb-24">
      <div class="summary-card">
        <div class="label">Total Bills</div>
        <div class="value" style="color: var(--orange)">${{ fmt(store.totalBills.value) }}</div>
      </div>
      <div class="summary-card">
        <div class="label">Total Subscriptions</div>
        <div class="value" style="color: var(--accent)">${{ fmt(store.totalSubscriptions.value) }}</div>
      </div>
      <div class="summary-card">
        <div class="label">Remaining</div>
        <div class="value" :style="{ color: store.remaining.value >= 0 ? 'var(--green)' : 'var(--red)' }">
          ${{ fmt(store.remaining.value) }}
        </div>
      </div>
    </div>

    <!-- One-time expenses + adjusted remaining -->
    <div v-if="store.totalExpenses.value > 0" class="expense-banner mb-24">
      <div class="summary-cards">
        <div class="summary-card">
          <div class="label">One-Time Expenses</div>
          <div class="value" style="color: var(--red)">${{ fmt(store.totalExpenses.value) }}</div>
          <div class="text-sm text-secondary mt-4">{{ store.monthExpenses.value.length }} expense{{ store.monthExpenses.value.length === 1 ? '' : 's' }} this month</div>
        </div>
        <div class="summary-card">
          <div class="label">Adjusted Remaining</div>
          <div class="value" :style="{ color: store.adjustedRemaining.value >= 0 ? 'var(--green)' : 'var(--red)' }">
            ${{ fmt(store.adjustedRemaining.value) }}
          </div>
          <div class="text-sm text-secondary mt-4">After all expenses</div>
        </div>
      </div>
    </div>

    <!-- 50/30/20 Budget Breakdown -->
    <div class="mb-24">
      <h2 class="mb-16">50 / 30 / 20 Budget</h2>
      <div class="budget-categories">
        <div
          v-for="cat in store.categories"
          :key="cat"
          class="budget-card card"
          :class="{ expanded: expandedCategory === cat }"
        >
          <button class="budget-card-header" @click="toggleCategory(cat)">
            <div class="budget-card-left">
              <span class="cat-badge" :style="{ background: categoryColors[cat] }">
                {{ Math.round(store.categoryTargets[cat] * 100) }}%
              </span>
              <div>
                <div class="cat-name">{{ cat }}</div>
                <div class="cat-spent text-sm">
                  ${{ fmt(store.categoryBreakdown.value[cat].spent) }} of ${{ fmt(store.categoryBreakdown.value[cat].budgeted) }}
                </div>
              </div>
            </div>
            <div class="budget-card-right">
              <div
                class="cat-remaining"
                :style="{ color: store.categoryBreakdown.value[cat].remaining >= 0 ? 'var(--green)' : 'var(--red)' }"
              >
                {{ store.categoryBreakdown.value[cat].remaining >= 0 ? '' : '-' }}${{ fmt(Math.abs(store.categoryBreakdown.value[cat].remaining)) }}
                <span class="text-sm text-secondary">left</span>
              </div>
              <span class="chevron" :class="{ open: expandedCategory === cat }">&#9207;</span>
            </div>
          </button>

          <!-- Progress bar -->
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{
                width: Math.min(store.categoryBreakdown.value[cat].pctUsed, 100) + '%',
                background: store.categoryBreakdown.value[cat].pctUsed > 100 ? 'var(--red)' : categoryColors[cat]
              }"
            />
            <div v-if="store.categoryBreakdown.value[cat].pctUsed > 100" class="progress-overflow"
              :style="{ width: Math.min(store.categoryBreakdown.value[cat].pctUsed - 100, 100) + '%' }"
            />
          </div>
          <div class="progress-label text-sm text-secondary">
            {{ Math.round(store.categoryBreakdown.value[cat].pctUsed) }}% of {{ Math.round(store.categoryTargets[cat] * 100) }}% used
          </div>

          <!-- Reveal: item list -->
          <div v-if="expandedCategory === cat" class="cat-items">
            <div v-if="store.categoryBreakdown.value[cat].items.length === 0" class="text-secondary text-sm" style="padding: 12px 0;">
              No items in this category yet.
            </div>
            <div v-for="(item, i) in store.categoryBreakdown.value[cat].items" :key="i" class="cat-item">
              <div class="cat-item-left">
                <span class="item-type-dot" :style="{ background: item.type === 'bill' ? 'var(--orange)' : 'var(--accent)' }" />
                <span>{{ item.name }}</span>
                <span class="chip">{{ item.type === 'bill' ? 'Bill' : 'Sub' }}</span>
              </div>
              <span class="cat-item-amount">${{ fmt(item.amount) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Pie Charts -->
    <div class="chart-row mb-24">
      <PieChart
        title="Income Breakdown"
        :labels="incomeBreakdown.labels"
        :data="incomeBreakdown.data"
        :colors="incomeBreakdown.colors"
      />
      <PieChart
        title="Bills Breakdown"
        :labels="billsBreakdown.labels"
        :data="billsBreakdown.data"
        :colors="billsBreakdown.colors"
      />
      <PieChart
        title="Subscriptions Breakdown"
        :labels="subsBreakdown.labels"
        :data="subsBreakdown.data"
        :colors="subsBreakdown.colors"
      />
    </div>

    <!-- Calendar -->
    <CalendarView />
  </div>
</template>

<style scoped>
.income-section {
  text-align: center;
}

.income-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  padding: 8px;
  border-radius: var(--radius-md);
  transition: background 0.2s;
}

.income-display:hover {
  background: var(--surface);
}

.income-display .dollar {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-secondary);
}

.income-display .amount {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -1px;
}

.edit-hint {
  margin-left: 8px;
  opacity: 0;
  transition: opacity 0.2s;
}

.income-display:hover .edit-hint {
  opacity: 1;
}

.income-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.income-edit .dollar {
  font-size: 28px;
  font-weight: 600;
  color: var(--text-secondary);
}

.income-input {
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -1px;
  border: none;
  border-bottom: 2px solid var(--accent);
  background: transparent;
  text-align: center;
  width: 300px;
  padding: 4px;
  outline: none;
  font-family: var(--font);
  color: var(--text-primary);
}

.mt-4 { margin-top: 4px; }

.expense-banner .summary-cards {
  grid-template-columns: repeat(2, 1fr);
}

/* 50/30/20 Budget Cards */
.budget-categories {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.budget-card {
  padding: 0;
  overflow: hidden;
}

.budget-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 16px 20px;
  border: none;
  background: none;
  cursor: pointer;
  font-family: var(--font);
  text-align: left;
  color: var(--text-primary);
}

.budget-card-header:hover {
  background: var(--surface-secondary);
}

.budget-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.cat-name {
  font-size: 16px;
  font-weight: 600;
}

.cat-spent {
  color: var(--text-secondary);
}

.budget-card-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cat-remaining {
  font-size: 18px;
  font-weight: 700;
  text-align: right;
}

.cat-remaining .text-sm {
  font-weight: 400;
}

.chevron {
  font-size: 14px;
  color: var(--text-tertiary);
  transition: transform 0.25s ease;
}

.chevron.open {
  transform: rotate(180deg);
}

/* Progress bar */
.progress-track {
  height: 6px;
  background: var(--bg);
  margin: 0 20px;
  border-radius: 3px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.progress-overflow {
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  background: var(--red);
  opacity: 0.4;
  border-radius: 3px;
}

.progress-label {
  padding: 6px 20px 12px;
}

/* Reveal items */
.cat-items {
  border-top: 1px solid var(--border-light);
  padding: 4px 20px 12px;
  animation: revealItems 0.25s ease;
}

@keyframes revealItems {
  from { opacity: 0; max-height: 0; }
  to { opacity: 1; max-height: 500px; }
}

.cat-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-light);
}

.cat-item:last-child {
  border-bottom: none;
}

.cat-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-type-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.cat-item-amount {
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}
</style>
