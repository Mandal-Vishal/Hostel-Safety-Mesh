const iconMap = {
  sos: "🔴",
  warning: "⚠",
  success: "✓",
};

export default function NotificationItem({ notification, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(notification)}
      className={`w-full text-left px-3 py-3 rounded-lg flex gap-3 transition-colors ${
        notification.read ? "bg-white opacity-65" : "bg-primary-50"
      } hover:bg-neutral-100`}
    >
      <span className="text-base shrink-0">
        {iconMap[notification.type] || "🔔"}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-neutral-900">
            {notification.title}
          </p>

          {!notification.read && (
            <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-1.5" />
          )}
        </div>

        <p className="text-xs text-neutral-600 mt-1 break-words">
          {notification.detail}
        </p>

        <p className="text-[11px] text-neutral-500 mt-1">
          {notification.time || "Just now"}
        </p>
      </div>
    </button>
  );
}
