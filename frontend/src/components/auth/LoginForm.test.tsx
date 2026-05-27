import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import LoginForm from './LoginForm'
import * as auth from '@/lib/auth'

// mock useRouter hook
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}))

// mock the login function
vi.mock('@/lib/auth', () => ({
  login: vi.fn(),
}))

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the login form', () => {
    render(<LoginForm />)

    expect(screen.getByLabelText(/Adres Email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Hasło/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Zaloguj/i })).toBeInTheDocument()
  })

  it('shows an error message on failed login', async () => {
    // setup the mock to return false (failed login)
    vi.mocked(auth.login).mockResolvedValue(false)

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/Adres Email/i)
    const passwordInput = screen.getByLabelText(/Hasło/i)
    const submitButton = screen.getByRole('button', { name: /Zaloguj/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    // wait for the async login to resolve and update state
    const errorMessage = await screen.findByText(/Nieprawidłowy adres email lub hasło\./i)
    expect(errorMessage).toBeInTheDocument()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('redirects to dashboard on successful login', async () => {
    // setup the mock to return true (successful login)
    vi.mocked(auth.login).mockResolvedValue(true)

    render(<LoginForm />)

    const emailInput = screen.getByLabelText(/Adres Email/i)
    const passwordInput = screen.getByLabelText(/Hasło/i)
    const submitButton = screen.getByRole('button', { name: /Zaloguj/i })

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } })
    fireEvent.change(passwordInput, { target: { value: 'correctpassword' } })
    fireEvent.click(submitButton)

    await vi.waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/dashboard')
    })
  })
})
