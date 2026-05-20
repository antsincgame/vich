import { useCallback, useEffect, useState } from 'react'

/** Persisted state hook backed by localStorage. Data never leaves the browser. */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore quota / private-mode write failures; app still works in-memory.
    }
  }, [key, value])

  const set = useCallback((v: T | ((prev: T) => T)) => setValue(v), [])
  return [value, set]
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}
