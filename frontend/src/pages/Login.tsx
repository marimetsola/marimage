import { Link } from 'react-router'
import FormInput from '../components/FormInput'

function Login() {
  return (
    <section>
      <h1>Log in</h1>

      <form>
        <FormInput
          label="Username"
          name="username"
        />

        <FormInput
          label="Password"
          name="password"
          type="password"
        />

        <button type="submit">Log in</button>
      </form>

      <Link to="/">Back</Link>
    </section>
  )
}

export default Login
