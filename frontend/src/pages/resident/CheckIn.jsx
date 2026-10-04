import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import { useAuth } from "../../hooks/useAuth";
import { getCurrentStatus, checkIn } from "../../services/checkInService";

const mobileLinks = [
  { to: "/resident/dashboard", label: "Home" },
  { to: "/resident/check-in", label: "Check-In" },
  { to: "/resident/sos", label: "SOS" },
  { to: "/resident/incidents", label: "Incidents" },
];

function formatLocation(location) {
  if (!location) return "Location unavailable";

  return [
    location.building,
    location.floor !== null && location.floor !== undefined
      ? `Floor ${location.floor}`
      : null,
    location.room ? `Room ${location.room}` : null,
    location.zone || null,
  ]
    .filter(Boolean)
    .join(" • ");
}

export default function CheckIn() {
  const { user } = useAuth();

  const [view, setView] = useState("loading");
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadStatus();
  }, []);

  function loadStatus() {
    setView("loading");
    setErrorMessage("");

    getCurrentStatus()
      .then((data) => {
        setStatus(data);
        setView(data.checkedIn ? "already" : "not_checked_in");
      })
      .catch(() => {
        setErrorMessage("Unable to load check-in status.");
        setView("error");
      });
  }

  async function handleCheckIn() {
    setView("checking_in");
    setErrorMessage("");

    try {
      const updated = await checkIn();

      setStatus(updated);
      setView("success");
    } catch (err) {
      if (err.message === "OUTSIDE_PERIOD") {
        setErrorMessage(
          "Check-in is not currently available. Please try again during the configured night check-in period.",
        );
      } else if (err.message === "ALREADY_CHECKED_IN") {
        setErrorMessage("You are already checked in for tonight.");
      } else {
        setErrorMessage(
          err.response?.data?.message ||
            "Unable to complete check-in. Please try again.",
        );
      }

      setView("error");
    }
  }

  const location = user?.currentZone || user?.hostel || null;
  const locationLabel = formatLocation(location);

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Resident";

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="w-full max-w-xl mx-auto space-y-5">
        {/* Header */}
        <div>
          <p className="text-sm font-medium text-primary-600">
            Resident Portal
          </p>

          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-1">
            Night Check-In
          </h1>

          <p className="text-sm text-neutral-500 mt-2">
            Confirm that you have safely returned to your hostel.
          </p>
        </div>

        {/* Resident information */}
        <Card>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 shrink-0 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700">
              ◉
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Resident
              </p>

              <p className="font-semibold text-neutral-900 mt-1">
                {displayName}
              </p>

              <p className="text-sm text-neutral-500 mt-1 break-words">
                {locationLabel}
              </p>
            </div>
          </div>
        </Card>

        {/* Main status */}
        <Card className="overflow-hidden">
          <div className="text-center px-2 sm:px-6 py-4 sm:py-6">
            {view === "loading" && (
              <div className="py-8">
                <Spinner />
                <p className="text-sm text-neutral-500 mt-3">
                  Loading your check-in status...
                </p>
              </div>
            )}

            {view === "not_checked_in" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-warning-50 flex items-center justify-center">
                  <span className="text-warning-600 text-2xl">!</span>
                </div>

                <p className="text-lg font-semibold text-neutral-900 mt-4">
                  You haven't checked in yet
                </p>

                <p className="text-sm text-neutral-500 mt-2">
                  Please confirm your safe return during the night check-in
                  period.
                </p>

                <div className="bg-neutral-50 rounded-xl p-4 mt-5 text-left">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Check-In Location
                  </p>

                  <p className="text-sm font-medium text-neutral-900 mt-1 break-words">
                    {locationLabel}
                  </p>
                </div>

                <Button className="w-full mt-5" onClick={handleCheckIn}>
                  Check In Now
                </Button>
              </>
            )}

            {view === "checking_in" && (
              <div className="py-8">
                <Spinner />

                <p className="text-lg font-semibold text-neutral-900 mt-4">
                  Checking you in...
                </p>

                <p className="text-sm text-neutral-500 mt-1">
                  Please keep this page open.
                </p>
              </div>
            )}

            {view === "success" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-success-50 flex items-center justify-center">
                  <span className="text-success-600 text-2xl">✓</span>
                </div>

                <p className="text-xl font-bold text-success-600 mt-4">
                  Check-In Successful
                </p>

                <p className="text-sm text-neutral-500 mt-2">
                  Your safe-return status has been recorded.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-left">
                  <div className="rounded-xl bg-neutral-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Checked In At
                    </p>

                    <p className="text-sm font-semibold text-neutral-900 mt-1">
                      {status?.checkedInAt || "Just now"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-success-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Status
                    </p>

                    <p className="text-sm font-semibold text-success-600 mt-1">
                      SAFE / CHECKED IN
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 p-4 mt-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Recorded Location
                  </p>

                  <p className="text-sm font-medium text-neutral-900 mt-1 break-words">
                    {locationLabel}
                  </p>
                </div>
              </>
            )}

            {view === "already" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-success-50 flex items-center justify-center">
                  <span className="text-success-600 text-2xl">✓</span>
                </div>

                <p className="text-xl font-bold text-success-600 mt-4">
                  You're Checked In
                </p>

                <p className="text-sm text-neutral-500 mt-2">
                  Your safe-return check-in for tonight is already recorded.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 text-left">
                  <div className="rounded-xl bg-neutral-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Check-In Time
                    </p>

                    <p className="text-sm font-semibold text-neutral-900 mt-1">
                      {status?.checkedInAt || "Recorded"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-success-50 p-4">
                    <p className="text-xs uppercase tracking-wide text-neutral-500">
                      Status
                    </p>

                    <p className="text-sm font-semibold text-success-600 mt-1">
                      SAFE / CHECKED IN
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-neutral-200 p-4 mt-3 text-left">
                  <p className="text-xs uppercase tracking-wide text-neutral-500">
                    Registered Location
                  </p>

                  <p className="text-sm font-medium text-neutral-900 mt-1 break-words">
                    {locationLabel}
                  </p>
                </div>
              </>
            )}

            {view === "error" && (
              <>
                <div className="mx-auto w-16 h-16 rounded-full bg-danger-50 flex items-center justify-center">
                  <span className="text-danger-600 text-2xl">!</span>
                </div>

                <p className="text-lg font-semibold text-danger-600 mt-4">
                  Check-In Unavailable
                </p>

                <p className="text-sm text-neutral-600 mt-2">{errorMessage}</p>

                <Button
                  variant="outline"
                  className="w-full sm:w-auto mt-5"
                  onClick={loadStatus}
                >
                  Try Again
                </Button>
              </>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
