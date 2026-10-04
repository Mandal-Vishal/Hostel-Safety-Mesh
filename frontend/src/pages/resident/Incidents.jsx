import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import { getMyIncidents } from "../../services/incidentService";

const mobileLinks = [
  { to: "/resident/dashboard", label: "Home" },
  { to: "/resident/check-in", label: "Check-In" },
  { to: "/resident/sos", label: "SOS" },
  { to: "/resident/incidents", label: "Incidents" },
];

const statusVariant = {
  PENDING: "danger",
  ACKNOWLEDGED: "warning",
  ESCALATED: "danger",
  RESOLVED: "success",
};

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    setLoading(true);
    setError(false);

    getMyIncidents()
      .then(setIncidents)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="w-full max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <p className="text-sm font-medium text-primary-600">
            Resident Portal
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-1">
            My SOS Incidents
          </h1>

          <p className="text-sm text-neutral-500 mt-2">
            Review your emergency alerts and their current status.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {/* Error */}
        {!loading && error && <ErrorState onRetry={load} />}

        {/* Empty */}
        {!loading && !error && incidents.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl">
            <EmptyState
              title="No SOS incidents yet."
              description="Any SOS you trigger will appear here."
            />
          </div>
        )}

        {/* Incident list */}
        {!loading && !error && incidents.length > 0 && (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <Link
                key={incident.id}
                to={`/resident/incidents/${incident.id}`}
                className="block"
              >
                <Card className="transition-all hover:shadow-md hover:border-neutral-300">
                  {/* Top row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-neutral-900 truncate">
                        {incident.id}
                      </p>

                      <p className="text-sm text-neutral-600 mt-1">
                        {incident.type}
                      </p>
                    </div>

                    <Badge
                      variant={statusVariant[incident.status] || "neutral"}
                    >
                      {incident.status}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Location
                      </p>

                      <p className="text-sm text-neutral-800 mt-1 break-words">
                        {incident.zone || "Location unavailable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        Reported
                      </p>

                      <p className="text-sm text-neutral-800 mt-1">
                        {incident.date || "Not available"}
                      </p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-5 pt-4 border-t border-neutral-100">
                    <span className="text-xs text-neutral-500">
                      Tap to view incident details
                    </span>

                    <span className="text-sm font-medium text-primary-700">
                      View →
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
