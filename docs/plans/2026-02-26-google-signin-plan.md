# Google Sign-In Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Gate the chat screen behind Google OAuth — unauthenticated users see a login screen, session persists across restarts via AsyncStorage.

**Architecture:** `AuthProvider` + `useAuth()` context mirrors the existing `ThemeContext` pattern. `expo-auth-session` handles the OAuth web flow (Expo Go compatible). `_layout.tsx` wraps the app with `AuthProvider`; `ThemedApp` conditionally renders `<LoginScreen />` or `<Stack />` based on auth state.

**Tech Stack:** `expo-auth-session` (bundled in Expo SDK 54), `expo-web-browser` (bundled in Expo SDK 54), `@react-native-async-storage/async-storage` (already installed), Tamagui for UI.

---

### Task 1: Google Cloud Console setup + env variable

**Files:**
- Modify: `.env`

**Step 1: Create OAuth credentials in Google Cloud Console**

1. Go to https://console.cloud.google.com → create a new project
2. APIs & Services → OAuth consent screen → External → fill in App name + support email → Save
3. APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID
4. Application type: **Web application**
5. Name it (e.g. "ai-chat-expo")
6. Leave Authorized redirect URIs empty for now — you'll fill this in after Task 2 step 3
7. Click Create → copy the **Client ID** (ends in `.apps.googleusercontent.com`)

**Step 2: Add to `.env`**

```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

> `EXPO_PUBLIC_` prefix is required — only vars with this prefix are bundled into the client app in Expo SDK 50+.

**Step 3: Restart dev server**

```bash
npx expo start -c
```

No commit needed (`.env` is gitignored).

---

### Task 2: Create `context/AuthContext.tsx`

**Files:**
- Create: `context/AuthContext.tsx`

**Step 1: Create the file**

```tsx
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

// Required: lets expo-auth-session complete the redirect when the browser returns
WebBrowser.maybeCompleteAuthSession()

const STORAGE_KEY = 'auth_user'

const discovery: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
}

interface User {
  name: string
  email: string
  picture: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (saved) setUser(JSON.parse(saved) as User)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const redirectUri = AuthSession.makeRedirectUri()

  // Log so you can register the value in Google Cloud Console (Task 1 step 6)
  useEffect(() => {
    console.log('[Auth] Redirect URI:', redirectUri)
  }, [redirectUri])

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
      redirectUri,
      scopes: ['openid', 'profile', 'email'],
    },
    discovery,
  )

  // Handle OAuth response
  useEffect(() => {
    if (response?.type !== 'success') return
    void exchangeCode(response.params.code)
  }, [response])

  async function exchangeCode(code: string) {
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: request!.codeVerifier!,
        }).toString(),
      })
      const { access_token } = (await tokenRes.json()) as { access_token: string }

      const userRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      const userData = (await userRes.json()) as User

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      setUser(userData)
    } catch {
      // sign-in failed silently — user stays on LoginScreen
    }
  }

  const signIn = async () => {
    await promptAsync()
  }

  const signOut = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY).catch(() => {})
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
```

**Step 2: Run the app and copy the redirect URI from the terminal**

Look for `[Auth] Redirect URI: <value>` in the Expo terminal output.
Add that value to Google Cloud Console → Credentials → your OAuth client → Authorized redirect URIs → Save.

**Step 3: Commit**

```bash
git add context/AuthContext.tsx
git commit -m "feat: add AuthContext with Google OAuth and AsyncStorage session persistence"
```

---

### Task 3: Create `components/LoginScreen.tsx`

**Files:**
- Create: `components/LoginScreen.tsx`

**Step 1: Create the file**

```tsx
import { Button, Text, YStack } from 'tamagui'
import { useAuth } from '../context/AuthContext'

export function LoginScreen() {
  const { signIn } = useAuth()

  return (
    <YStack flex={1} alignItems="center" justifyContent="center" gap="$4" padding="$6" backgroundColor="$background">
      <Text fontSize="$8" fontWeight="bold">AI Chat</Text>
      <Text color="$placeholderColor" textAlign="center">
        Iniciá sesión para continuar
      </Text>
      <Button onPress={signIn} theme="active" size="$5" borderRadius="$4" width="100%">
        Continuar con Google
      </Button>
    </YStack>
  )
}
```

**Step 2: Commit**

```bash
git add components/LoginScreen.tsx
git commit -m "feat: add LoginScreen component"
```

---

### Task 4: Update `app/_layout.tsx`

**Files:**
- Modify: `app/_layout.tsx`

`ThemedApp` now consumes `useAuth`. While `loading` is true (AsyncStorage read in progress) it renders nothing — prevents a flash of the login screen on reopen when already authenticated.

**Step 1: Replace the file contents**

```tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { LayoutAnimationConfig } from 'react-native-reanimated'
import { TamaguiProvider } from 'tamagui'
import { PortalProvider } from '@tamagui/portal'
import { tamaguiConfig } from '../tamagui.config'
import { AppThemeProvider, useAppTheme } from '../context/ThemeContext'
import { AuthProvider, useAuth } from '../context/AuthContext'
import { LoginScreen } from '../components/LoginScreen'

function ThemedApp() {
  const { theme } = useAppTheme()
  const { user, loading } = useAuth()

  return (
    <TamaguiProvider config={tamaguiConfig} defaultTheme={theme}>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <PortalProvider>
          {loading ? null : user ? (
            <Stack screenOptions={{ headerShown: false }} />
          ) : (
            <LoginScreen />
          )}
        </PortalProvider>
      </ThemeProvider>
    </TamaguiProvider>
  )
}

export default function RootLayout() {
  return (
    <LayoutAnimationConfig skipEntering>
      <AppThemeProvider>
        <AuthProvider>
          <ThemedApp />
        </AuthProvider>
      </AppThemeProvider>
    </LayoutAnimationConfig>
  )
}
```

**Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: gate app with AuthProvider, show LoginScreen when unauthenticated"
```

---

### Task 5: Add sign-out button to `app/index.tsx`

**Files:**
- Modify: `app/index.tsx`

**Step 1: Add `useAuth` import**

Add to the existing imports line:
```tsx
import { useAuth } from '../context/AuthContext'
```

**Step 2: Destructure `signOut` inside `ChatScreen`**

Add after `const { theme, toggleTheme } = useAppTheme()`:
```tsx
const { signOut } = useAuth()
```

**Step 3: Update the top bar XStack**

Replace:
```tsx
<XStack paddingHorizontal="$4" paddingTop="$2" justifyContent="flex-end">
  <Button
    size="$3"
    chromeless
    onPress={toggleTheme}
    accessibilityLabel={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    {theme === 'dark' ? '☀️' : '🌙'}
  </Button>
</XStack>
```

With:
```tsx
<XStack paddingHorizontal="$4" paddingTop="$2" justifyContent="space-between" alignItems="center">
  <Button size="$3" chromeless onPress={signOut}>
    Salir
  </Button>
  <Button
    size="$3"
    chromeless
    onPress={toggleTheme}
    accessibilityLabel={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
  >
    {theme === 'dark' ? '☀️' : '🌙'}
  </Button>
</XStack>
```

**Step 4: Commit**

```bash
git add app/index.tsx
git commit -m "feat: add sign-out button to chat screen top bar"
```

---

## Manual Testing Checklist

1. `npx expo start -c` — check terminal for `[Auth] Redirect URI: <value>`
2. Add that value to Google Cloud Console → Authorized redirect URIs → Save
3. Open app on device → LoginScreen appears with "Continuar con Google"
4. Tap button → browser opens → sign in with Google → browser closes → chat screen appears
5. Close and reopen app → goes straight to chat (session restored from AsyncStorage)
6. Tap "Salir" → LoginScreen reappears
