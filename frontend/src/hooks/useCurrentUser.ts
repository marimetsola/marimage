import { useEffect, useState } from 'react'

interface User {
  id: number
  username: string
}

interface CurrentUserState {
  user: User | null
  loading: boolean
}

export function useCurrentUser(): CurrentUserState {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
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

    loadUser()
  }, [])

  return {
    user,
    loading,
  }
}
