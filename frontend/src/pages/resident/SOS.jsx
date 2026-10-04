import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import SOSConfirmation from "../../components/sos/SOSConfirmation";
import SOSStatusCard from "../../components/sos/SOSStatusCard";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import Card from "../../components/ui/Card";
import { getActiveSOS, createSOS } from "../../services/sosService";
import { useSocketEvent } from "../../hooks/useSocket";

const mobileLinks = [
  { to: "/resident/dashboard", label: "Home" },
  { to: "/resident/check-in", label: "Check-In" },
  { to: "/resident/sos", label: "SOS" },
  { to: "/resident/incidents", label: "Incidents" },
];

export default function SOS() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeSOS, setActiveSOS] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadActive();
  }, []);

  useSocketEvent("incident:created", (payload) => {
    if (payload?.incident) {
      setActiveSOS(payload.incident);
    }
  });

  useSocketEvent("incident:acknowledged", (payload) => {
    if (payload?.incident) {
      setActiveSOS(payload.incident);
    }
  });

  useSocketEvent("incident:escalated", (payload) => {
    if (payload?.incident) {
      setActiveSOS(payload.incident);
    }
  });

  useSocketEvent("incident:resolved", (payload) => {
    if (payload?.incident) {
      setActiveSOS(null);
    }
  });

  function loadActive() {
    setLoading(true);
    setError(false);

    getActiveSOS()
      .then(setActiveSOS)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }

  async function handleConfirmSOS() {
    setSending(true);
    setError(false);

    try {
      const sos = await createSOS();

      setActiveSOS(sos);
      setConfirmOpen(false);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  }

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="w-full max-w-xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <p className="text-sm font-medium text-danger-600">
            Emergency Assistance
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-1">
            SOS
          </h1>

          <p className="text-sm text-neutral-500 mt-2">
            Use SOS only when you need immediate assistance from the hostel
            safety team.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {/* Error */}
        {!loading && error && <ErrorState onRetry={loadActive} />}

        {/* No active SOS */}
        {!loading && !error && !activeSOS && (
          <Card className="text-center">
            <div className="py-4 sm:py-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-danger-50 flex items-center justify-center">
                <span className="text-danger-600 font-bold text-2xl">SOS</span>
              </div>

              <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mt-5">
                Need immediate help?
              </h2>

              <p className="text-sm text-neutral-500 mt-2 max-w-sm mx-auto">
                Press the SOS button below to notify the hostel safety team. You
                will be asked to confirm before the alert is sent.
              </p>

              <SOSButtonDirect onPress={() => setConfirmOpen(true)} />

              <p className="text-xs text-neutral-500 mt-4">
                Your registered hostel location will be attached to the alert.
              </p>
            </div>
          </Card>
        )}

        {/* Active SOS */}
        {!loading && !error && activeSOS && <SOSStatusCard sos={activeSOS} />}
      </div>

      <SOSConfirmation
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSOS}
        sending={sending}
      />
    </DashboardLayout>
  );
}

function SOSButtonDirect({ onPress }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className="mt-6 w-44 h-44 sm:w-48 sm:h-48 rounded-full bg-danger-600 hover:bg-danger-500 active:bg-danger-700 text-white flex flex-col items-center justify-center shadow-lg mx-auto transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-danger-100"
    >
      <span className="text-3xl sm:text-4xl font-bold tracking-wide">SOS</span>

      <span className="text-xs sm:text-sm font-medium mt-2">GET HELP NOW</span>
    </button>
  );
}