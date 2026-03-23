<script setup>
import { ref, computed } from 'vue'
import { useStore } from '../composables/useStore.js'

const store = useStore()

const sortKey = ref('name')
const sortAsc = ref(true)
const confirmDeleteId = ref(null)
const tagInput = ref({})
const sortFrozen = ref(false)

const frequencies = ['Monthly', 'Quarterly', 'Yearly']

function toggleSort(key) {
  if (sortKey.value === key) {
    sortAsc.value = !sortAsc.value
  } else {
    sortKey.value = key
    sortAsc.value = true
  }
}

function sortArrow(key) {
  if (sortKey.value !== key) return '\u2195'
  return sortAsc.value ? '\u2191' : '\u2193'
}

const sorted = computed(() => {
  const arr = [...store.subscriptions.value]
  if (sortFrozen.value) return arr
  arr.sort((a, b) => {
    let va, vb
    if (sortKey.value === 'monthlyCost') {
      va = store.monthlyAmount(a)
      vb = store.monthlyAmount(b)
    } else if (sortKey.value === 'yearlyCost') {
      va = store.yearlyAmount(a)
      vb = store.yearlyAmount(b)
    } else {
      va = a[sortKey.value]
      vb = b[sortKey.value]
    }
    if (sortKey.value === 'cost' || sortKey.value === 'renewalDate') {
      va = Number(va) || 0
      vb = Number(vb) || 0
    } else if (typeof va === 'string') {
      va = va.toLowerCase()
      vb = (vb || '').toLowerCase()
    }
    if (va < vb) return sortAsc.value ? -1 : 1
    if (va > vb) return sortAsc.value ? 1 : -1
    return 0
  })
  return arr
})

function updateField(id, field, event) {
  let val = event.target.value
  if (field === 'cost' || field === 'renewalDate') val = Number(val) || 0
  store.updateSubscription(id, field, val)
}

function addTag(id) {
  const tag = (tagInput.value[id] || '').trim()
  if (!tag) return
  const sub = store.subscriptions.value.find(s => s.id === id)
  if (sub && !sub.tags.includes(tag)) {
    sub.tags.push(tag)
  }
  tagInput.value[id] = ''
}

function removeTag(id, tag) {
  const sub = store.subscriptions.value.find(s => s.id === id)
  if (sub) {
    sub.tags = sub.tags.filter(t => t !== tag)
  }
}

function confirmDelete(id) {
  confirmDeleteId.value = id
}

function doDelete() {
  store.deleteSubscription(confirmDeleteId.value)
  confirmDeleteId.value = null
}

const totalMonthly = computed(() =>
  store.subscriptions.value
    .reduce((sum, s) => sum + store.monthlyAmount(s), 0)
)

const totalYearly = computed(() =>
  store.subscriptions.value
    .reduce((sum, s) => sum + store.yearlyAmount(s), 0)
)

function addSubscription() {
  store.addSubscription()
  sortFrozen.value = true
}

function onTableBlur(event) {
  const wrapper = event.currentTarget
  setTimeout(() => {
    if (!wrapper.contains(document.activeElement)) {
      sortFrozen.value = false
    }
  }, 0)
}

const fmt = (n) => Number(n).toFixed(2)
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-16">
      <h2>Subscriptions</h2>
      <button class="btn" @click="addSubscription">+ Add Subscription</button>
    </div>

    <div v-if="store.subscriptions.value.length === 0" class="empty-state">
      <div class="icon">&#128179;</div>
      <p>No subscriptions yet. Add your first subscription to track it.</p>
    </div>

    <div v-else class="card table-wrapper" @focusout="onTableBlur">
      <table class="data-table sub-table">
        <thead>
          <tr>
            <th :class="{ sorted: sortKey === 'name' }" @click="toggleSort('name')">
              Name <span class="sort-arrow">{{ sortArrow('name') }}</span>
            </th>
            <th :class="{ sorted: sortKey === 'category' }" @click="toggleSort('category')">
              Category <span class="sort-arrow">{{ sortArrow('category') }}</span>
            </th>
            <th>Tags</th>
            <th :class="{ sorted: sortKey === 'frequency' }" @click="toggleSort('frequency')">
              Frequency <span class="sort-arrow">{{ sortArrow('frequency') }}</span>
            </th>
            <th :class="{ sorted: sortKey === 'renewalDate' }" @click="toggleSort('renewalDate')">
              Day <span class="sort-arrow">{{ sortArrow('renewalDate') }}</span>
            </th>
            <th class="money-col" :class="{ sorted: sortKey === 'cost' }" @click="toggleSort('cost')">
              Cost <span class="sort-arrow">{{ sortArrow('cost') }}</span>
            </th>
            <th class="money-col" :class="{ sorted: sortKey === 'monthlyCost' }" @click="toggleSort('monthlyCost')">
              Monthly <span class="sort-arrow">{{ sortArrow('monthlyCost') }}</span>
            </th>
            <th class="money-col" :class="{ sorted: sortKey === 'yearlyCost' }" @click="toggleSort('yearlyCost')">
              Yearly <span class="sort-arrow">{{ sortArrow('yearlyCost') }}</span>
            </th>
            <th>Notes</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="sub in sorted" :key="sub.id">
            <td class="cell-edit">
              <input
                type="text"
                :value="sub.name"
                placeholder="Name"
                @input="updateField(sub.id, 'name', $event)"
              />
            </td>
            <td class="cell-edit">
              <select :value="sub.category || 'Needs'" @change="updateField(sub.id, 'category', $event)">
                <option v-for="c in store.categories" :key="c" :value="c">{{ c }}</option>
              </select>
            </td>
            <td>
              <div class="tags-cell">
                <span v-for="tag in sub.tags" :key="tag" class="chip" @click="removeTag(sub.id, tag)">
                  {{ tag }} &times;
                </span>
                <input
                  type="text"
                  v-model="tagInput[sub.id]"
                  placeholder="+ tag"
                  class="tag-input"
                  @keydown.enter="addTag(sub.id)"
                />
              </div>
            </td>
            <td class="cell-edit">
              <select :value="sub.frequency" @change="updateField(sub.id, 'frequency', $event)">
                <option v-for="f in frequencies" :key="f" :value="f">{{ f }}</option>
              </select>
            </td>
            <td class="cell-edit">
              <input
                type="number"
                :value="sub.renewalDate"
                min="1" max="31"
                @input="updateField(sub.id, 'renewalDate', $event)"
                style="width: 60px"
              />
            </td>
            <td class="cell-edit money-col">
              <div class="cost-cell">
                <span class="dollar-prefix">$</span>
                <input
                  type="number"
                  :value="sub.cost"
                  @input="updateField(sub.id, 'cost', $event)"
                  style="width: 90px"
                />
              </div>
            </td>
            <td class="read-only money-col">${{ fmt(store.monthlyAmount(sub)) }}</td>
            <td class="read-only money-col">${{ fmt(store.yearlyAmount(sub)) }}</td>
            <td class="cell-edit">
              <input
                type="text"
                :value="sub.notes"
                placeholder="Notes"
                @input="updateField(sub.id, 'notes', $event)"
              />
            </td>
            <td>
              <button class="btn-icon" title="Delete" @click="confirmDelete(sub.id)">&#128465;</button>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="totals-row">
            <td colspan="6" style="text-align: right; font-weight: 600;">Totals:</td>
            <td class="read-only money-col" style="font-weight: 700; color: var(--accent);">${{ fmt(totalMonthly) }}</td>
            <td class="read-only money-col" style="font-weight: 700; color: var(--accent);">${{ fmt(totalYearly) }}</td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Confirm delete dialog -->
    <div v-if="confirmDeleteId" class="confirm-overlay" @click.self="confirmDeleteId = null">
      <div class="confirm-dialog">
        <h3>Delete Subscription?</h3>
        <p>This action cannot be undone.</p>
        <div class="actions">
          <button class="btn btn-secondary" @click="confirmDeleteId = null">Cancel</button>
          <button class="btn btn-danger" @click="doDelete">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tags-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
}

.tags-cell .chip {
  cursor: pointer;
  transition: opacity 0.15s;
}

.tags-cell .chip:hover {
  opacity: 0.6;
}

.tag-input {
  border: none;
  background: transparent;
  padding: 4px 6px;
  font-size: 12px;
  width: 60px;
  outline: none;
}

.tag-input:focus {
  box-shadow: none;
}

.read-only {
  padding: 10px 12px;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.money-col {
  text-align: right;
}

.money-col input {
  text-align: right;
}

.cost-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.dollar-prefix {
  font-size: 14px;
  color: var(--text-secondary);
}

.totals-row td {
  border-top: 2px solid var(--border);
  padding-top: 12px;
}

.sub-table {
  min-width: 900px;
}

.sub-table th:first-child,
.sub-table td:first-child {
  min-width: 160px;
}

.sub-table .read-only {
  white-space: nowrap;
}
</style>
