import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { LayoutAnimationConfig } from 'react-native-reanimated'
import { TamaguiProvider } from 'tamagui'
import { PortalProvider } from '@tamagui/portal'
import { tamaguiConfig } from '../tamagui.config'
import { AppThemeProvider, useAppTheme } from '../context/ThemeContext'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { LoginScreen } from '../components/LoginScreen'

function ThemedApp() {
  const { theme } = useAppTheme()
  const { user, loading } = useAuth()

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <PortalProvider>
          {loading ? null : user ? (
            <Stack screenOptions={{ headerShown: false }} />
          ) : (
            <LoginScreen />
          )}
        </PortalProvider>
      </ThemeProvider>
    </TamaguiProvider>
  )
}

export default function RootLayout() {
  return (
    <LayoutAnimationConfig skipEntering>
      <AppThemeProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </AppThemeProvider>
    </LayoutAnimationConfig>
  )
}
