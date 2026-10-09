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
  { to: "/warden/audit-logs", label: "Audit Logs" },
];

function getFullName(resident) {
  return (
    [resident.firstName, resident.lastName].filter(Boolean).join(" ") ||
    resident.name ||
    "Resident"
  );
}

function getLocation(resident) {
  const location =
    resident.currentZone || resident.hostel || resident.zone || {};

  const parts = [];

  if (location.building) {
    parts.push(location.building);
  }

  if (location.floor !== null && location.floor !== undefined) {
    parts.push(`Floor ${location.floor}`);
  }

  if (location.room) {
    parts.push(`Room ${location.room}`);
  }

  if (location.zone) {
    parts.push(location.zone);
  }

  return parts.join(" • ");
}

export default function CheckIns() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedZone, setExpandedZone] = useState(null);
  const [pendingList, setPendingList] = useState([]);

  useEffect(() => {
    load();
  }, []);

  useSocketEvent("checkin:updated", async () => {
    try {
      await load();

      if (expandedZone) {
        const residents = await getPendingResidents(expandedZone);
        setPendingList(residents);
      }
    } catch (err) {
      console.error("Failed to refresh check-ins:", err);
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

  const totalExpected = summary.reduce((sum, zone) => sum + zone.expected, 0);

  const totalCheckedIn = summary.reduce((sum, zone) => sum + zone.checkedIn, 0);

  const totalPending = summary.reduce((sum, zone) => sum + zone.pending, 0);

  const totalMissed = summary.reduce((sum, zone) => sum + zone.missed, 0);

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Check-In Monitoring
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Tonight's resident safety check-in status.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={load} />}

        {!loading && !error && summary.length === 0 && (
          <Card>
            <p className="font-semibold text-neutral-900">
              No check-in records for tonight.
            </p>

            <p className="text-sm text-neutral-500 mt-1">
              No active residents are currently scheduled for the night check-in
              period.
            </p>
          </Card>
        )}

        {!loading && !error && summary.length > 0 && (
          <>
            {/* Overall summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <Card>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Expected
                </p>
                <p className="text-2xl font-bold text-neutral-900 mt-1">
                  {totalExpected}
                </p>
              </Card>

              <Card>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Checked In
                </p>
                <p className="text-2xl font-bold text-success-600 mt-1">
                  {totalCheckedIn}
                </p>
              </Card>

              <Card>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Pending
                </p>
                <p className="text-2xl font-bold text-danger-600 mt-1">
                  {totalPending}
                </p>
              </Card>

              <Card>
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  Missed
                </p>
                <p className="text-2xl font-bold text-warning-600 mt-1">
                  {totalMissed}
                </p>
              </Card>
            </div>

            {/* Zone cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {summary.map((zone) => (
                <Card key={zone.zone} className="h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="font-semibold text-neutral-900">
                        {zone.zone}
                      </h2>

                      <p className="text-xs text-neutral-500 mt-1">
                        Resident check-in area
                      </p>
                    </div>

                    {zone.pending > 0 && (
                      <span className="shrink-0 inline-flex px-2.5 py-1 rounded-full bg-danger-50 text-danger-600 text-xs font-semibold">
                        {zone.pending} pending
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500">Expected</p>
                      <p className="font-semibold text-neutral-900 mt-1">
                        {zone.expected}
                      </p>
                    </div>

                    <div className="bg-success-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500">Checked In</p>
                      <p className="font-semibold text-success-600 mt-1">
                        {zone.checkedIn}
                      </p>
                    </div>

                    <div className="bg-danger-50 rounded-lg p-3">
                      <p className="text-xs text-neutral-500">Pending</p>
                      <p className="font-semibold text-danger-600 mt-1">
                        {zone.pending}
                      </p>
                    </div>
                  </div>

                  {zone.missed > 0 && (
                    <p className="text-sm text-warning-600 font-medium mt-3">
                      {zone.missed} missed check-in
                      {zone.missed !== 1 ? "s" : ""}
                    </p>
                  )}

                  <Button
                    variant="outline"
                    className="mt-4 w-full sm:w-auto"
                    onClick={() => toggleZone(zone.zone)}
                  >
                    {expandedZone === zone.zone
                      ? "Hide Pending Residents"
                      : "View Pending Residents"}
                  </Button>

                  {expandedZone === zone.zone && (
                    <div className="mt-4 pt-4 border-t border-neutral-200">
                      {pendingList.length === 0 ? (
                        <div className="rounded-lg bg-success-50 p-4">
                          <p className="text-sm font-medium text-success-600">
                            No pending residents in this zone.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {pendingList.map((resident) => (
                            <div
                              key={resident.id}
                              className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                            >
                              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="font-semibold text-neutral-900">
                                    {getFullName(resident)}
                                  </p>

                                  <p className="text-sm text-neutral-600 mt-1 break-words">
                                    {getLocation(resident)}
                                  </p>
                                </div>

                                <span className="shrink-0 inline-flex w-fit px-2.5 py-1 rounded-full bg-danger-50 text-danger-600 text-xs font-semibold">
                                  {resident.status}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-3 border-t border-neutral-200">
                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                                    Building
                                  </p>
                                  <p className="text-sm font-medium text-neutral-900 mt-1">
                                    {resident.building || "—"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                                    Floor
                                  </p>
                                  <p className="text-sm font-medium text-neutral-900 mt-1">
                                    {resident.floor ?? "—"}
                                  </p>
                                </div>

                                <div>
                                  <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                                    Room
                                  </p>
                                  <p className="text-sm font-medium text-neutral-900 mt-1">
                                    {resident.room || "—"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
