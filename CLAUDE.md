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

**Root layout** (`app/_layout.tsx`) — wraps the app in `TamaguiProvider`, `PortalProvider`, and a system-theme-aware theme provider, then renders a Stack navigator.

### Tech stack

| Concern | Library |
|---|---|
| Framework | Expo ~54, React 19.1.0 (pinned), React Native 0.81 |
| Routing | expo-router ~6 |
| UI | Tamagui ^2.0.0-rc |
| Animations | react-native-reanimated ~4.1 |
| AI (client) | @ai-sdk/react ^3, ai ^6 |
| AI (server) | @ai-sdk/google-vertex ^4, ai ^6 |
| Validation | zod ^4 |

### Environment variables

The `.env` file must contain Google Vertex AI credentials:
- `GOOGLE_VERTEX_PROJECT`
- `GOOGLE_VERTEX_LOCATION`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

### Critical configuration

**`package.json`** — `"main": "expo-router/entry"` (not `index.ts`)

**`app.config.ts`** — `web.output: 'server'` is required for API routes to be served by the dev server. Without it, POST requests return the web HTML instead of invoking the handler.

**`app.config.ts`** — `web.output: 'server'` is required for API routes to be served by the dev server. Without it, POST requests return the web HTML instead of invoking the handler.

**React version** — pinned to `19.1.0` to match `react-native-renderer` bundled in RN 0.81.5. Using `^19.2.x` causes a renderer mismatch crash at startup.

### Babel plugin order matters

`react-native-reanimated/plugin` must be **last** in the plugins array in `babel.config.js`.
