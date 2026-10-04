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

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Audit Logs
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Tamper-evident operational activity history.
          </p>
        </div>

        {/* Verification */}
        {verification && (
          <Card className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Chain Integrity
                </p>

                <p
                  className={`mt-1 text-lg font-bold ${
                    verification.valid ? "text-success-600" : "text-danger-600"
                  }`}
                >
                  {verification.valid
                    ? "✓ Audit Chain Verified"
                    : "✗ Audit Chain Invalid"}
                </p>
              </div>

              <Button
                variant="outline"
                onClick={runVerification}
                disabled={verifying}
                className="w-full sm:w-auto"
              >
                {verifying ? "Verifying..." : "Verify Again"}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5 pt-4 border-t border-neutral-200">
              <div>
                <p className="text-xs text-neutral-500">Records Verified</p>

                <p className="text-lg font-semibold text-neutral-900 mt-1">
                  {verification.totalLogs ?? 0}
                </p>
              </div>

              <div>
                <p className="text-xs text-neutral-500">Verification Time</p>

                <p className="text-sm font-medium text-neutral-900 mt-1 break-words">
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
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={loadLogs} />}

        {!loading && !error && (
          <Card className="w-full overflow-hidden">
            <div className="px-4 py-4 border-b border-neutral-200">
              <p className="font-semibold text-neutral-900">Activity History</p>

              <p className="text-xs text-neutral-500 mt-1">
                {logs.length} record{logs.length !== 1 ? "s" : ""}
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[850px] p-4">
                <div className="grid grid-cols-[1.3fr_1.1fr_1.5fr_1.5fr_1fr] gap-4 px-2 pb-3 text-[11px] font-semibold text-neutral-500 uppercase tracking-wide">
                  <span>Timestamp</span>
                  <span>Actor</span>
                  <span>Action</span>
                  <span>Resource</span>
                  <span>State</span>
                </div>

                <div className="divide-y divide-neutral-200">
                  {logs.length === 0 && (
                    <div className="py-10 text-center">
                      <p className="text-sm font-medium text-neutral-900">
                        No audit records found.
                      </p>
                    </div>
                  )}

                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="grid grid-cols-[1.3fr_1.1fr_1.5fr_1.5fr_1fr] gap-4 px-2 py-3.5 text-sm"
                    >
                      <span className="text-neutral-500 break-words">
                        {log.timestamp}
                      </span>

                      <span className="text-neutral-900 font-medium break-words">
                        {log.actor}
                      </span>

                      <span className="text-neutral-900 font-medium break-words">
                        {log.action}
                      </span>

                      <span className="text-neutral-600 break-words">
                        {log.resource}
                      </span>

                      <span className="text-neutral-600 break-words">
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
