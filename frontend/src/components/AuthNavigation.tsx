import { NavLink } from 'react-router'

function AuthNavigation() {
  return (
    <nav aria-label="Main navigation">
      <NavLink to="/upload">Upload</NavLink>
      <NavLink to="/images">My Images</NavLink>
    </nav>
  )
}

export default AuthNavigation
