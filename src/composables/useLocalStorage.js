import { ref, watch } from 'vue'

export function useLocalStorage(key, defaultValue) {
  const data = ref(load())

  function load() {
    try {
      const raw = localStorage.getItem(key)
      return raw !== null ? JSON.parse(raw) : defaultValue
    } catch {
      return defaultValue
    }
  }

  let timeout = null
  watch(data, (val) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      localStorage.setItem(key, JSON.stringify(val))
    }, 300)
  }, { deep: true })

  return data
}
