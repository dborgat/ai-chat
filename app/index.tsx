import { useCallback, useMemo, useState } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart } from 'ai'
import { fetch as expoFetch } from 'expo/fetch'
import Animated, {
  FadeInDown,
  LinearTransition,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { YStack, XStack, Input, Button, Text, ScrollView } from 'tamagui'
import { getApiUrl } from '../utils'
import { TypingDots } from '../components/TypingDots'
import { useAppTheme } from '../context/ThemeContext'

export default function ChatScreen() {
  const transport = useMemo(
    () => new DefaultChatTransport({
      api: getApiUrl('/api/chat'),
      fetch: expoFetch as unknown as typeof globalThis.fetch,
    }),
    [],
  )
  const { messages, sendMessage, status, error } = useChat({ transport })
  const { theme, toggleTheme } = useAppTheme()
  const [input, setInput] = useState('')
  const sendScale = useSharedValue(1)
  const sendAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }))

  const onSend = () => {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  const onPressSendIn = useCallback(() => { sendScale.value = withSpring(0.88) }, [sendScale])
  const onPressSendOut = useCallback(() => { sendScale.value = withSpring(1) }, [sendScale])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} backgroundColor="$background" paddingTop={60}>
        <XStack paddingHorizontal="$4" paddingTop="$2" justifyContent="flex-end">
          <Button
            size="$3"
            chromeless
            onPress={toggleTheme}
            accessibilityLabel={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </XStack>
        {error && <Text padding="$2" color="red" fontSize={11}>{error.message}{'\n'}{String(error)}</Text>}
        <ScrollView flex={1} padding="$4">
          {messages.map((message) => (
            <Animated.View
              key={message.id}
              entering={FadeInDown.springify().duration(350)}
              layout={LinearTransition.springify()}
            >
              <YStack
                alignSelf={message.role === 'user' ? 'flex-end' : 'flex-start'}
                backgroundColor={message.role === 'user' ? '$blue10' : '$gray5'}
                borderRadius="$4"
                padding="$3"
                marginBottom="$2"
                maxWidth="80%"
              >
                <Text color={message.role === 'user' ? 'white' : '$color'}>
                  {message.parts
                    .filter(isTextUIPart)
                    .map((part) => part.text)
                    .join('')}
                </Text>
              </YStack>
            </Animated.View>
          ))}
          {status === 'submitted' && <TypingDots />}
        </ScrollView>

        <XStack padding="$4" gap="$2" borderTopWidth={1} borderColor="$borderColor">
          <Input
            flex={1}
            value={input}
            onChangeText={setInput}
            placeholder="Escribe un mensaje..."
            onSubmitEditing={onSend}
          />
          <Animated.View style={sendAnimStyle}>
            <Button
              onPressIn={onPressSendIn}
              onPressOut={onPressSendOut}
              onPress={onSend}
              disabled={status !== 'ready'}
            >
              Enviar
            </Button>
          </Animated.View>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  )
}
