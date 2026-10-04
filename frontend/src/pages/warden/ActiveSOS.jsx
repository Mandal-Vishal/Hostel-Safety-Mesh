import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import ActiveSOSCard from "../../components/dashboard/ActiveSOSCard";
import EmptyState from "../../components/ui/EmptyState";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import { getAllActiveSOS } from "../../services/sosService";
import { useSocketEvent } from "../../hooks/useSocket";

const sidebarLinks = [
  { to: "/warden/dashboard", label: "Dashboard" },
  { to: "/warden/sos", label: "Active SOS" },
  { to: "/warden/check-ins", label: "Check-Ins" },
  { to: "/warden/incidents", label: "Incidents" },
  { to: "/warden/devices", label: "Devices" },
  { to: "/warden/analytics", label: "Analytics" },
  { to: "/warden/audit-logs", label: "Audit Logs" },
];

export default function ActiveSOS() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  useSocketEvent("incident:new", () => {
    loadList();
  });

  useSocketEvent("incident:updated", () => {
    loadList();
  });

  useSocketEvent("incident:acknowledged", () => {
    loadList();
  });

  useSocketEvent("incident:escalated", () => {
    loadList();
  });

  useSocketEvent("incident:resolved", () => {
    loadList();
  });

  function loadList() {
    setLoading(true);
    setError(false);

    getAllActiveSOS()
      .then(setList)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
              Active SOS
            </h1>

            <p className="text-sm text-neutral-500 mt-1">
              Live emergency alerts requiring attention.
            </p>
          </div>

          {!loading && !error && list.length > 0 && (
            <span className="inline-flex items-center w-fit px-3 py-1.5 rounded-full bg-danger-50 text-danger-600 text-sm font-semibold">
              {list.length} active
            </span>
          )}
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <div className="max-w-xl">
            <ErrorState onRetry={loadList} />
          </div>
        )}

        {!loading && !error && list.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl">
            <EmptyState
              title="No active SOS alerts."
              description="Everything is currently under control."
            />
          </div>
        )}

        {!loading && !error && list.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {list.map((sos) => (
              <ActiveSOSCard key={sos.id} sos={sos} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
