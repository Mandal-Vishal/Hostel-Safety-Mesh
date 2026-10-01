import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import NotificationItem from '../../components/notifications/NotificationItem'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { getNotifications, markAsRead } from '../../services/notificationService'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getNotifications().then(setNotifications).finally(() => setLoading(false))
  }, [])

  async function handleClick(notification) {
    await markAsRead(notification.id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
    )
  }

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Notifications</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <EmptyState title="No notifications." />
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-1 max-w-md">
          {notifications.map((n) => (
            <NotificationItem key={n.id} notification={n} onClick={handleClick} />
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}