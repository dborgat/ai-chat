import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { LayoutAnimationConfig } from 'react-native-reanimated'
import { TamaguiProvider } from 'tamagui'
import { PortalProvider } from '@tamagui/portal'
import { tamaguiConfig } from '../tamagui.config'
import { AppThemeProvider, useAppTheme } from '../context/ThemeContext'

function ThemedApp() {
  const { theme } = useAppTheme()

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <PortalProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </PortalProvider>
      </ThemeProvider>
    </TamaguiProvider>
  )
}

export default function RootLayout() {
  return (
    <LayoutAnimationConfig skipEntering>
      <AppThemeProvider>
        <ThemedApp />
      </AppThemeProvider>
    </LayoutAnimationConfig>
  )
}
