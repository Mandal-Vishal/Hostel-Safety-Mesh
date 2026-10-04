import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import CheckInCard from "../../components/checkin/CheckInCard";
import SOSButton from "../../components/sos/SOSButton";
import ActivityFeed from "../../components/dashboard/ActivityFeed";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import { useAuth } from "../../hooks/useAuth";
import { getCurrentStatus } from "../../services/checkInService";
import { mockActivity } from "../../mock/activity";

const mobileLinks = [
  { to: "/resident/dashboard", label: "Home" },
  { to: "/resident/check-in", label: "Check-In" },
  { to: "/resident/sos", label: "SOS" },
  { to: "/resident/incidents", label: "Incidents" },
];

function formatLocation(location) {
  if (!location) return "Hostel location unavailable";

  const parts = [
    location.building,
    location.floor !== null && location.floor !== undefined
      ? `Floor ${location.floor}`
      : null,
    location.room ? `Room ${location.room}` : null,
  ].filter(Boolean);

  return parts.join(" • ") || "Hostel location unavailable";
}

export default function ResidentDashboard() {
  const { user } = useAuth();

  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  function loadStatus() {
    setLoading(true);
    setError(false);

    getCurrentStatus()
      .then(setStatus)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Resident";

  const location = user?.currentZone || user?.hostel || null;

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="w-full max-w-5xl mx-auto space-y-6">
        {/* Welcome section */}
        <div>
          <p className="text-sm font-medium text-primary-600 mb-1">
            Resident Portal
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">
            Welcome, {displayName}
          </h1>

          <p className="text-sm text-neutral-500 mt-2">
            Stay safe and keep your night check-in status updated.
          </p>
        </div>

        {/* Location card */}
        <Card className="bg-white">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-primary-50 flex items-center justify-center">
              <span className="text-primary-700 text-lg">⌖</span>
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Registered Location
              </p>

              <p className="text-sm sm:text-base font-medium text-neutral-900 mt-1 break-words">
                {formatLocation(location)}
              </p>
            </div>
          </div>
        </Card>

        {/* Check-in */}
        <section>
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-neutral-900">
              Night Check-In
            </h2>

            <p className="text-sm text-neutral-500 mt-1">
              Confirm that you are safely back in your hostel.
            </p>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          )}

          {!loading && error && <ErrorState onRetry={loadStatus} />}

          {!loading && !error && status && <CheckInCard status={status} />}
        </section>

        {/* SOS */}
        <section>
          <Card className="text-center">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-neutral-900">
                Need Immediate Help?
              </h2>

              <p className="text-sm text-neutral-500 mt-1">
                Use SOS only when you need immediate assistance.
              </p>
            </div>

            <SOSButton />
          </Card>
        </section>
      </div>
    </DashboardLayout>
  );
}
