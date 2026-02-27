import { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'AI Chat',
  slug: 'ai-chat',
  userInterfaceStyle: 'automatic', // esto habilita light/dark del sistema
  scheme: 'ai-chat',
  android: {
    package: 'com.aichat',
    intentFilters: [
      {
        action: 'VIEW',
        data: [{ scheme: 'com.googleusercontent.apps.379093049292-e6sf908jfereipvk1pdoqqrqequn9end' }],
        category: ['BROWSABLE', 'DEFAULT'],
      },
    ],
  },
  web: {
    bundler: 'metro',
    output: 'server',
  },
})