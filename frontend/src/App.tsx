import { Navigate, Link, Route, Routes } from 'react-router'
import { useAuth } from './context/AuthContext'
import { useAppConfig } from './hooks/useAppConfig'
import Header from './components/Header'
import Login from './pages/Login'
import Register from './pages/Register'
import Upload from './pages/Upload'
import MyImages from './pages/MyImages'
import PublicOnlyRoute from './components/PublicOnlyRoute'
import ProtectedRoute from './components/ProtectedRoute'
import './App.css'

function Home({ registerEnabled }: { registerEnabled: boolean }) {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/upload" replace />
  }

  return (
    <section className="home">
      <div className="home-content">
        <h1>Image Host</h1>

        <div className="home-actions">
          <Link className="button" to="/login">
            Log in
          </Link>

          {registerEnabled && (
            <Link className="button button-secondary" to="/register">
              Register
            </Link>
          )}
        </div>
      </div>
    </section>
  )
}

function App() {
  const { loading } = useAuth()
  const { registerEnabled } = useAppConfig()

  return (
    <div className="app">
      <Header />

      {loading ? (
        <p>Loading...</p>
      ) : (
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
              <Route path="/images" element={<MyImages />} />
            </Route>
          </Routes>
        </main>
      )}
    </div>
  )
}

export default App
