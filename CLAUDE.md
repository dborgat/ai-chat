# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android device/emulator
npm run ios        # Run on iOS simulator/device
npm run web        # Run web version (Metro bundler)
```

No test or lint scripts are configured. There is no CI/CD setup.

## Architecture

This is a cross-platform AI chat app built with **Expo** (iOS/Android/Web) using file-based routing via `expo-router`.

### Key layers

**Frontend** (`app/index.tsx`)
- `useChat` hook from `@ai-sdk/react` manages messages and input state
- Uses Expo's fetch (not native fetch) for compatibility — see the `fetch` option passed to `useChat`
- `getApiUrl('/api/chat')` from `utils.ts` resolves the correct base URL per platform (empty string on web, `localhost:8081` on mobile)

**API route** (`app/api/chat+api.ts`)
- Expo Router API handler — only runs when Metro acts as a server (dev mode or SSR builds)
- Receives a messages array, calls Google Vertex AI (`gemini-2.0-flash`) via `streamText`, and returns a `UIMessageStreamResponse`
- Credentials are read from `.env` at runtime

**UI** — Tamagui component library (`tamagui.config.ts` uses `defaultConfig` from `@tamagui/config/v4`). The Babel plugin (`@tamagui/babel-plugin`) extracts styles at build time; `disableExtraction: true` is set in dev mode.

**Root layout** (`app/_layout.tsx`) — wraps the app in `TamaguiProvider`, `PortalProvider`, and a system-theme-aware theme provider, then renders a Stack navigator.

### Tech stack

| Concern | Library |
|---|---|
| Framework | Expo ~54, React 19, React Native 0.81 |
| Routing | expo-router ~6 |
| UI | Tamagui ^2.0.0-rc |
| Animations | react-native-reanimated ~4.1 |
| AI (client) | @ai-sdk/react ^3 |
| AI (server) | @ai-sdk/google-vertex ^4, ai ^6 |
| Validation | zod ^4 |

### Environment variables

The `.env` file must contain Google Vertex AI credentials:
- `GOOGLE_VERTEX_PROJECT`
- `GOOGLE_VERTEX_LOCATION`
- `GOOGLE_VERTEX_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_VERTEX_PRIVATE_KEY`

### Babel plugin order matters

`react-native-reanimated/plugin` must be **last** in the plugins array in `babel.config.js`.
