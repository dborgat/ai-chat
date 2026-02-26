import AsyncStorage from '@react-native-async-storage/async-storage'
import * as AuthSession from 'expo-auth-session'
import * as WebBrowser from 'expo-web-browser'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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

  const redirectUri = useMemo(() => AuthSession.makeRedirectUri(), [])

  // Log so you can register the value in Google Cloud Console
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

  const exchangeCode = useCallback(async (code: string) => {
    if (!request?.codeVerifier) return
    try {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID!,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
          code_verifier: request.codeVerifier,
        }).toString(),
      })
      const { access_token } = (await tokenRes.json()) as { access_token: string }

      const userRes = await fetch('https://www.googleapis.com/userinfo/v2/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      const userData = (await userRes.json()) as User

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      setUser(userData)
    } catch (err) {
      console.error('[Auth] Token exchange failed:', err)
    }
  }, [redirectUri, request])

  // Handle OAuth response
  useEffect(() => {
    if (response?.type !== 'success') return
    void exchangeCode(response.params.code)
  }, [response, exchangeCode])

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
