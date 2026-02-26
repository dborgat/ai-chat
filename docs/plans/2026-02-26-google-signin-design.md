# Google Sign-In Design

**Date:** 2026-02-26
**Status:** Approved

## Goal

Gate access to the chat with Google OAuth. Users must be authenticated to use the app. Session persists across app restarts via AsyncStorage.

## Constraints

- Expo Go (no native modules) → must use `expo-auth-session` + `expo-web-browser`
- No backend — auth is client-side only
- Scope: access gating only (no per-user chat history for now)

## Architecture

Pattern mirrors `ThemeContext`. New `AuthContext` wraps the app and manages session state.

**Files:**
- `context/AuthContext.tsx` — `AuthProvider` + `useAuth()` returning `{ user, signIn, signOut, loading }`
- `components/LoginScreen.tsx` — full-screen login UI with "Continue with Google" button
- `app/_layout.tsx` — adds `AuthProvider`; `ThemedApp` conditionally renders `<LoginScreen />` or `<Stack />`
- `app/index.tsx` — adds sign-out button in top bar (alongside theme toggle)

## Session Storage

AsyncStorage key: `auth_user`

```json
{ "name": "string", "email": "string", "picture": "string" }
```

Presence of this key = valid session. Sign out clears it.
Access token is NOT persisted — only user info is needed for gating.

## OAuth Flow

1. User taps "Continue with Google" → `expo-auth-session` opens browser with Google OAuth URL
2. User approves → Google redirects back with authorization `code`
3. App POSTs to `https://oauth2.googleapis.com/token` to exchange `code` for `access_token`
4. App GETs `https://www.googleapis.com/userinfo/v2/me` with the `access_token`
5. Saves `{ name, email, picture }` to AsyncStorage → updates context → layout switches to `<Stack />`

**Config needed:** Google OAuth Client ID (type: Web application) from Google Cloud Console.
Redirect URI for Expo Go: `https://auth.expo.io/@<expo-username>/<app-slug>`

## Sign Out

Button in top bar of chat screen (next to theme toggle). Clears AsyncStorage key and resets `user` to `null` → layout re-renders `<LoginScreen />`.

## Error Handling

| Scenario | Behavior |
|---|---|
| User cancels browser | No-op, stay on LoginScreen |
| Network error during token exchange | Show error message on LoginScreen, offer retry |
| AsyncStorage read fails on startup | Treat as unauthenticated, show LoginScreen |
