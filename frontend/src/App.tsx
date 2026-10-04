import { Link, Route, Routes } from 'react-router'
import { useAuth } from './context/AuthContext'
import { useAppConfig } from './hooks/useAppConfig'
import Header from './components/Header'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'

function Home({ registerEnabled }: { registerEnabled: boolean }) {
  return (
    <section>
      <h1>Image Host</h1>

      <Link to="/login">Log in</Link>

      {registerEnabled && (
        <Link to="/register">Register</Link>
      )}
    </section>
  )
}

function Upload() {
  return <h1>Upload</h1>
}

function Images() {
  return <h1>My Images</h1>
}

function App() {
  const { user, loading } = useAuth()
  const { registerEnabled } = useAppConfig()

  return (
    <>
      <Header />

      {loading ? (
        <p>Loading...</p>
      ) : (
        <p>
          {user ? `Logged in as ${user.username}` : 'Not logged in'}
        </p>
      )}

      <main>
        <Routes>
          <Route
            path="/"
            element={<Home registerEnabled={registerEnabled} />}
          />

          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/upload" element={<Upload />} />
            <Route path="/images" element={<Images />} />
          </Route>
        </Routes>
      </main>
    </>
  )
}

export default App
