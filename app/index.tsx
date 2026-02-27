import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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

  const onSend = useCallback(() => {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }, [input, sendMessage])

  const onPressSendIn = useCallback(() => { sendScale.value = withSpring(0.88) }, [sendScale])
  const onPressSendOut = useCallback(() => { sendScale.value = withSpring(1) }, [sendScale])

  useEffect(() => {
    for (const msg of messages) {
      if (!timestampsRef.current.has(msg.id)) {
        timestampsRef.current.set(msg.id, Date.now())
      }
    }
  }, [messages])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <YStack flex={1} background="$background" pt="$6">
        <XStack px="$4" pt="$2" justify="space-between" verticalAlign="center">
          <Button size="$3" chromeless onPress={signOut} variant="outlined">
            Log Out
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
        {error && (
          <YStack p="$2">
            <Text color="red" fontSize={11}>
              {error.message}
              {'\n'}
              {String(error)}
            </Text>
          </YStack>
        )}
        <ScrollView flex={1} p="$4">
          {messages.length > 0 ? messages.map((message) => (
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
          )) :  <Text p="$2" style={{ textAlign: 'center' }}>Bienvenido a AI CHAT 😄</Text>}
          {status === 'submitted' && <TypingDots />}
        </ScrollView>

        <XStack p="$4" gap="$2" borderTopWidth={1} borderColor="$borderColor">
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
