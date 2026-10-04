import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import StatCard from "../../components/dashboard/StatCard";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import { getDevices } from "../../services/deviceService";
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

const statusDot = {
  ONLINE: "text-success-600",
  OFFLINE: "text-danger-600",
  WARNING: "text-warning-600",
};

function formatZone(location) {
  if (!location) return "Unassigned";

  const parts = [];

  if (location.building) {
    parts.push(location.building);
  }

  if (location.floor !== null && location.floor !== undefined) {
    parts.push(`Floor ${location.floor}`);
  }

  if (location.zone) {
    parts.push(location.zone);
  }

  return parts.join(" • ") || "Unassigned";
}

function normalizeNode(node) {
  return {
    ...node,
    id: node.nodeId,
    zone: formatZone(node.location),
  };
}

function updateNodeList(current, incomingNode) {
  if (!incomingNode) {
    return current;
  }

  const normalized = normalizeNode(incomingNode);

  const existingIndex = current.findIndex(
    (device) => device.id === normalized.id
  );

  if (existingIndex === -1) {
    return [...current, normalized];
  }

  return current.map((device) =>
    device.id === normalized.id
      ? {
          ...device,
          ...normalized,
        }
      : device
  );
}

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    load();
  }, []);

  useSocketEvent("node:online", (payload) => {
    if (!payload?.node) return;

    setDevices((current) => updateNodeList(current, payload.node));
  });

  useSocketEvent("node:health", (payload) => {
    if (!payload?.node) return;

    setDevices((current) => updateNodeList(current, payload.node));
  });

  useSocketEvent("node:offline", (payload) => {
    if (!payload?.node) return;

    setDevices((current) => updateNodeList(current, payload.node));
  });

  function load() {
    setLoading(true);
    setError(false);

    getDevices()
      .then((data) => setDevices(data))
      .catch((err) => {
        console.error("Failed to load devices:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }

  const total = devices.length;
  const online = devices.filter((device) => device.status === "ONLINE").length;
  const offline = devices.filter((device) => device.status === "OFFLINE").length;
  const warning = devices.filter((device) => device.status === "WARNING").length;

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="w-full max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Device Health
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Monitor corridor and room safety nodes in real time.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={load} />}

        {!loading && !error && (
          <>
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <StatCard label="Total Devices" value={total} />
              <StatCard label="Online" value={online} />
              <StatCard
                label="Offline"
                value={offline}
                accent="danger"
              />
              <StatCard label="Warning" value={warning} />
            </div>

            {/* Devices */}
            <Card className="w-full overflow-hidden">
              <div className="px-1 sm:px-2">
                {/* Desktop/tablet header */}
                <div className="hidden sm:grid grid-cols-[1.1fr_1.6fr_0.8fr] gap-4 px-3 pb-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  <span>Device ID</span>
                  <span>Location</span>
                  <span>Status</span>
                </div>

                {devices.length === 0 && (
                  <div className="py-10 text-center">
                    <p className="text-sm font-medium text-neutral-900">
                      No active devices registered.
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Connected safety nodes will appear here.
                    </p>
                  </div>
                )}

                {devices.map((device) => (
                  <div
                    key={device.id}
                    className="border-t border-neutral-200 px-3 py-4 sm:grid sm:grid-cols-[1.1fr_1.6fr_0.8fr] sm:gap-4 sm:items-center"
                  >
                    {/* Device */}
                    <div className="mb-2 sm:mb-0">
                      <p className="text-sm font-semibold text-neutral-900 break-all">
                        {device.id}
                      </p>
                    </div>

                    {/* Location */}
                    <div className="mb-2 sm:mb-0">
                      <p className="text-xs text-neutral-500 sm:hidden mb-0.5">
                        Location
                      </p>
                      <p className="text-sm text-neutral-600">
                        {device.zone}
                      </p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs text-neutral-500 sm:hidden mb-0.5">
                        Status
                      </p>

                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                          statusDot[device.status] || "text-neutral-600"
                        }`}
                      >
                        <span>●</span>
                        {device.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}