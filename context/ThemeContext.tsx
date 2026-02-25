import AsyncStorage from '@react-native-async-storage/async-storage'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'

type ThemePreference = 'light' | 'dark'

interface ThemeContextValue {
  theme: ThemePreference
  toggleTheme: () => void
}

const STORAGE_KEY = 'app_theme'

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
})

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const systemTheme = useColorScheme()
  const [theme, setTheme] = useState<ThemePreference>(systemTheme === 'dark' ? 'dark' : 'light')

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') {
          setTheme(saved)
        }
      })
      .catch(() => {
        // Storage unavailable — system theme fallback remains in state
      })
  }, [])

  const toggleTheme = () => {
    setTheme((prev) => {
      const next: ThemePreference = prev === 'dark' ? 'light' : 'dark'
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
      return next
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext)
}
