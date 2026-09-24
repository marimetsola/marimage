import { Link } from 'react-router'
import FormInput from '../components/FormInput'

function Register() {
  return (
    <section>
      <h1>Register</h1>

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

        <button type="submit">Register</button>
      </form>

      <Link to="/">Back</Link>
    </section>
  )
}

export default Register
