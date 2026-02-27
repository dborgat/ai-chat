# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start -c      # Start dev server (clears cache) — use this, not npm start
npx expo start --android -c
npx expo start --ios -c
npx expo start --web -c
```

Always use `--legacy-peer-deps` when installing packages due to the React 19.1.0 version pin:
```bash
npm install <package> --legacy-peer-deps
npx expo install <package> -- --legacy-peer-deps
```

No test or lint scripts are configured.

## Architecture

Cross-platform AI chat app (iOS/Android/Web) using Expo file-based routing via `expo-router`.

### Key layers

**Frontend** (`app/index.tsx`)
- `useChat` from `@ai-sdk/react@3` — in v3 the API changed significantly:
  - No `input`/`setInput`/`handleSubmit`/`isLoading` — manage input with `useState` yourself
  - Use `sendMessage({ text: input })` to send
  - Status values: `'ready' | 'submitted' | 'streaming' | 'error'`
  - `api` and `fetch` are **not** direct options — they must go inside `transport`:
    ```ts
    useChat({
      transport: new DefaultChatTransport({
        api: getApiUrl('/api/chat'),
        fetch: expoFetch as unknown as typeof globalThis.fetch,
      }),
    })
    ```
- `expoFetch` from `expo/fetch` is required — React Native's global `fetch` returns `response.body = null`
- `getApiUrl('/api/chat')` from `utils.ts` resolves the host using `Constants.expoConfig.hostUri` (the real LAN IP of the dev server). Never use `localhost` on Android — it resolves to the device itself.

**API route** (`app/api/chat+api.ts`)
- Expo Router API handler running in Node.js (not bundled into the native app)
- Receives `UIMessage[]` from the client — must `await convertToModelMessages(messages)` before passing to `streamText`
- Uses `@ai-sdk/google-vertex` (not `/edge`) — the `/edge` variant uses browser's `atob` which fails with PEM keys in Node.js
- Credentials go in `googleAuthOptions.credentials` (not `googleCredentials`):
  ```ts
  createVertex({
    project: process.env.GOOGLE_VERTEX_PROJECT,
    location: process.env.GOOGLE_VERTEX_LOCATION,
    googleAuthOptions: {
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY,
      },
    },
  })
  ```
- Returns `result.toUIMessageStreamResponse()`
- Server-side logs appear in the `npx expo start` terminal prefixed with `|`

**UI** — Tamagui component library (`tamagui.config.ts` uses `defaultConfig` from `@tamagui/config/v4`). The Babel plugin (`@tamagui/babel-plugin`) extracts styles at build time; `disableExtraction: true` is set in dev mode.

**Auth** (`context/AuthContext.tsx`)
- `AuthProvider`: on mount reads `AsyncStorage` key `'auth_user'`. If found, restores session (no login screen). Exposes `{ user, loading, signIn, signOut }` via `useAuth()`.
- `signIn`: calls `GoogleSignin.hasPlayServices()` then `GoogleSignin.signIn()` — shows the native Google account picker. On success, saves `{ name, email, picture }` to AsyncStorage and sets `user`.
- `signOut`: calls `GoogleSignin.signOut()`, clears AsyncStorage, sets `user` to `null`.
- `GoogleSignin.configure({ webClientId })` is called at module level with `EXPO_PUBLIC_GOOGLE_CLIENT_ID`.
- Requires a **development build** (`npx expo run:android`) — does NOT work in Expo Go (native module).
- `LoginScreen` (`components/LoginScreen.tsx`): shown when `user === null`. Single "Continuar con Google" button.

**Root layout** (`app/_layout.tsx`) — split into two components:
- `RootLayout` (default export): wraps everything in `LayoutAnimationConfig skipEntering` and `AppThemeProvider` + `AuthProvider`
- `ThemedApp`: consumes `useAppTheme()` and `useAuth()`. While `loading` is true renders a centered `<ActivityIndicator />`. Then renders `<LoginScreen />` or `<Stack />` based on `user`. Must be a separate component so it can call hooks after providers render.

**Message bubbles** (`components/MessageBubble.tsx`)
- Wrapped in `React.memo` — prevents re-renders of existing bubbles during streaming
- Press handlers (`onPressIn`, `onPressOut`, `handleLongPress`) wrapped in `useCallback` for stable references
- Each bubble owns its own `useSharedValue(1)` for scale animation
- Timestamps stored in `useRef<Map<string, number>>` in `index.tsx`, recorded via `useEffect([messages])`
- Long-press copies text via `expo-clipboard`; feedback is a `withSpring(1.05)` bounce

**Theme** (`context/ThemeContext.tsx`)
- `AppThemeProvider`: reads `AsyncStorage` key `'app_theme'` on mount, falls back to `useColorScheme()`. Writes on every toggle.
- `useAppTheme()`: returns `{ theme: 'light' | 'dark', toggleTheme }`. Call from any component inside the provider.
- Toggle button in `app/index.tsx` (top-right, ☀️ in dark / 🌙 in light).

**Animations** (`components/TypingDots.tsx`, `app/index.tsx`)
- Each message bubble: `<Animated.View entering={FadeInDown.springify().duration(350)} layout={LinearTransition.springify()}>`
- Typing indicator: `<TypingDots />` rendered when `status === 'submitted'`. Three dots bounce in a wave via staggered `withRepeat(withSequence(...))` with 150ms delay between dots. Dot color is theme-aware (`theme.placeholderColor.val` from `useTheme()`).
- Send button: `useSharedValue(1)` scale — `withSpring(0.88)` on `pressIn`, `withSpring(1)` on `pressOut`.
- `LayoutAnimationConfig skipEntering` in `_layout.tsx` is required for `FadeOut` exiting animations to work on Android.

### Tech stack

| Concern | Library |
|---|---|
| Framework | Expo ~54, React 19.1.0 (pinned), React Native 0.81 |
| Routing | expo-router ~6 |
| UI | Tamagui ^2.0.0-rc |
| Animations | react-native-reanimated ~4.1 |
| AI (client) | @ai-sdk/react ^3, ai ^6 |
| AI (server) | @ai-sdk/google-vertex ^4, ai ^6 |
| Auth | @react-native-google-signin/google-signin |
| Persistence | @react-native-async-storage/async-storage 2.2.0 |
| Validation | zod ^4 |

### Environment variables

**Server-side** (Vertex AI):
- `GOOGLE_VERTEX_PROJECT`
- `GOOGLE_VERTEX_LOCATION`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

**Client-side** (Google Sign-In — must have `EXPO_PUBLIC_` prefix to be bundled):
- `EXPO_PUBLIC_GOOGLE_CLIENT_ID` — Web application OAuth client ID from Google Cloud Console

### Critical configuration

**`package.json`** — `"main": "expo-router/entry"` (not `index.ts`)

**`app.config.ts`** — `web.output: 'server'` is required for API routes to be served by the dev server. Without it, POST requests return the web HTML instead of invoking the handler.

**React version** — pinned to `19.1.0` to match `react-native-renderer` bundled in RN 0.81.5. Using `^19.2.x` causes a renderer mismatch crash at startup.

### Tamagui theme tokens vs palette tokens

`useTheme()` returns **theme variables**, not palette tokens. In `@tamagui/config/v4` the available theme variables are `color1`–`color12`, `background`, `color`, `placeholderColor`, `borderColor`, `blue1`–`blue12`, etc. — **not** `gray1`–`gray12`. Those are palette tokens in `config.tokens` and are not accessible via `useTheme()`. Accessing a non-existent key returns `undefined` and will throw on `.val`.

Use `theme.placeholderColor.val` for a muted gray, or `theme.color8.val` for a medium neutral from the color scale.

### Tamagui v2 RC — prop naming and style prop rules

In `@tamagui/config/v4` (v2 RC), not all CSS longhand props are accepted directly on Stack components. Follow this pattern:

- **Token-based props** work as direct component props: `background="$blue10"`, `padding="$3"`, `gap="$2"`, `borderRadius="$4"`, `mb="$4"`, `mt="$1"`, `px="$1"`, `color="$color"`, etc.
- **Raw CSS values** (strings like `'flex-end'`, numbers like `16`) must go in `style={{}}`:
  ```tsx
  // Wrong — TypeScript error
  <YStack alignSelf="flex-end" alignItems="center" borderRadius={16} overflow="hidden">
  // Correct
  <YStack style={{ alignSelf: 'flex-end', alignItems: 'center', borderRadius: 16, overflow: 'hidden' }}>
  ```
- **`background` not `backgroundColor`** — the prop is `background` in Tamagui v2 RC:
  ```tsx
  // Wrong
  <YStack backgroundColor="$blue10">
  // Correct
  <YStack background="$blue10">
  ```

### Babel plugin order matters

`react-native-reanimated/plugin` must be **last** in the plugins array in `babel.config.js`.

### DefaultChatTransport must be memoized

`new DefaultChatTransport(...)` must be wrapped in `useMemo` (empty deps) inside the component — constructing it inline causes a new reference on every render, which can trigger spurious re-subscriptions inside `useChat`:
```ts
const transport = useMemo(
  () => new DefaultChatTransport({ api: getApiUrl('/api/chat'), fetch: expoFetch as unknown as typeof globalThis.fetch }),
  [],
)
const { messages, sendMessage, status, error } = useChat({ transport })
```

### TypeScript conventions

`tsconfig.json` uses `"strict": true` (extends `expo/tsconfig.base`).

**API route request body** — `request.json()` returns `any`; always cast it to a typed interface:
```ts
interface ChatRequestBody {
  messages: UIMessage[]  // from 'ai'
}
const { messages } = (await request.json()) as ChatRequestBody
```

**Message part rendering** — `Array.filter()` does not narrow discriminated union types. Use the SDK's built-in type guards instead of a manual `part.type === 'text'` check:
```tsx
import { isTextUIPart } from 'ai'
// part is correctly narrowed to TextUIPart inside .map()
message.parts.filter(isTextUIPart).map((part) => part.text)
```
Other available guards: `isReasoningUIPart`, `isFileUIPart`, `isToolUIPart`.

**`expoFetch` cast** — the double cast `expoFetch as unknown as typeof globalThis.fetch` is intentional; `expo/fetch` has a slightly different type signature and this is the required escape hatch for `DefaultChatTransport`.
