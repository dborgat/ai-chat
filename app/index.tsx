import { useCallback, useMemo, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform } from 'react-native'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
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
import { MessageBubble } from '../components/MessageBubble'
import { useAppTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'

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
  const { signOut, user } = useAuth()
  const [input, setInput] = useState('')
  const timestampsRef = useRef<Map<string, number>>(new Map())
  const [visibleTimestampId, setVisibleTimestampId] = useState<string | null>(null)
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

  for (const msg of messages) {
    if (!timestampsRef.current.has(msg.id)) {
      timestampsRef.current.set(msg.id, Date.now())
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} backgroundColor="$background" paddingTop={60}>
        <XStack paddingHorizontal="$4" paddingTop="$2" justifyContent="space-between" alignItems="center">
          <Button size="$3" chromeless onPress={signOut}>
            Salir
          </Button>
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
              <MessageBubble
                message={message}
                isUser={message.role === 'user'}
                userPicture={user?.picture ?? ''}
                timestamp={timestampsRef.current.get(message.id)}
                showTimestamp={visibleTimestampId === message.id}
                onPress={() =>
                  setVisibleTimestampId((id) => (id === message.id ? null : message.id))
                }
              />
            </Animated.View>
          ))}
          {status === 'submitted' && <TypingDots />}
        </ScrollView>

        <XStack padding="$4" gap="$2" borderTopWidth={1} borderColor="$borderColor">
          <Input
            flex={1}
            value={input}
            onChangeText={setInput}
            placeholderTextColor='$placeholderColor'
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
