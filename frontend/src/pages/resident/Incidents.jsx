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
  OPEN: "danger",
  INVESTIGATING: "warning",
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
      <div className="mb-4">
        <h1 className="text-xl font-bold text-neutral-900">My SOS Incidents</h1>

        <p className="text-sm text-neutral-600 mt-1">
          Your safety alerts and their current status.
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState onRetry={load} />}

      {!loading && !error && incidents.length === 0 && (
        <EmptyState
          title="No SOS incidents yet."
          description="Any SOS you trigger will appear here."
        />
      )}

      {!loading && !error && incidents.length > 0 && (
        <div className="space-y-3 max-w-md">
          {incidents.map((incident) => (
            <Link key={incident.id} to={`/resident/incidents/${incident.id}`}>
              <Card>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-neutral-900">
                    {incident.id}
                  </p>

                  <Badge variant={statusVariant[incident.status] || "neutral"}>
                    {incident.status}
                  </Badge>
                </div>

                <p className="text-sm text-neutral-900 mt-1">{incident.type}</p>

                <p className="text-sm text-neutral-600">{incident.zone}</p>

                <p className="text-xs text-neutral-600 mt-1">{incident.date}</p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
