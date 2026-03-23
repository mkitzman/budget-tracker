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
</script>

<template>
  <!-- Sign-in screen -->
  <div v-if="!store.syncStatus.isSignedIn.value" class="sign-in-screen">
    <div class="sign-in-card">
      <h1>Budget Tracker</h1>
      <p class="text-secondary">Track subscriptions, bills & expenses</p>
      <button class="google-btn" @click="signInWithGoogle">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Sign in with Google
      </button>
      <p class="text-secondary text-sm sign-in-note">Sign in to sync your data across devices</p>
    </div>
  </div>

  <!-- Main app -->
  <template v-else>
    <header class="app-header">
      <div>
        <h1>Budget Tracker</h1>
        <p class="text-secondary text-sm">
          Subscriptions & bills at a glance
          <span v-if="store.syncStatus.uid.value" class="sync-badge" :class="{ syncing: store.syncStatus.isSyncing.value }" title="Synced to cloud">&#9679;</span>
        </p>
      </div>
      <div class="header-right">
        <div v-if="store.syncStatus.user.value" class="user-info" @click="signOut" title="Sign out">
          <img v-if="store.syncStatus.user.value.photoURL" :src="store.syncStatus.user.value.photoURL" class="avatar" referrerpolicy="no-referrer" />
          <span class="text-sm text-secondary">{{ store.syncStatus.user.value.displayName || store.syncStatus.user.value.email }}</span>
        </div>
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
      <div class="tab-buttons">
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="['tab-btn', { active: activeTab === tab }]"
          @click="activeTab = tab"
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

    <main class="tab-content">
      <transition name="fade" mode="out-in">
        <component :is="tabComponent" :key="activeTab" />
      </transition>
    </main>
  </template>
</template>

<style scoped>
/* Sign-in screen */
.sign-in-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}

.sign-in-card {
  text-align: center;
  padding: 48px 40px;
  background: var(--surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  max-width: 380px;
  width: 100%;
}

.sign-in-card h1 {
  margin-bottom: 4px;
}

.sign-in-card > .text-secondary {
  margin-bottom: 32px;
}

.google-btn {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 24px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text-primary);
  font-family: var(--font);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 24px;
}

.google-btn:hover {
  background: var(--surface-secondary);
  box-shadow: var(--shadow-md);
}

.google-btn:active {
  transform: scale(0.97);
}

.sign-in-note {
  margin-top: 16px;
}

/* Header */
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
  padding: 6px 28px 6px 12px;
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
