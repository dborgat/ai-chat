# AI Chat

A cross-platform AI chat app built with Expo (iOS, Android, Web) powered by Google Vertex AI (Gemini 2.0 Flash).

## Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure credentials

Create a `.env` file in the project root with your Google Cloud service account credentials:

```env
GOOGLE_VERTEX_PROJECT=your-gcp-project-id
GOOGLE_VERTEX_LOCATION=us-central1
GOOGLE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The service account needs the **Vertex AI User** role on your GCP project.

### 3. Run

```bash
npx expo start -c
```

Then press `a` for Android, `i` for iOS, or `w` for web.

## How it works

- The UI is a React Native chat screen built with [Tamagui](https://tamagui.dev)
- Messages are streamed from `app/api/chat+api.ts` — an Expo Router API route running on the dev server
- The API route calls Gemini 2.0 Flash via the [Vercel AI SDK](https://sdk.vercel.ai/) and streams the response back to the client
- `expo/fetch` is used on the client to support streaming responses on native platforms

## TypeScript

The project uses `"strict": true`. Key typing conventions:

- **API route request body** — `request.json()` returns `any`; it is cast to a typed interface:
  ```ts
  interface ChatRequestBody {
    messages: UIMessage[]  // UIMessage from 'ai'
  }
  const { messages } = (await request.json()) as ChatRequestBody
  ```

- **Rendering message parts** — `Array.filter()` does not narrow discriminated unions. Use the SDK's type guard `isTextUIPart` (from `'ai'`) instead of a manual `part.type === 'text'` check, so TypeScript knows each `part` is `TextUIPart` in the `.map()`:
  ```tsx
  import { isTextUIPart } from 'ai'
  // ...
  message.parts.filter(isTextUIPart).map((part) => part.text)
  ```

- **`expo/fetch` cast** — `expoFetch` has a slightly different type signature than the browser `fetch`. The double cast `as unknown as typeof globalThis.fetch` is intentional and required for `DefaultChatTransport`.

## Stack

| | |
|---|---|
| Framework | Expo 54, React Native 0.81 |
| Routing | Expo Router 6 |
| UI | Tamagui |
| AI model | Gemini 2.0 Flash (Google Vertex AI) |
| AI SDK | Vercel AI SDK v6 |
