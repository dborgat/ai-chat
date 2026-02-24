import { Platform } from 'react-native'
import Constants from 'expo-constants'

export function getBaseUrl() {
  if (Platform.OS === 'web') return ''
  // hostUri es algo como "192.168.1.5:8081" — la IP real del dev server
  const hostUri = Constants.expoConfig?.hostUri
  if (hostUri) return `http://${hostUri}`
  return `http://localhost:8081`
}

export function getApiUrl(path: string) {
  return `${getBaseUrl()}${path}`
}
