import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'AI Chat',
  slug: 'ai-chat',
  userInterfaceStyle: 'automatic', // esto habilita light/dark del sistema
  scheme: 'ai-chat',
  android: {
    package: 'com.aichat',
  },
  web: {
    bundler: 'metro',
    output: 'server',
  },
})