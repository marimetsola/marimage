import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

interface User {
  id: number
  username: string
}

interface AuthContextValue {
  user: User | null
  loading: boolean
  refreshUser: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function refreshUser() {
    try {
      const response = await fetch('/api/me')

      if (response.status === 401) {
        setUser(null)
        return
      }

      if (!response.ok) {
        throw new Error('Failed to load current user')
      }

      const data: User = await response.json()
      setUser(data)
    } catch (error) {
      console.error('Failed to load current user:', error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function logout() {
    const response = await fetch('/api/logout', {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error('Logout failed')
    }

    setUser(null)
  }

  useEffect(() => {
    refreshUser()
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
