import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UnitSystem = 'g' | 'oz'

interface PrefsState {
  units: UnitSystem
  setUnits: (u: UnitSystem) => void
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      units: 'g',
      setUnits: (units) => set({ units }),
    }),
    { name: 'vegan-tracker-prefs' }
  )
)

/** Convert grams → display value + label */
export function displayWeight(grams: number, units: UnitSystem): string {
  if (units === 'oz') {
    return `${(grams / 28.3495).toFixed(1)} oz`
  }
  return `${Math.round(grams)} g`
}
