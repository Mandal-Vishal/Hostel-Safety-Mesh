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
  { to: '/warden/audit-logs', label: 'Audit Logs' },
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
    (device) => device.id === normalized.id,
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
      : device,
  );
}

export default function Devices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    load();
  }, []);

  /**
   * Node came online.
   */
  useSocketEvent("node:online", (payload) => {
    if (!payload?.node) {
      return;
    }

    setDevices((current) => updateNodeList(current, payload.node));
  });

  /**
   * Node heartbeat / health update.
   *
   * This keeps the Warden page current without
   * requiring a refresh.
   */
  useSocketEvent("node:health", (payload) => {
    if (!payload?.node) {
      return;
    }

    setDevices((current) => updateNodeList(current, payload.node));
  });

  /**
   * Node became offline due to:
   *
   * 1. explicit MQTT NODE_OFFLINE
   * 2. heartbeat timeout
   */
  useSocketEvent("node:offline", (payload) => {
    if (!payload?.node) {
      return;
    }

    setDevices((current) => updateNodeList(current, payload.node));
  });

  function load() {
    setLoading(true);
    setError(false);

    getDevices()
      .then(setDevices)
      .catch((err) => {
        console.error("Failed to load devices:", err);
        setError(true);
      })
      .finally(() => setLoading(false));
  }

  const total = devices.length;
  const online = devices.filter((device) => device.status === "ONLINE").length;
  const offline = devices.filter(
    (device) => device.status === "OFFLINE",
  ).length;
  const warning = devices.filter(
    (device) => device.status === "WARNING",
  ).length;

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Device Health</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState onRetry={load} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 max-w-2xl">
            <StatCard label="Total Devices" value={total} />

            <StatCard label="Online" value={online} />

            <StatCard label="Offline" value={offline} accent="danger" />

            <StatCard label="Warning" value={warning} />
          </div>

          <Card className="max-w-2xl">
            <div className="divide-y divide-neutral-200">
              <div className="grid grid-cols-3 text-xs font-semibold text-neutral-600 uppercase pb-2">
                <span>Device ID</span>
                <span>Zone</span>
                <span>Status</span>
              </div>

              {devices.length === 0 && (
                <div className="py-6">
                  <p className="text-sm text-neutral-600">
                    No active devices registered.
                  </p>
                </div>
              )}

              {devices.map((device) => (
                <div key={device.id} className="grid grid-cols-3 py-3 text-sm">
                  <span className="text-neutral-900 font-medium">
                    {device.id}
                  </span>

                  <span className="text-neutral-600">{device.zone}</span>

                  <span
                    className={`font-medium ${
                      statusDot[device.status] || "text-neutral-600"
                    }`}
                  >
                    ● {device.status}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  );
}
