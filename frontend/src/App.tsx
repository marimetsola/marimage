import { Link, Route, Routes } from 'react-router'
import Header from './components/Header'
import { useAppConfig } from './hooks/useAppConfig'
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
  const { registerEnabled } = useAppConfig()

  return (
    <>
      <Header />

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
