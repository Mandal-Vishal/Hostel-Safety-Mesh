import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import {
  getPendingSummary,
  getPendingResidents,
} from "../../services/checkInService";
import { useSocketEvent } from "../../hooks/useSocket";

const sidebarLinks = [
  { to: "/warden/dashboard", label: "Dashboard" },
  { to: "/warden/sos", label: "Active SOS" },
  { to: "/warden/check-ins", label: "Check-Ins" },
  { to: "/warden/incidents", label: "Incidents" },
  { to: "/warden/devices", label: "Devices" },
  { to: "/warden/analytics", label: "Analytics" },
];

export default function CheckIns() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedZone, setExpandedZone] = useState(null);
  const [pendingList, setPendingList] = useState([]);

  useEffect(() => {
    load();
  }, []);

  /**
   * ---------------------------------------------------------
   * REAL-TIME CHECK-IN UPDATE
   * ---------------------------------------------------------
   *
   * When a resident checks in, the backend emits:
   *
   *   checkin:updated
   *
   * The Warden page refreshes its summary automatically.
   */
  useSocketEvent("checkin:updated", async () => {
    try {
      await load();

      /**
       * If a zone is currently expanded, refresh that
       * zone's pending resident list too.
       */
      if (expandedZone) {
        const residents = await getPendingResidents(expandedZone);

        setPendingList(residents);
      }
    } catch (err) {
      console.error("Failed to refresh check-ins after live update:", err);
    }
  });

  async function load() {
    setLoading(true);
    setError(false);

    try {
      const data = await getPendingSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load Warden check-ins:", err);

      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function toggleZone(zone) {
    if (expandedZone === zone) {
      setExpandedZone(null);
      setPendingList([]);
      return;
    }

    try {
      const residents = await getPendingResidents(zone);

      setPendingList(residents);
      setExpandedZone(zone);
    } catch (err) {
      console.error("Failed to load pending residents:", err);

      setError(true);
    }
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-1">
        Pending Check-Ins
      </h1>

      <p className="text-sm text-neutral-600 mb-5">Tonight</p>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState onRetry={load} />}

      {!loading && !error && summary.length === 0 && (
        <Card>
          <p className="font-semibold text-neutral-900">
            No check-in records for tonight.
          </p>

          <p className="text-sm text-neutral-600 mt-1">
            No active residents are currently scheduled for the night check-in
            period.
          </p>
        </Card>
      )}

      {!loading && !error && summary.length > 0 && (
        <div className="space-y-3 max-w-md">
          {summary.map((z) => (
            <Card key={z.zone}>
              <p className="font-semibold text-neutral-900">{z.zone}</p>

              <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
                <div>
                  <p className="text-neutral-600 text-xs">Expected</p>

                  <p className="font-medium text-neutral-900">{z.expected}</p>
                </div>

                <div>
                  <p className="text-neutral-600 text-xs">Checked In</p>

                  <p className="font-medium text-success-600">{z.checkedIn}</p>
                </div>

                <div>
                  <p className="text-neutral-600 text-xs">Pending</p>

                  <p className="font-medium text-danger-600">{z.pending}</p>
                </div>
              </div>

              {z.missed > 0 && (
                <p className="text-sm text-danger-600 mt-3">
                  Missed: {z.missed}
                </p>
              )}

              <Button
                variant="outline"
                className="mt-3"
                onClick={() => toggleZone(z.zone)}
              >
                {expandedZone === z.zone ? "Hide Pending" : "View Pending"}
              </Button>

              {expandedZone === z.zone && (
                <div className="mt-3 border-t border-neutral-200 pt-3 space-y-2">
                  {pendingList.length === 0 ? (
                    <p className="text-sm text-success-600">
                      No pending residents in this zone.
                    </p>
                  ) : (
                    pendingList.map((resident) => (
                      <div
                        key={resident.id}
                        className="flex items-center justify-between gap-3 text-sm"
                      >
                        <span className="text-neutral-900">
                          {resident.name || resident.id}
                        </span>

                        <span className="text-danger-600 font-medium">
                          {resident.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
