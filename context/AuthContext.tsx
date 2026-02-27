import AsyncStorage from '@react-native-async-storage/async-storage'
import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'auth_user'

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
})

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

  const signIn = async () => {
    try {
      await GoogleSignin.hasPlayServices()
      const result = await GoogleSignin.signIn()
      if (result.type !== 'success') return
      const userData: User = {
        name: result.data.user.name ?? '',
        email: result.data.user.email,
        picture: result.data.user.photo ?? '',
      }
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(userData))
      setUser(userData)
    } catch (err) {
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) return
        if (err.code === statusCodes.IN_PROGRESS) return
      }
      console.error('[Auth] Sign-in failed:', err)
    }
  }

  const signOut = async () => {
    try {
      await GoogleSignin.signOut()
    } catch {
      // ignore — still clear local session
    }
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
