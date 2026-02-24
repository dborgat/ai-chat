import { useState } from 'react'
import { useChat } from '@ai-sdk/react'
import { fetch as expoFetch } from 'expo/fetch'
import { YStack, XStack, Input, Button, Text, ScrollView } from 'tamagui'
import { getApiUrl } from '../utils'

export default function ChatScreen() {
  const { messages, input, setInput, handleSubmit, isLoading } = useChat({
    api: getApiUrl('/api/chat'),
    fetch: expoFetch as unknown as typeof globalThis.fetch,
  })

  const onSend = () => {
    if (!input.trim()) return
    handleSubmit()
  }

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={60}>
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
                .filter((part) => part.type === 'text')
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
        <Button onPress={onSend} disabled={isLoading}>
          Enviar
        </Button>
      </XStack>
    </YStack>
  )
}

