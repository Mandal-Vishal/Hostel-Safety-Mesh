import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import Button from "../ui/Button";
import NotificationItem from "../notifications/NotificationItem";
import {
  getNotifications,
  markAsRead,
  syncIncidentNotifications,
} from "../../services/notificationService";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  const userKey = user?._id || user?.id || user?.email || "default";

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    async function sync() {
      try {
        const updated = await syncIncidentNotifications(user);

        if (active) {
          setNotifications(updated);
        }
      } catch (error) {
        console.error("Notification sync failed:", error);

        if (active) {
          const existing = await getNotifications(userKey);

          setNotifications(existing);
        }
      }
    }

    sync();

    // Poll every 3 seconds so notifications work
    // even when Socket.IO is unavailable.
    const interval = setInterval(sync, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, userKey]);

  const unreadCount = notifications.filter(
    (notification) => !notification.read,
  ).length;

  const fullName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";

  const initials =
    [user?.firstName, user?.lastName]
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleNotificationClick(notification) {
    const updated = await markAsRead(notification.id, userKey);

    setNotifications(updated);
    setOpen(false);

    if (notification.link) {
      navigate(notification.link);
    }
  }

  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-40">
      <div className="px-3 sm:px-5 lg:px-6 py-3 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="min-w-0">
          <h1 className="font-bold text-neutral-900 text-sm sm:text-base truncate">
            Hostel Safety Mesh
          </h1>

          <p className="hidden md:block text-xs text-neutral-500 mt-0.5">
            Safety monitoring system
          </p>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* User */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-primary-50 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>

            <div className="hidden sm:block min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate max-w-40">
                {fullName}
              </p>

              <p className="text-xs text-neutral-500 capitalize">
                {user?.role || "user"}
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              className={`relative flex items-center justify-center w-10 h-10 rounded-lg transition-colors ${
                open
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100"
              }`}
              aria-label="Notifications"
              aria-expanded={open}
            >
              <span className="text-lg">🔔</span>

              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-danger-600 text-white text-[10px] font-bold rounded-full min-w-4 h-4 px-1 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-80 max-w-80 bg-white border border-neutral-200 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="px-3 py-3 border-b border-neutral-100">
                  <p className="text-sm font-semibold text-neutral-900">
                    Notifications
                  </p>

                  <p className="text-xs text-neutral-500 mt-0.5">
                    {unreadCount} unread
                  </p>
                </div>

                <div className="max-h-80 overflow-y-auto p-2">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <p className="text-2xl mb-2">🔔</p>

                      <p className="text-sm font-medium text-neutral-900">
                        No notifications
                      </p>

                      <p className="text-xs text-neutral-500 mt-1">
                        New safety updates will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={handleNotificationClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <Button
            variant="outline"
            onClick={handleLogout}
            className="px-3 sm:px-4"
          >
            <span className="hidden sm:inline">Logout</span>

            <span className="sm:hidden">↪</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
