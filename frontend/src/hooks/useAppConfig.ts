import { useEffect, useState } from 'react'

interface AppConfig {
  register_enabled: boolean
  app_name?: string
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
  const [appName, setAppName] = useState('Image Host')

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

        setAppName(
          typeof config.app_name === 'string' && config.app_name.trim()
            ? config.app_name.trim()
            : 'Image Host',
        )
      } catch (error) {
        console.error('Failed to load app config:', error)
      }
    }

    loadConfig()
  }, [])

  return {
    registerEnabled,
    appName,
  }
}
