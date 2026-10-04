import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import { getIncidents } from "../../services/incidentService";

const sidebarLinks = [
  { to: "/warden/dashboard", label: "Dashboard" },
  { to: "/warden/sos", label: "Active SOS" },
  { to: "/warden/check-ins", label: "Check-Ins" },
  { to: "/warden/incidents", label: "Incidents" },
  { to: "/warden/devices", label: "Devices" },
  { to: "/warden/analytics", label: "Analytics" },
  { to: "/warden/audit-logs", label: "Audit Logs" },
];

const filters = ["All", "Pending", "Acknowledged", "Escalated", "Resolved"];

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
  const [filter, setFilter] = useState("All");

  const navigate = useNavigate();

  useEffect(() => {
    loadIncidents();
  }, []);

  async function loadIncidents() {
    setLoading(true);
    setError(false);

    try {
      const data = await getIncidents();
      setIncidents(data);
    } catch (err) {
      console.error("Failed to load incidents:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  const filtered =
    filter === "All"
      ? incidents
      : incidents.filter(
          (incident) => incident.status === filter.toUpperCase(),
        );

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Incident Reports
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Review and monitor reported safety incidents.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {filters.map((item) => {
            const active = filter === item;

            return (
              <button
                key={item}
                type="button"
                onClick={() => setFilter(item)}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary-600 text-white"
                    : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="max-w-xl">
            <ErrorState onRetry={loadIncidents} />
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white border border-neutral-200 rounded-xl">
            <EmptyState
              title={
                filter === "All"
                  ? "No incidents found."
                  : `No ${filter.toLowerCase()} incidents found.`
              }
              description="Incident records will appear here when available."
            />
          </div>
        )}

        {/* Incident cards */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((incident) => (
              <Card key={incident.id} className="h-full">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">
                      {incident.id}
                    </p>

                    <p className="text-sm text-neutral-600 mt-1">
                      {incident.type}
                    </p>
                  </div>

                  <Badge variant={statusVariant[incident.status] || "neutral"}>
                    {incident.status}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Location
                    </p>

                    <p className="text-sm text-neutral-700 mt-1 break-words">
                      {incident.zone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Reported
                    </p>

                    <p className="text-sm text-neutral-700 mt-1">
                      {incident.date}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => navigate(`/warden/incidents/${incident.id}`)}
                  >
                    View Incident
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
