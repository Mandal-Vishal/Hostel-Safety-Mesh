import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import NotificationItem from "../../components/notifications/NotificationItem";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import {
  getNotifications,
  markAsRead,
  syncIncidentNotifications,
} from "../../services/notificationService";

const mobileLinks = [
  { to: "/resident/dashboard", label: "Home" },
  { to: "/resident/check-in", label: "Check-In" },
  { to: "/resident/sos", label: "SOS" },
  { to: "/resident/incidents", label: "Incidents" },
];

export default function Notifications() {
  const { user } = useAuth();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const userKey = user?._id || user?.id || user?.email || "default";

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;

    async function load() {
      try {
        const updated = await syncIncidentNotifications(user);

        if (active) {
          setNotifications(updated);
        }
      } catch (error) {
        console.error("Failed to load notifications:", error);

        const existing = await getNotifications(userKey);

        if (active) {
          setNotifications(existing);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    const interval = setInterval(async () => {
      try {
        const updated = await syncIncidentNotifications(user);

        if (active) {
          setNotifications(updated);
        }
      } catch {
        // Keep the current notification list.
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user, userKey]);

  async function handleClick(notification) {
    const updated = await markAsRead(notification.id, userKey);

    setNotifications(updated);
  }

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="w-full max-w-3xl mx-auto">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary-600">
            Resident Portal
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-1">
            Notifications
          </h1>

          <p className="text-sm text-neutral-500 mt-2">
            Safety alerts and updates related to your account.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {!loading && notifications.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl">
            <EmptyState
              title="No notifications."
              description="New SOS and safety updates will appear here."
            />
          </div>
        )}

        {!loading && notifications.length > 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl p-2 sm:p-3 space-y-1">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={handleClick}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
