import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Button from '../../components/ui/Button'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const user = await login(email, password)
      redirectByRole(user.role)
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function redirectByRole(role) {
    const routes = {
      resident: '/resident/dashboard',
      warden: '/warden/dashboard',
      security: '/security/dashboard',
      admin: '/admin/dashboard',
    }
    navigate(routes[role] || '/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
      <Card className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-neutral-900">Hostel Safety Mesh</h1>
          <p className="text-neutral-600 mt-1">Keep your hostel safe</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-900 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600"
            />
          </div>

          {error && <p className="text-danger-600 text-sm">{error}</p>}

          <Button type="submit" disabled={submitting} className="w-full flex items-center justify-center gap-2">
            {submitting ? <Spinner className="h-4 w-4 border-white/40 border-t-white" /> : 'Login'}
          </Button>
        </form>
      </Card>
    </div>
  )
}