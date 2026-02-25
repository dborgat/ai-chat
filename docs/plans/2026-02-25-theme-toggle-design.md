# Theme Toggle Design — 2026-02-25

## Summary

Add a persisted light/dark theme toggle button to the chat screen. Theme preference is stored in AsyncStorage and survives app restarts. Falls back to the system color scheme on first launch.

## Architecture

State lives in a React Context (`AppThemeProvider`) created in `_layout.tsx`. Any component can read/toggle the theme via `useAppTheme()`. `_layout.tsx` splits into a `ThemedApp` sub-component that consumes the context and passes the resolved theme to `TamaguiProvider` and React Navigation's `ThemeProvider`.

## Components

### New: `context/ThemeContext.tsx`

- `ThemePreference = 'light' | 'dark'`
- `ThemeContextValue = { theme: ThemePreference, toggleTheme: () => void }`
- `AppThemeProvider`: on mount reads `AsyncStorage.getItem('app_theme')`, falls back to `useColorScheme()`. Writes to AsyncStorage on every toggle.
- `useAppTheme()`: typed `useContext` wrapper.

### Modified: `app/_layout.tsx`

```
RootLayout
  └─ LayoutAnimationConfig
       └─ AppThemeProvider
            └─ ThemedApp
                 ├─ TamaguiProvider defaultTheme={theme}
                 ├─ ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}
                 └─ Stack
```

### Modified: `app/index.tsx`

- `useAppTheme()` for `{ theme, toggleTheme }`
- ☀️/🌙 button in the top-right corner (absolute positioned or in a header row)
- No new icon library — emoji is sufficient

## Data Flow

```
AsyncStorage ──► AppThemeProvider (state: theme)
                      │
              useAppTheme() ◄── index.tsx (toggle button)
                      │
              ThemedApp ──► TamaguiProvider + ThemeProvider
```

## AsyncStorage key

`'app_theme'` — stores `'light'` or `'dark'`. Missing key = use system default.

## Files

- `context/ThemeContext.tsx` — new
- `app/_layout.tsx` — modified
- `app/index.tsx` — modified
