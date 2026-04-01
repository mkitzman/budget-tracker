<script setup>
import { ref, computed } from 'vue'
import OverviewTab from './components/OverviewTab.vue'
import BillsTab from './components/BillsTab.vue'
import SubscriptionsTab from './components/SubscriptionsTab.vue'
import ExpensesTab from './components/ExpensesTab.vue'
import { useStore } from './composables/useStore.js'
import { signInWithGoogle, signOut } from './composables/useFireSync.js'

const store = useStore()
const tabs = ['Overview', 'Bills', 'Subscriptions', 'Expenses']
const activeTab = ref('Overview')

// Theme
function getInitialTheme() {
  const saved = localStorage.getItem('bt-theme')
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const isDark = ref(getInitialTheme() === 'dark')
document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')

function toggleTheme() {
  isDark.value = !isDark.value
  const theme = isDark.value ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('bt-theme', theme)
}

// Listen for system changes when no manual override
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('bt-theme')) {
    isDark.value = e.matches
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light')
  }
})

const tabComponent = computed(() => {
  const map = { Overview: OverviewTab, Bills: BillsTab, Subscriptions: SubscriptionsTab, Expenses: ExpensesTab }
  return map[activeTab.value]
})

function handleTabKeydown(event, index) {
  let newIndex
  if (event.key === 'ArrowLeft') {
    newIndex = index === 0 ? tabs.length - 1 : index - 1
  } else if (event.key === 'ArrowRight') {
    newIndex = index === tabs.length - 1 ? 0 : index + 1
  } else {
    return
  }
  event.preventDefault()
  activeTab.value = tabs[newIndex]
  document.getElementById(`tab-${tabs[newIndex]}`)?.focus()
}
</script>

<template>
    <header class="app-header">
      <div>
        <h1 class="app-title">BittyBudget</h1>
        <p class="text-secondary text-sm">
          Subscriptions & bills at a glance
          <span v-if="store.syncStatus.uid.value" class="sync-badge" :class="{ syncing: store.syncStatus.isSyncing.value }" title="Synced to cloud">&#9679;</span>
        </p>
      </div>
      <div class="header-right">
        <div v-if="store.syncStatus.user.value" class="user-info" @click="signOut" role="button" tabindex="0" @keydown.enter="signOut" aria-label="Sign out">
          <img v-if="store.syncStatus.user.value.photoURL" :src="store.syncStatus.user.value.photoURL" class="avatar" referrerpolicy="no-referrer" alt="" />
          <span class="text-sm text-secondary">{{ store.syncStatus.user.value.displayName || store.syncStatus.user.value.email }}</span>
          <span class="sign-out-label text-sm">Sign out</span>
        </div>
        <a v-else class="sign-in-link text-sm" @click="signInWithGoogle">Sign in</a>
        <button class="theme-toggle" :class="{ dark: isDark }" @click="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
          <div class="toggle-track">
            <div class="toggle-thumb">
              <div class="crater crater-1" />
              <div class="crater crater-2" />
              <div class="crater crater-3" />
            </div>
            <div class="stars">
              <div class="star star-1" />
              <div class="star star-2" />
              <div class="star star-3" />
            </div>
          </div>
        </button>
      </div>
    </header>

    <nav class="tab-bar">
      <div class="tab-buttons" role="tablist">
        <button
          v-for="(tab, index) in tabs"
          :key="tab"
          :id="`tab-${tab}`"
          role="tab"
          :aria-selected="activeTab === tab"
          :tabindex="activeTab === tab ? 0 : -1"
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="activeTab = tab"
          @keydown="handleTabKeydown($event, index)"
        >
          {{ tab }}
        </button>
      </div>
      <select
        class="month-select"
        :value="store.selectedMonth.value"
        @change="store.selectedMonth.value = Number($event.target.value)"
      >
        <option v-for="(name, i) in store.monthNames" :key="i" :value="i">{{ name }}</option>
      </select>
    </nav>

    <main class="tab-content" role="tabpanel" :aria-labelledby="`tab-${activeTab}`">
      <transition name="fade" mode="out-in">
        <component :is="tabComponent" :key="activeTab" />
      </transition>
    </main>
</template>

<style scoped>
/* Header */
.app-title {
  font-family: 'Manrope', system-ui;
  font-weight: 800;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: background 0.2s;
}

.user-info:hover {
  background: var(--surface-secondary);
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.sign-out-label {
  color: var(--text-tertiary);
  font-weight: 500;
  transition: color 0.2s;
}

.user-info:hover .sign-out-label {
  color: var(--red);
}

.sign-in-link {
  color: var(--accent);
  cursor: pointer;
  font-weight: 500;
}

.sign-in-link:hover {
  text-decoration: underline;
}

/* Sun/Moon Toggle */
.theme-toggle {
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  outline: none;
}

.toggle-track {
  width: 56px;
  height: 28px;
  border-radius: 14px;
  background: linear-gradient(180deg, #74b9ff 0%, #81ecec 100%);
  position: relative;
  overflow: hidden;
  transition: background 0.4s ease;
}

.dark .toggle-track {
  background: linear-gradient(180deg, #2d3436 0%, #636e72 100%);
}

.toggle-thumb {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #ffeaa7;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: all 0.4s ease;
  box-shadow: 0 0 6px rgba(253, 203, 110, 0.6);
  z-index: 2;
}

.dark .toggle-thumb {
  left: 31px;
  background: #dfe6e9;
  box-shadow: 0 0 6px rgba(223, 230, 233, 0.4);
}

/* Craters (moon) */
.crater {
  position: absolute;
  border-radius: 50%;
  background: #b2bec3;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.dark .crater {
  opacity: 1;
}

.crater-1 { width: 5px; height: 5px; top: 4px; left: 6px; }
.crater-2 { width: 3px; height: 3px; top: 12px; left: 10px; }
.crater-3 { width: 4px; height: 4px; top: 8px; left: 3px; }

/* Stars */
.stars {
  position: absolute;
  inset: 0;
  z-index: 1;
}

.star {
  position: absolute;
  border-radius: 50%;
  background: #fff;
  opacity: 0;
  transition: opacity 0.4s ease;
}

.dark .star {
  opacity: 1;
}

.star-1 { width: 2px; height: 2px; top: 6px; left: 10px; }
.star-2 { width: 3px; height: 3px; top: 16px; left: 16px; }
.star-3 { width: 2px; height: 2px; top: 10px; left: 22px; }

/* Sync indicator */
.sync-badge {
  font-size: 8px;
  color: var(--green);
  margin-left: 6px;
  vertical-align: middle;
  transition: color 0.3s;
}

.sync-badge.syncing {
  color: var(--orange);
  animation: pulse 1s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.tab-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  border-bottom: 1px solid var(--border);
  margin-bottom: 28px;
}

.tab-buttons {
  display: flex;
}

.month-select {
  font-family: var(--font);
  font-size: 14px;
  font-weight: 500;
  padding: 4px 28px 4px 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--accent);
  cursor: pointer;
  appearance: none;
  width: auto;
  max-width: 150px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' fill='none' stroke='%238e8e93' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  transition: border-color 0.2s;
}

.month-select:hover {
  border-color: var(--accent);
}

.month-select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.15);
}

.tab-btn {
  padding: 10px 20px;
  border: none;
  background: none;
  font-family: var(--font);
  font-size: 15px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  position: relative;
  transition: color 0.2s ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  color: var(--accent);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2.5px;
  background: var(--accent);
  border-radius: 2px 2px 0 0;
  animation: slideIn 0.25s ease;
}

@keyframes slideIn {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}

.tab-content {
  min-height: 400px;
}
</style>
