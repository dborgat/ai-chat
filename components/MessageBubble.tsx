import * as Clipboard from 'expo-clipboard'
import { isTextUIPart, UIMessage } from 'ai'
import { memo, useCallback } from 'react'
import { Image, Pressable, StyleSheet } from 'react-native'
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'
import { Text, useTheme, View, XStack, YStack } from 'tamagui'

interface MessageBubbleProps {
  message: UIMessage
  isUser: boolean
  userPicture: string
  timestamp: number | undefined
  showTimestamp: boolean
  onPress: () => void
}

export const MessageBubble = memo(function MessageBubble({
  message,
  isUser,
  userPicture,
  timestamp,
  showTimestamp,
  onPress,
}: MessageBubbleProps) {
  const theme = useTheme()
  const scale = useSharedValue(1)

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const text = message.parts.filter(isTextUIPart).map((p) => p.text).join('')
  const bubbleColor = isUser ? theme.blue10.val : theme.color3.val

  const onPressIn = useCallback(() => { scale.value = withSpring(0.95) }, [scale])
  const onPressOut = useCallback(() => { scale.value = withSpring(1) }, [scale])

  const handleLongPress = useCallback(async () => {
    await Clipboard.setStringAsync(text)
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1)
    })
  }, [text, scale])

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <YStack
      mb="$4"
      style={{ alignSelf: isUser ? 'flex-end' : 'flex-start', alignItems: isUser ? 'flex-end' : 'flex-start' }}
    >
      <XStack
        gap="$3"
        style={{ alignItems: 'flex-end', flexDirection: isUser ? 'row-reverse' : 'row' }}
      >
        {/* Avatar */}
        <YStack
          width={32}
          height={32}
          backgroundColor={isUser ? '$blue5' : '$color4'}
          style={{ borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}
        >
          {isUser && userPicture ? (
            <Image source={{ uri: userPicture }} style={styles.avatar} />
          ) : (
            <Text fontSize={10} fontWeight="bold" color="$color">
              {isUser ? 'User' : 'IA'}
            </Text>
          )}
        </YStack>

        {/* Bubble */}
        <Pressable
          onPress={onPress}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          onLongPress={handleLongPress}
        >
          <Animated.View style={animStyle}>
            <YStack position="relative">
              <YStack
                backgroundColor={isUser ? '$blue10' : '$color3'}
                borderRadius="$4"
                padding="$3"
                maxWidth={260}
              >
                <Text color={isUser ? 'white' : '$color'}>{text}</Text>
              </YStack>
              {/* Tail triangle */}
              <View
                position="absolute"
                b={6}
                {...(isUser ? { right: -7 } : { left: -7 })}
                style={
                  isUser
                    ? [styles.tailRight, { borderLeftColor: bubbleColor }]
                    : [styles.tailLeft, { borderRightColor: bubbleColor }]
                }
              />
            </YStack>
          </Animated.View>
        </Pressable>
      </XStack>

      {/* Timestamp */}
      {showTimestamp && formattedTime ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
        >
          <Text
            fontSize={11}
            color="$placeholderColor"
            mt="$1"
            px="$9"
          >
            {formattedTime}
          </Text>
        </Animated.View>
      ) : null}
    </YStack>
  )
})

const styles = StyleSheet.create({
  avatar: {
    width: 32,
    height: 32,
  },
  // Right-pointing triangle — user message tail (right side)
  tailRight: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderTopColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
    borderLeftWidth: 8,
    // borderLeftColor set inline from theme
  },
  // Left-pointing triangle — AI message tail (left side)
  tailLeft: {
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderTopColor: 'transparent',
    borderBottomWidth: 6,
    borderBottomColor: 'transparent',
    borderRightWidth: 8,
    // borderRightColor set inline from theme
  },
})
