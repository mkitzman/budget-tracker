<script setup>
import { ref, computed, onMounted, onBeforeUnmount, provide } from 'vue'
import OverviewTab from './components/OverviewTab.vue'
import BillsTab from './components/BillsTab.vue'
import SubscriptionsTab from './components/SubscriptionsTab.vue'
import ExpensesTab from './components/ExpensesTab.vue'
import AboutTab from './components/AboutTab.vue'
import BonsaiIcon from './components/BonsaiIcon.vue'
import { useStore } from './composables/useStore.js'
import { signInWithGoogle, signOut } from './composables/useFireSync.js'

const store = useStore()
const tabs = ['Overview', 'Bills', 'Subscriptions', 'Expenses', 'About']
const activeTab = ref('Overview')

const userMenuOpen = ref(false)
const userMenuRef = ref(null)
function toggleUserMenu() { userMenuOpen.value = !userMenuOpen.value }
function closeUserMenu() { userMenuOpen.value = false }
function handleSignOut() { closeUserMenu(); signOut() }
function handleClickOutside(e) {
  if (userMenuOpen.value && userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    closeUserMenu()
  }
}
onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

// Theme
function getInitialTheme() {
  const saved = localStorage.getItem('bt-theme')
  if (saved) return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const isDark = ref(getInitialTheme() === 'dark')
document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light')

// Palette (color theme)
const PALETTES = [
  { id: 'apple', label: 'Modern', swatches: ['#0a84ff', '#2A684A', '#bf5af2'] },
  { id: 'bonsai', label: 'Bonsai', swatches: ['#4F128C', '#2A684A', '#b8860b'] },
]
const palette = ref(localStorage.getItem('bt-palette') || 'apple')
function applyPalette(p) {
  if (p === 'apple') document.documentElement.removeAttribute('data-palette')
  else document.documentElement.setAttribute('data-palette', p)
}
applyPalette(palette.value)
provide('palette', palette)
function setPalette(p) {
  palette.value = p
  localStorage.setItem('bt-palette', p)
  applyPalette(p)
}

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
  const map = { Overview: OverviewTab, Bills: BillsTab, Subscriptions: SubscriptionsTab, Expenses: ExpensesTab, About: AboutTab }
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
        <div class="app-title-row">
          <h1 class="app-title">BonsaiBudget</h1>
          <div class="app-icon-tile">
            <BonsaiIcon class="app-icon" />
          </div>
        </div>
        <p class="text-secondary text-sm">
          Cultivating Your Financial Future
          <span v-if="store.syncStatus.uid.value" class="sync-badge" :class="{ syncing: store.syncStatus.isSyncing.value }" title="Synced to cloud">&#9679;</span>
        </p>
      </div>
      <div class="header-right">
        <div v-if="store.syncStatus.user.value" class="user-menu" ref="userMenuRef">
          <button class="avatar-btn" @click="toggleUserMenu" :aria-expanded="userMenuOpen" aria-haspopup="true" aria-label="Account menu">
            <img v-if="store.syncStatus.user.value.photoURL" :src="store.syncStatus.user.value.photoURL" class="avatar" referrerpolicy="no-referrer" alt="" />
          </button>
          <div v-if="userMenuOpen" class="user-dropdown" role="menu">
            <div class="user-dropdown-header">
              <img v-if="store.syncStatus.user.value.photoURL" :src="store.syncStatus.user.value.photoURL" class="avatar avatar-lg" referrerpolicy="no-referrer" alt="" />
              <div class="user-dropdown-identity">
                <div class="user-dropdown-name">{{ store.syncStatus.user.value.displayName || store.syncStatus.user.value.email }}</div>
                <div v-if="store.syncStatus.user.value.displayName" class="user-dropdown-email text-sm text-secondary">{{ store.syncStatus.user.value.email }}</div>
              </div>
            </div>
            <div class="user-dropdown-divider" />
            <div class="user-dropdown-section">
              <div class="user-dropdown-label">Color palette</div>
              <div class="palette-options">
                <button
                  v-for="p in PALETTES"
                  :key="p.id"
                  class="palette-option"
                  :class="{ active: palette === p.id }"
                  @click.stop="setPalette(p.id)"
                >
                  <span class="palette-swatches">
                    <span v-for="c in p.swatches" :key="c" class="palette-swatch" :style="{ background: c }" />
                  </span>
                  <span>{{ p.label }}</span>
                </button>
              </div>
            </div>
            <div class="user-dropdown-divider" />
            <div class="user-dropdown-item theme-row" role="menuitem">
              <span>{{ isDark ? 'Dark mode' : 'Light mode' }}</span>
              <button class="theme-toggle" :class="{ dark: isDark }" @click.stop="toggleTheme" :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'">
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
            <div class="user-dropdown-divider" />
            <button class="user-dropdown-item" role="menuitem" @click="handleSignOut">Sign out</button>
          </div>
        </div>
        <a v-else class="sign-in-link text-sm" @click="signInWithGoogle">Sign in</a>
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

.app-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.app-icon-tile {
  position: relative;
  width: 1em;
  height: 1em;
  font-size: var(--app-title-size, 2rem);
  background: var(--green);
  border-radius: 0.18em;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.app-icon {
  width: 78%;
  height: 78%;
  color: #ffffff;
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

.user-menu {
  position: relative;
}

.avatar-btn {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  border-radius: 50%;
  line-height: 0;
  transition: box-shadow 0.2s;
}

.avatar-btn:hover,
.avatar-btn:focus-visible {
  box-shadow: 0 0 0 2px var(--green);
  outline: none;
}

.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: block;
}

.avatar-lg {
  width: 40px;
  height: 40px;
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 240px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px 0;
  z-index: 100;
}

.user-dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px 12px;
}

.user-dropdown-identity {
  min-width: 0;
}

.user-dropdown-name {
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown-email {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-dropdown-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 0;
}

.user-dropdown-item {
  display: block;
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  padding: 10px 16px;
  font: inherit;
  color: var(--text-primary);
  cursor: pointer;
}

.user-dropdown-item:hover {
  background: var(--surface-secondary);
  color: var(--red);
}

.theme-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: default;
}

.user-dropdown-section {
  padding: 8px 16px;
}

.user-dropdown-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-tertiary);
  margin-bottom: 8px;
}

.palette-options {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.palette-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  background: none;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font: inherit;
  color: var(--text-primary);
  text-align: left;
}

.palette-option:hover {
  background: var(--surface-secondary);
}

.palette-option.active {
  border-color: var(--accent);
  background: var(--surface-secondary);
}

.palette-swatches {
  display: inline-flex;
  gap: 2px;
}

.palette-swatch {
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 1px solid var(--border);
}

.theme-row:hover {
  background: transparent;
  color: var(--text-primary);
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
  gap: 12px;
  position: relative;
  border-bottom: 1px solid var(--border);
  margin-bottom: 28px;
}

.tab-buttons {
  display: flex;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.tab-buttons::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  flex-shrink: 0;
}

.month-select {
  flex-shrink: 0;
}

.month-select {
  font-family: var(--font);
  font-size: 14px;
  font-weight: 500;
  padding: 4px 28px 4px 12px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--green);
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
  border-color: var(--green);
}

.month-select:focus {
  outline: none;
  border-color: var(--green);
  box-shadow: 0 0 0 3px rgba(42, 104, 74, 0.15);
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
  color: var(--green);
}

.tab-btn.active::after {
  content: '';
  position: absolute;
  bottom: -1px;
  left: 0;
  right: 0;
  height: 2.5px;
  background: var(--green);
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
