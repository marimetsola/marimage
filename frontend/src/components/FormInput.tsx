import { useEffect, useRef } from 'react'

interface FormInputProps {
  label: string
  name: string
  type?: 'text' | 'password' | 'email'
  required?: boolean
  autoFocus?: boolean
}

function FormInput({
  label,
  name,
  type = 'text',
  required = true,
  autoFocus = false,
}: FormInputProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!autoFocus) {
      return
    }

    // Check if running on desktop with a mouse
    const desktop = window.matchMedia(
      '(hover: hover) and (pointer: fine)',
    ).matches

    if (desktop) {
      inputRef.current?.focus()
    }
  }, [autoFocus])

  return (
    <div>
      <label htmlFor={name}>{label}</label>
      <input
        ref={inputRef}
        id={name}
        name={name}
        type={type}
        required={required}
      />
    </div>
  )
}

export default FormInput
