import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, isTextUIPart } from 'ai'
import { fetch as expoFetch } from 'expo/fetch'
import { YStack, XStack, Input, Button, Text, ScrollView } from 'tamagui'
import { getApiUrl } from '../utils'

export default function ChatScreen() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: getApiUrl('/api/chat'),
      fetch: expoFetch as unknown as typeof globalThis.fetch,
    }),
  })
  const [input, setInput] = useState('')

  const onSend = () => {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={60}>
      <Text padding="$2" color="$color" opacity={0.5} fontSize={12}>status: {status}</Text>
      {error && <Text padding="$2" color="red" fontSize={11}>{error.message}{'\n'}{String(error)}</Text>}
      <ScrollView flex={1} padding="$4">
        {messages.map((message) => (
          <YStack
            key={message.id}
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
        ))}
      </ScrollView>

      <XStack padding="$4" gap="$2" borderTopWidth={1} borderColor="$borderColor">
        <Input
          flex={1}
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
          onSubmitEditing={onSend}
        />
        <Button onPress={onSend} disabled={status !== 'ready'}>
          Enviar
        </Button>
      </XStack>
    </YStack>
  )
}

