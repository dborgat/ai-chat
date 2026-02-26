import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import Animated, {
  cancelAnimation,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated'
import { useTheme, XStack, YStack } from 'tamagui'

function Dot({ delay }: { delay: number }) {
  const translateY = useSharedValue(0)
  const theme = useTheme()

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: 300 }),
          withTiming(0, { duration: 300 }),
        ),
        -1,
        false,
      ),
    )
    return () => {
      cancelAnimation(translateY)
    }
  }, [translateY])

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  return <Animated.View style={[styles.dot, { backgroundColor: theme.placeholderColor.val }, animStyle]} />
}

export function TypingDots() {
  return (
    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(150)}>
      <YStack
        alignSelf="flex-start"
        backgroundColor="$gray5"
        borderRadius="$4"
        padding="$3"
        marginBottom="$2"
      >
        <XStack alignItems="center">
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </XStack>
      </YStack>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 3,
  },
})
