import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import type { AdminUser } from '@/types'

interface AuthContextValue {
  user: AdminUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

async function toAdminUser(firebaseUser: User): Promise<AdminUser | null> {
  // Custom claim `role: admin` di-set eksklusif lewat Cloud Function server-side
  // (lihat functions/src/handlers/setAdminClaim.ts). Client tidak bisa memalsukan ini.
  const tokenResult = await firebaseUser.getIdTokenResult(true)
  if (tokenResult.claims.role !== 'admin') {
    return null
  }
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email ?? '',
    displayName: firebaseUser.displayName ?? firebaseUser.email ?? 'Admin',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }
      const adminUser = await toAdminUser(firebaseUser)
      if (!adminUser) {
        // Login berhasil tapi bukan admin — jangan biarkan sesi non-admin menempel.
        await firebaseSignOut(auth)
      }
      setUser(adminUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function signIn(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password)
  }

  async function signOut() {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth harus dipakai di dalam AuthProvider')
  return ctx
}
