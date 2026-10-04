import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import EmptyState from "../../components/ui/EmptyState";
import { getAllActiveSOS, updateSOSStatus } from "../../services/sosService";
import { useSocketEvent } from "../../hooks/useSocket";

const sidebarLinks = [
  { to: "/security/dashboard", label: "Dashboard" },
  { to: "/security/alerts", label: "Active Alerts" },
  { to: "/security/incidents", label: "Assigned Incidents" },
];

export default function SecurityAlerts() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [actingId, setActingId] = useState(null);

  const loadAlerts = async () => {
    setLoading(true);
    setError(false);

    try {
      const data = await getAllActiveSOS();

      setList(data.filter((sos) => sos.status === "ESCALATED"));
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  useSocketEvent("incident:escalated", loadAlerts);
  useSocketEvent("incident:resolved", loadAlerts);

  const handleResolve = async (sos) => {
    setActingId(sos.id);

    try {
      await updateSOSStatus(sos.id, "RESOLVED", {
        resolutionNote: "Security response completed.",
      });

      await loadAlerts();
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setActingId(null);
    }
  };

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <p className="text-sm font-medium text-danger-600">
            Security Operations
          </p>

          <h1 className="text-2xl font-bold text-neutral-900 mt-1">
            Active Alerts
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Escalated SOS incidents requiring security response.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={loadAlerts} />}

        {!loading && !error && list.length === 0 && (
          <EmptyState
            title="No active alerts"
            description="There are currently no escalated SOS incidents."
          />
        )}

        {!loading && !error && list.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {list.map((sos) => (
              <Card key={sos.id} className="border-l-4 border-danger-600">
                <div className="flex items-center justify-between gap-3">
                  <Badge variant="danger">ESCALATED SOS</Badge>

                  <span className="text-xs text-neutral-500">
                    {sos.triggeredAt}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-base font-semibold text-neutral-900">
                    {sos.zone || "Unknown location"}
                  </p>

                  <p className="text-sm text-neutral-600 mt-1">
                    Security assignment: active
                  </p>

                  {sos.escalationReason && (
                    <p className="text-sm text-neutral-600 mt-3">
                      <span className="font-medium">Reason:</span>{" "}
                      {sos.escalationReason}
                    </p>
                  )}
                </div>

                <Button
                  variant="success"
                  className="w-full mt-5"
                  disabled={actingId === sos.id}
                  onClick={() => handleResolve(sos)}
                >
                  {actingId === sos.id ? "Resolving..." : "Resolve Incident"}
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
