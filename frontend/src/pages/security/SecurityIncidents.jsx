import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import { getAllActiveSOS } from "../../services/sosService";
import { useSocketEvent } from "../../hooks/useSocket";

const sidebarLinks = [
  { to: "/security/dashboard", label: "Dashboard" },
  { to: "/security/alerts", label: "Active Alerts" },
  { to: "/security/incidents", label: "Assigned Incidents" },
];

export default function SecurityIncidents() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadIncidents = async () => {
    setLoading(true);
    setError(false);

    try {
      const data = await getAllActiveSOS();

      setList(
        data.filter(
          (sos) => sos.status === "ESCALATED" || sos.status === "ACKNOWLEDGED",
        ),
      );
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  useSocketEvent("incident:escalated", loadIncidents);
  useSocketEvent("incident:resolved", loadIncidents);

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <p className="text-sm font-medium text-primary-600">
            Security Operations
          </p>

          <h1 className="text-2xl font-bold text-neutral-900 mt-1">
            Assigned Incidents
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Incidents currently requiring security attention.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={loadIncidents} />}

        {!loading && !error && list.length === 0 && (
          <EmptyState
            title="No assigned incidents"
            description="There are currently no active incidents assigned to security."
          />
        )}

        {!loading && !error && list.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {list.map((sos) => (
              <Card key={sos.id}>
                <div className="flex items-center justify-between gap-3">
                  <Badge
                    variant={sos.status === "ESCALATED" ? "danger" : "warning"}
                  >
                    {sos.status}
                  </Badge>

                  <span className="text-xs text-neutral-500">
                    {sos.triggeredAt}
                  </span>
                </div>

                <p className="text-base font-semibold text-neutral-900 mt-4">
                  {sos.zone || "Unknown location"}
                </p>

                <p className="text-sm text-neutral-600 mt-1">
                  Incident requires security attention.
                </p>

                {sos.escalationReason && (
                  <p className="text-sm text-neutral-600 mt-3">
                    <span className="font-medium">Reason:</span>{" "}
                    {sos.escalationReason}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
