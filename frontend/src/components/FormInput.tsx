interface FormInputProps {
  label: string
  name: string
  type?: 'text' | 'password' | 'email'
  required?: boolean
}

function FormInput({
  label,
  name,
  type = 'text',
  required = true,
}: FormInputProps) {
  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
      />
    </div>
  )
}

export default FormInput
