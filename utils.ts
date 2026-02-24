import { Platform } from 'react-native'

export function getBaseUrl() {
  if (Platform.OS === 'web') return ''
  // En mobile, apunta al server de desarrollo
  const debuggerHost =
    // @ts-ignore
    global.__expo_dev_client_url?.hostname ?? 'localhost'
  return `http://${debuggerHost}:8081`
}

export function getApiUrl(path: string) {
  return `${getBaseUrl()}${path}`
}