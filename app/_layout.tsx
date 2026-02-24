import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useColorScheme } from 'react-native'
import { TamaguiProvider } from 'tamagui'
import { PortalProvider } from '@tamagui/portal'
import { tamaguiConfig } from '../tamagui.config'

export default function RootLayout() {
  const colorScheme = useColorScheme()

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={colorScheme!}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <PortalProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </PortalProvider>
      </ThemeProvider>
    </TamaguiProvider>
  )
}