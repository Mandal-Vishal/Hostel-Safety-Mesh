import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import { getAuditLogs, verifyAuditChain } from "../../services/auditService";

const sidebarLinks = [
  { to: "/warden/dashboard", label: "Dashboard" },
  { to: "/warden/sos", label: "Active SOS" },
  { to: "/warden/check-ins", label: "Check-Ins" },
  { to: "/warden/incidents", label: "Incidents" },
  { to: "/warden/devices", label: "Devices" },
  { to: "/warden/analytics", label: "Analytics" },
  { to: "/warden/audit-logs", label: "Audit Logs" },
];

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState(false);
  const [verification, setVerification] = useState(null);

  useEffect(() => {
    loadLogs();
    runVerification();
  }, []);

  async function loadLogs() {
    setLoading(true);
    setError(false);

    try {
      const data = await getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  async function runVerification() {
    setVerifying(true);

    try {
      const result = await verifyAuditChain();
      setVerification(result);
    } catch (err) {
      console.error("Failed to verify audit chain:", err);

      setVerification({
        valid: false,
        totalLogs: 0,
        verifiedAt: null,
        reason: "Verification request failed",
      });
    } finally {
      setVerifying(false);
    }
  }

  async function handleVerify() {
    await runVerification();
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">Audit Logs</h1>

          <p className="text-sm text-neutral-600 mt-1">
            Tamper-evident operational activity history.
          </p>
        </div>

        {verification && (
          <Card className="max-w-3xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-600">Chain Integrity</p>

                <p
                  className={
                    verification.valid
                      ? "text-success-600 font-bold text-lg"
                      : "text-danger-600 font-bold text-lg"
                  }
                >
                  {verification.valid ? "✓ VERIFIED" : "✗ INVALID"}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={handleVerify}
                disabled={verifying}
              >
                {verifying ? "Verifying..." : "Verify Again"}
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-neutral-600">Records Verified</p>

                <p className="font-semibold text-neutral-900">
                  {verification.totalLogs ?? 0}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-600">Verification Time</p>

                <p className="font-semibold text-neutral-900 text-sm">
                  {verification.verifiedAt || "Not available"}
                </p>
              </div>
            </div>

            {!verification.valid && verification.reason && (
              <p className="text-sm text-danger-600 mt-4">
                {verification.reason}
              </p>
            )}
          </Card>
        )}

        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={loadLogs} />}

        {!loading && !error && (
          <Card className="w-full max-w-6xl">
            <div className="overflow-x-auto">
              <div className="min-w-[850px]">
                <div className="grid grid-cols-[1.3fr_1.1fr_1.5fr_1.5fr_1fr] gap-4 px-2 pb-2 text-xs font-semibold text-neutral-600 uppercase">
                  <span>Timestamp</span>
                  <span>Actor</span>
                  <span>Action</span>
                  <span>Resource</span>
                  <span>State</span>
                </div>

                <div className="divide-y divide-neutral-200">
                  {logs.length === 0 && (
                    <div className="py-8">
                      <p className="text-sm text-neutral-600">
                        No audit records found.
                      </p>
                    </div>
                  )}

                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-[1.3fr_1.1fr_1.5fr_1.5fr_1fr] gap-4 px-2 py-3 text-sm"
                    >
                      <span className="text-neutral-600">{log.timestamp}</span>

                      <span className="text-neutral-900">{log.actor}</span>

                      <span className="text-neutral-900 font-medium">
                        {log.action}
                      </span>

                      <span className="text-neutral-600 break-words">
                        {log.resource}
                      </span>

                      <span className="text-neutral-600">
                        {log.previousState
                          ? `${log.previousState} → ${log.newState}`
                          : log.newState || "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
