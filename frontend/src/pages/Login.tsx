import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import FormInput from '../components/FormInput'

function Login() {
  const navigate = useNavigate()
  const { refreshUser } = useAuth()

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)

    const username = formData.get('username')
    const password = formData.get('password')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      if (!response.ok) {
        setError('Invalid username or password.')
        return
      }

      await refreshUser()
      navigate('/upload')
    } catch (error) {
      console.error('Login failed:', error)
      setError('Could not connect to the server.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <h1>Log in</h1>

        <form onSubmit={handleSubmit} className="auth-form">
          <FormInput
            label="Username"
            name="username"
            autoFocus
            onChange={() => setError('')}
          />

          <FormInput
            label="Password"
            name="password"
            type="password"
            onChange={() => setError('')}
          />

          <p
            className={`form-error${error ? '' : ' form-error-hidden'}`}
            aria-live="polite"
          >
            {error}
          </p>

          <button
            className="button"
            type="submit"
            disabled={submitting}
          >
            {submitting ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <Link className="back-link" to="/">
          Back
        </Link>
      </div>
    </section>
  )
}

export default Login
