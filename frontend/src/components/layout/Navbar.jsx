import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between">
      <h1 className="font-bold text-neutral-900">Hostel Safety Mesh</h1>
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-600 hidden sm:inline">
          {user?.name} · {user?.role}
        </span>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
    </header>
  )
}