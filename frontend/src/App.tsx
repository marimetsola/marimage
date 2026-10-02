import { Link, Route, Routes } from 'react-router'
import Header from './components/Header'
import { useAppConfig } from './hooks/useAppConfig'
import Login from './pages/Login'
import Register from './pages/Register'
import { useCurrentUser } from './hooks/useCurrentUser'

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
  const { registerEnabled } = useAppConfig()
  const { user, loading } = useCurrentUser()

  return (
    <>
      <Header />
      {loading ? (
        <p>Loading...</p>
      ) : user ? (
        <p>Logged in as {user.username}</p>
      ) : (
        <p>Not logged in</p>
      )}
      <main>
        <Routes>
          <Route
            path="/"
            element={<Home registerEnabled={registerEnabled} />}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/images" element={<Images />} />
        </Routes>
      </main>
    </>
  )
}

export default App
