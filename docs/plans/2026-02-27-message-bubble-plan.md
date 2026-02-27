# Message Bubble Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add speech-bubble tails, avatars, tap-to-show-timestamp, press scale animation, and long-press-to-copy to chat message bubbles.

**Architecture:** Extract bubble rendering into `components/MessageBubble.tsx`. Each bubble instance owns its own `useSharedValue` for scale animation. Timestamps stored in a `useRef<Map<string, number>>` in `index.tsx`, keyed by message id — recorded via `useEffect` when new messages appear. `expo-clipboard` handles copy on long press.

**Tech Stack:** React Native Reanimated 4, Tamagui, expo-clipboard, `ai` SDK `UIMessage` type.

---

### Task 1: Install expo-clipboard

**Files:**
- No file changes — package install only

**Step 1: Install**

```bash
npx expo install expo-clipboard -- --legacy-peer-deps
```

Expected: `expo-clipboard` added to `package.json` without peer-dep errors.

**Step 2: Verify install**

```bash
node -e "require('./node_modules/expo-clipboard/package.json'); console.log('ok')"
```

Expected: `ok`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install expo-clipboard"
```

---

### Task 2: Create MessageBubble component

**Files:**
- Create: `components/MessageBubble.tsx`

**Context — color tokens:**
- User bubble background: `$blue10` → accessible via `theme.blue10.val` in `useTheme()`
- AI bubble background: change from `$gray5` (palette token, not accessible via `useTheme()`) to `$color3` (theme variable, accessible via `theme.color3.val`). This is required so the tail triangle can get the exact color value.
- AI avatar background: `$color4` (one step darker than bubble)

**Step 1: Create `components/MessageBubble.tsx`**

```tsx
import * as Clipboard from 'expo-clipboard'
import { isTextUIPart, UIMessage } from 'ai'
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

export function MessageBubble({
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

  const handleLongPress = async () => {
    await Clipboard.setStringAsync(text)
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1)
    })
  }

  const formattedTime = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <YStack
      alignSelf={isUser ? 'flex-end' : 'flex-start'}
      alignItems={isUser ? 'flex-end' : 'flex-start'}
      marginBottom="$2"
    >
      <XStack
        alignItems="flex-end"
        gap="$2"
        flexDirection={isUser ? 'row-reverse' : 'row'}
      >
        {/* Avatar */}
        <YStack
          width={32}
          height={32}
          borderRadius={16}
          overflow="hidden"
          backgroundColor={isUser ? '$blue5' : '$color4'}
          alignItems="center"
          justifyContent="center"
        >
          {isUser ? (
            <Image source={{ uri: userPicture }} style={styles.avatar} />
          ) : (
            <Text fontSize={10} fontWeight="bold" color="$color">
              IA
            </Text>
          )}
        </YStack>

        {/* Bubble */}
        <Pressable
          onPress={onPress}
          onPressIn={() => { scale.value = withSpring(0.95) }}
          onPressOut={() => { scale.value = withSpring(1) }}
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
                bottom={6}
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
            marginTop="$1"
            paddingHorizontal="$1"
          >
            {formattedTime}
          </Text>
        </Animated.View>
      ) : null}
    </YStack>
  )
}

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
```

**Step 2: Commit**

```bash
git add components/MessageBubble.tsx
git commit -m "feat: add MessageBubble with tail, avatar, timestamp, and copy"
```

---

### Task 3: Update index.tsx

**Files:**
- Modify: `app/index.tsx`

**Step 1: Update imports**

Add `useEffect` and `useRef` to the React import (they're already imported via `useCallback` — just add the two new ones):
```tsx
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
```

Add the MessageBubble import:
```tsx
import { MessageBubble } from '../components/MessageBubble'
```

Remove `isTextUIPart` from the `'ai'` import (no longer needed in index.tsx):
```tsx
import { DefaultChatTransport } from 'ai'
```

**Step 2: Extract `user` from `useAuth()`**

Change:
```tsx
const { signOut } = useAuth()
```
To:
```tsx
const { signOut, user } = useAuth()
```

**Step 3: Add timestamp ref and visible state**

After `const [input, setInput] = useState('')`, add:
```tsx
const timestampsRef = useRef<Map<string, number>>(new Map())
const [visibleTimestampId, setVisibleTimestampId] = useState<string | null>(null)
```

**Step 4: Add useEffect to capture timestamps**

After the state declarations:
```tsx
useEffect(() => {
  for (const msg of messages) {
    if (!timestampsRef.current.has(msg.id)) {
      timestampsRef.current.set(msg.id, Date.now())
    }
  }
}, [messages])
```

**Step 5: Replace inline bubble map with MessageBubble**

Replace the entire `{messages.map(...)}` block:

```tsx
{messages.map((message) => (
  <Animated.View
    key={message.id}
    entering={FadeInDown.springify().duration(350)}
    layout={LinearTransition.springify()}
  >
    <MessageBubble
      message={message}
      isUser={message.role === 'user'}
      userPicture={user!.picture}
      timestamp={timestampsRef.current.get(message.id)}
      showTimestamp={visibleTimestampId === message.id}
      onPress={() =>
        setVisibleTimestampId((id) => (id === message.id ? null : message.id))
      }
    />
  </Animated.View>
))}
```

**Step 6: Commit**

```bash
git add app/index.tsx
git commit -m "feat: integrate MessageBubble into chat screen"
```

---

### Task 4: Update TypingDots alignment and color

**Files:**
- Modify: `components/TypingDots.tsx`

The TypingDots bubble needs to:
1. Match the new AI bubble background color (`$color3` instead of `$gray5`)
2. Add a left margin to align with AI message bubbles (avatar 32px + gap 8px = 40px total)

**Step 1: Update TypingDots**

In `components/TypingDots.tsx`, change the `YStack` inside `TypingDots`:

- `backgroundColor="$gray5"` → `backgroundColor="$color3"`
- Add `marginLeft={40}` to the outer `Animated.View` (or to the `YStack` directly)

The outer `Animated.View` wrapping in `TypingDots` becomes:
```tsx
<Animated.View
  entering={FadeIn.duration(200)}
  exiting={FadeOut.duration(150)}
  style={{ marginLeft: 40 }}
>
```

**Step 2: Commit**

```bash
git add components/TypingDots.tsx
git commit -m "feat: align TypingDots with AI avatar, update bubble color to color3"
```

---

## Verification

After all tasks:

1. Run the dev build: `npx expo start --android -c`
2. Sign in and send a few messages
3. Verify:
   - [ ] User bubbles have a tail on the right, Google photo avatar on the right
   - [ ] AI bubbles have a tail on the left, "IA" circle avatar on the left
   - [ ] Tap a bubble → timestamp appears subtly below, tap again → disappears
   - [ ] Press and hold a bubble → slight bounce confirms text copied to clipboard
   - [ ] TypingDots aligned with AI bubbles
   - [ ] Light/dark theme switch keeps bubble colors consistent
