import { NavLink } from 'react-router'

function AuthNavigation() {
  return (
    <nav className="auth-navigation" aria-label="Main navigation">
      <NavLink
        className={({ isActive }) =>
          isActive ? 'nav-link active' : 'nav-link'
        }
        to="/upload"
      >
        Upload
      </NavLink>

      <NavLink
        className={({ isActive }) =>
          isActive ? 'nav-link active' : 'nav-link'
        }
        to="/images"
      >
        My Images
      </NavLink>
    </nav>
  )
}

export default AuthNavigation
