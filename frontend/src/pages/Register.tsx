import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import FormInput from '../components/FormInput'

function Register() {
  const navigate = useNavigate()

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
      const response = await fetch('/api/register', {
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
        const data = await response.json().catch(() => null)

        if (typeof data?.detail === 'string') {
          setError(data.detail)
        } else {
          setError('Registration failed.')
        }

        return
      }

      navigate('/login')
    } catch (error) {
      console.error('Registration failed:', error)
      setError('Could not connect to the server.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <h1>Register</h1>

      <form onSubmit={handleSubmit}>
        <FormInput
          label="Username"
          name="username"
        />

        <FormInput
          label="Password"
          name="password"
          type="password"
        />

        {error && <p>{error}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Registering...' : 'Register'}
        </button>
      </form>

      <Link to="/">Back</Link>
    </section>
  )
}

export default Register
