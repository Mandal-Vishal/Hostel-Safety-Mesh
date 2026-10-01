import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import Button from '../ui/Button'
import NotificationItem from '../notifications/NotificationItem'
import { getNotifications, markAsRead } from '../../services/notificationService'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getNotifications().then(setNotifications)
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  async function handleNotificationClick(notification) {
    await markAsRead(notification.id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
  }

  return (
    <header className="bg-white border-b border-neutral-200 px-4 py-3 flex items-center justify-between relative">
      <h1 className="font-bold text-neutral-900">Hostel Safety Mesh</h1>
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="relative text-neutral-600 hover:text-neutral-900 p-1"
            aria-label="Notifications"
          >
            🔔
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-danger-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-neutral-200 rounded-lg shadow-lg p-2 z-50 max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-sm text-neutral-600 text-center py-4">No notifications.</p>
              ) : (
                <div className="space-y-1">
                  {notifications.map((n) => (
                    <NotificationItem key={n.id} notification={n} onClick={handleNotificationClick} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <span className="text-sm text-neutral-600 hidden sm:inline">
          {user?.name} · {user?.role}
        </span>
        <Button variant="outline" onClick={handleLogout}>Logout</Button>
      </div>
    </header>
  )
}