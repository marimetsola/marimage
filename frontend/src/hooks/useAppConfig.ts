import { useEffect, useState } from 'react'

interface AppConfig {
  register_enabled: boolean
}

function getRegisterOverride(): boolean | null {
  if (!import.meta.env.DEV) {
    return null
  }

  const value = new URLSearchParams(window.location.search).get('register')

  if (value === 'on') {
    return true
  }

  if (value === 'off') {
    return false
  }

  return null
}

export function useAppConfig() {
  const [registerEnabled, setRegisterEnabled] = useState(false)

  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch('/api/config')

        if (!response.ok) {
          throw new Error('Failed to load app config')
        }

        const config: AppConfig = await response.json()
        const override = getRegisterOverride()

        setRegisterEnabled(override ?? config.register_enabled)
      } catch (error) {
        console.error('Failed to load app config:', error)
      }
    }

    loadConfig()
  }, [])

  return {
    registerEnabled,
  }
}
