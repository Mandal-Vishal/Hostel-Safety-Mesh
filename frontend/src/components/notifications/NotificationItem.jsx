const iconMap = {
  sos: '🔴',
  warning: '⚠',
  success: '✓',
}

export default function NotificationItem({ notification, onClick }) {
  return (
    <button
      onClick={() => onClick(notification)}
      className={`w-full text-left px-3 py-2.5 rounded-lg flex gap-2 ${
        notification.read ? 'opacity-60' : 'bg-primary-50'
      } hover:bg-neutral-100`}
    >
      <span>{iconMap[notification.type] || '🔔'}</span>
      <div>
        <p className="text-sm font-medium text-neutral-900">{notification.title}</p>
        <p className="text-xs text-neutral-600">{notification.detail}</p>
        <p className="text-xs text-neutral-600 mt-0.5">{notification.time}</p>
      </div>
    </button>
  )
}