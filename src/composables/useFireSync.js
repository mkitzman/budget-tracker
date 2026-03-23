import { ref, watch } from 'vue'
import { doc, setDoc, onSnapshot } from 'firebase/firestore'
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '../firebase.js'

const uid = ref(null)
const isReady = ref(false)
const isSyncing = ref(false)

// Single shared auth init
let authInitialized = false

function initAuth() {
  if (authInitialized) return
  authInitialized = true

  onAuthStateChanged(auth, (user) => {
    if (user) {
      uid.value = user.uid
    }
  })

  signInAnonymously(auth).catch((err) => {
    console.warn('Firebase auth failed, using localStorage only:', err.message)
  })
}

/**
 * Syncs a reactive ref to a Firestore document field.
 * Falls back to localStorage if Firebase is unavailable.
 *
 * @param {string} localKey - localStorage key (used as fallback and field name)
 * @param {*} defaultValue - default value if nothing stored
 */
export function useFireSync(localKey, defaultValue) {
  // Load from localStorage first (instant, works offline)
  const data = ref(loadLocal(localKey, defaultValue))

  initAuth()

  let unsubscribe = null
  let skipNextRemote = false
  let writeTimeout = null

  // When user authenticates, start Firestore sync
  watch(uid, (id) => {
    if (!id) return

    const docRef = doc(db, 'users', id, 'data', localKey)

    // Listen for remote changes
    unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const remote = snap.data().value
        if (skipNextRemote) {
          skipNextRemote = false
          return
        }
        // Only update if different from local (avoid loops)
        if (JSON.stringify(remote) !== JSON.stringify(data.value)) {
          data.value = remote
          saveLocal(localKey, remote)
        }
      }
      isReady.value = true
    }, (err) => {
      console.warn(`Firestore listener error for ${localKey}:`, err.message)
      isReady.value = true
    })
  })

  // Watch local changes → write to Firestore (debounced)
  watch(data, (val) => {
    // Always save to localStorage immediately
    saveLocal(localKey, val)

    // Debounce Firestore writes
    clearTimeout(writeTimeout)
    writeTimeout = setTimeout(() => {
      if (!uid.value) return
      const docRef = doc(db, 'users', uid.value, 'data', localKey)
      skipNextRemote = true
      isSyncing.value = true
      setDoc(docRef, { value: val }, { merge: true })
        .catch((err) => {
          console.warn(`Firestore write error for ${localKey}:`, err.message)
          skipNextRemote = false
        })
        .finally(() => {
          isSyncing.value = false
        })
    }, 500)
  }, { deep: true })

  return data
}

export function useSyncStatus() {
  return { uid, isReady, isSyncing }
}

// localStorage helpers
function loadLocal(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key)
    return raw !== null ? JSON.parse(raw) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}
