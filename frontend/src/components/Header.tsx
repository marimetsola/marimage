import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'

function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const [logoutError, setLogoutError] = useState('')

  async function handleLogout() {
    setLogoutError('')

    try {
      await logout()
      setMenuOpen(false)
      navigate('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      setLogoutError('Logout failed.')
    }
  }

  return (
    <header>
      <Link to="/">Image Host</Link>

      {user && (
        <>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Open menu"
            aria-expanded={menuOpen}
          >
            ☰
          </button>

          {menuOpen && (
            <div>
              <p>Image Host</p>

              {logoutError && <p>{logoutError}</p>}

              <button
                type="button"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </>
      )}
    </header>
  )
}

export default Header
