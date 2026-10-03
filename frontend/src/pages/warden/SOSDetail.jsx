import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import SOSTimeline from "../../components/sos/SOSTimeline";
import {
  getSOSDetails,
  acknowledgeSOS,
  updateSOSStatus,
} from "../../services/sosService";
import { useSocketEvent } from "../../hooks/useSocket";

const sidebarLinks = [
  { to: "/warden/dashboard", label: "Dashboard" },
  { to: "/warden/sos", label: "Active SOS" },
  { to: "/warden/check-ins", label: "Check-Ins" },
  { to: "/warden/incidents", label: "Incidents" },
  { to: "/warden/devices", label: "Devices" },
  { to: "/warden/analytics", label: "Analytics" },
];

export default function SOSDetail() {
  const { id } = useParams();

  const [sos, setSos] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [id]);

  useSocketEvent("incident:acknowledged", (payload) => {
    if (payload?.incident?.incidentId === id) {
      setSos(normalizeSOS(payload.incident));
    }
  });

  useSocketEvent("incident:escalated", (payload) => {
    if (payload?.incident?.incidentId === id) {
      setSos(normalizeSOS(payload.incident));
    }
  });

  useSocketEvent("incident:resolved", (payload) => {
    if (payload?.incident?.incidentId === id) {
      setSos(normalizeSOS(payload.incident));
    }
  });

  async function loadDetails() {
    setLoading(true);
    setError(false);

    try {
      const data = await getSOSDetails(id);
      setSos(data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcknowledge() {
    if (!sos || sos.status !== "PENDING") {
      return;
    }

    setActing(true);
    setError(false);

    try {
      const updated = await acknowledgeSOS(id);

      if (updated) {
        setSos(updated);
      } else {
        await loadDetails();
      }
    } catch {
      setError(true);
    } finally {
      setActing(false);
    }
  }

  async function handleResolve() {
    if (!sos || !["ACKNOWLEDGED", "ESCALATED"].includes(sos.status)) {
      return;
    }

    setActing(true);
    setError(false);

    try {
      const updated = await updateSOSStatus(id, "RESOLVED", {
        resolutionNote: "Warden resolved the SOS incident.",
      });

      if (updated) {
        setSos(updated);
      } else {
        await loadDetails();
      }
    } catch {
      setError(true);
    } finally {
      setActing(false);
    }
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="max-w-md">
        <h1 className="text-xl font-bold text-neutral-900 mb-4">
          SOS Incident
        </h1>

        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={loadDetails} />}

        {!loading && !error && sos && (
          <div className="space-y-4">
            <Card>
              {sos.status === "ESCALATED" && (
                <div className="bg-danger-50 border border-danger-500 rounded-lg p-3 mb-3">
                  <p className="text-danger-600 font-semibold text-sm">
                    SOS ESCALATED
                  </p>

                  <p className="text-danger-600 text-xs mt-1">
                    No acknowledgement was received within the configured
                    response window.
                  </p>
                </div>
              )}

              <p className="text-sm text-neutral-600">Status</p>

              <p className="font-bold text-danger-600">{sos.status}</p>

              <p className="text-sm text-neutral-600 mt-3">Resident</p>

              <p className="text-neutral-900">R••••••••</p>

              <p className="text-sm text-neutral-600 mt-3">Zone</p>

              <p className="text-neutral-900">{sos.zone}</p>

              <p className="text-sm text-neutral-600 mt-3">Triggered</p>

              <p className="text-neutral-900">{sos.triggeredAt}</p>

              {sos.status === "PENDING" && (
                <Button
                  className="w-full mt-4"
                  onClick={handleAcknowledge}
                  disabled={acting}
                >
                  {acting ? "Acknowledging..." : "Acknowledge"}
                </Button>
              )}

              {sos.status === "ACKNOWLEDGED" && (
                <Button
                  variant="success"
                  className="w-full mt-4"
                  onClick={handleResolve}
                  disabled={acting}
                >
                  {acting ? "Resolving..." : "Mark Resolved"}
                </Button>
              )}

              {sos.status === "ESCALATED" && (
                <Button
                  variant="success"
                  className="w-full mt-4"
                  onClick={handleResolve}
                  disabled={acting}
                >
                  {acting ? "Resolving..." : "Mark Resolved"}
                </Button>
              )}

              {sos.status === "RESOLVED" && (
                <p className="text-success-600 font-medium mt-4">
                  ✓ INCIDENT RESOLVED
                </p>
              )}
            </Card>

            <Card>
              <p className="font-semibold text-neutral-900 mb-4">Timeline</p>

              <SOSTimeline currentStatus={sos.status} />
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

function normalizeSOS(incident) {
  if (!incident) {
    return null;
  }

  const location = incident.location;

  const parts = [];

  if (location?.building) {
    parts.push(location.building);
  }

  if (location?.floor !== null && location?.floor !== undefined) {
    parts.push(`Floor ${location.floor}`);
  }

  if (location?.zone) {
    parts.push(location.zone);
  }

  return {
    ...incident,
    id: incident.incidentId,
    zone: parts.join(" • ") || "Location unavailable",
    triggeredAt: incident.createdAt,
    escalated: incident.status === "ESCALATED" || Boolean(incident.escalatedAt),
  };
}
