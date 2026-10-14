import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import AuthNavigation from './AuthNavigation'

function Header({ appName }: { appName: string }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  async function handleLogout() {
    setLogoutError('')

    try {
      await logout()
      setMenuOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Logout failed:', error)
      setLogoutError('Logout failed.')
    }
  }

  return (
    <header className="header">
      <div className="header-brand">
        <img
          className="header-icon"
          src="/favicon.ico"
          alt=""
          width="32"
          height="32"
        />
        <span className="header-logo">{appName}</span>
      </div>

      {user && <AuthNavigation />}

      {user && (
        <div className="header-menu" ref={menuRef}>
          <button
            className="menu-button"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>

          {menuOpen && (
            <div className="menu">
              <p className="menu-title">{appName}</p>

              {logoutError && (
                <p className="menu-error">{logoutError}</p>
              )}

              <button
                className="menu-item"
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  )
}

export default Header
