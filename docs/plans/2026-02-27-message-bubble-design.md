# Message Bubble Redesign — Design Doc

**Date:** 2026-02-27

## Overview

Enhance chat message bubbles with: speech-bubble tail, avatars, tap-to-show-timestamp, press scale animation, and long-press-to-copy.

## Layout

Each message row:

```
AI:    [🤖 IA] [←bubble con punta]
User:           [bubble con punta→] [📷 foto]
```

- **Avatar**: 32×32 circle. User → `Image` with `user.picture` from Google Sign-In. AI → `View` with "IA" text centered.
- **Tail**: small triangle via React Native border trick (width/height 0, transparent sides). Positioned absolute at bottom corner of bubble, outside it. Same color as bubble background.
- **TypingDots**: left offset matching avatar width + gap to align with AI bubbles.

## Data & State

- **Timestamps**: `useRef<Map<string, number>>(new Map())` in `index.tsx`. `useEffect` watching `messages` records `Date.now()` for each new message not yet in the map. Session-only (not persisted).
- **Visible timestamp**: `useState<string | null>(null)` in `index.tsx`. Tap toggles the timestamp for that message id.
- **Copy**: `expo-clipboard`. Long press calls `Clipboard.setStringAsync(text)`.
- **MessageBubble props**: `message`, `isUser`, `userPicture`, `timestamp`, `showTimestamp`, `onPress`, `onLongPress`.

## Interactions & Animations

- **Press scale**: each `MessageBubble` owns a `useSharedValue(1)`. `onPressIn` → `withSpring(0.95)`, `onPressOut` → `withSpring(1)`.
- **Timestamp reveal**: `FadeIn.duration(200)` / `FadeOut.duration(150)` on the timestamp text. `fontSize: 11`, color `$placeholderColor`, aligned to bubble side.
- **Long press feedback**: `withSpring(1.05)` → `withSpring(1)` bounce to confirm copy. No toast/alert.
- **Pressable**: wraps full bubble. `onPress` → timestamp toggle, `onPressIn`/`onPressOut` → scale, `onLongPress` → copy.

## Files Changed

- `components/MessageBubble.tsx` — new component
- `app/index.tsx` — timestamps ref/state, pass props to MessageBubble, update TypingDots offset
- `components/TypingDots.tsx` — add left offset for avatar alignment
- Install `expo-clipboard`
