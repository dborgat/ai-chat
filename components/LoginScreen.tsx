import { Button, Text, YStack } from 'tamagui'
import { useAuth } from '../context/AuthContext'

export function LoginScreen() {
  const { signIn } = useAuth()

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$6" backgroundColor="$background">
      <Text fontSize="$8" fontWeight="bold">AI Chat</Text>
      <Text color="$placeholderColor" textAlign="center">
        Iniciá sesión para continuar
      </Text>
      <Button onPress={signIn} theme="active" size="$5" borderRadius="$4" width="100%">
        Continuar con Google
      </Button>
    </YStack>
  )
}
