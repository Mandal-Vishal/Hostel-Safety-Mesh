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

        if (data.checkedIn) {
          setView("already");
        } else {
          setView("not_checked_in");
        }
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

  const zoneLabel = location
    ? [
        location.building,
        location.floor !== null && location.floor !== undefined
          ? `Floor ${location.floor}`
          : null,
        location.zone,
      ]
        .filter(Boolean)
        .join(" • ")
    : "Your registered hostel zone";

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <p className="text-xs font-semibold tracking-wide text-neutral-600 uppercase mb-4">
            Night Check-In
          </p>

          {view === "loading" && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}

          {view === "not_checked_in" && (
            <>
              <p className="text-neutral-900 font-medium">
                You haven't checked in yet.
              </p>

              <p className="text-neutral-600 text-sm mt-2">Zone: {zoneLabel}</p>

              <Button className="mt-4" onClick={handleCheckIn}>
                Check In
              </Button>
            </>
          )}

          {view === "checking_in" && (
            <div className="py-4">
              <Spinner className="mx-auto" />
              <p className="text-neutral-600 text-sm mt-3">
                Checking you in...
              </p>
            </div>
          )}

          {view === "success" && (
            <>
              <p className="text-success-600 font-semibold text-lg">
                ✓ Check-in successful
              </p>

              <p className="text-neutral-600 text-sm mt-2">
                Checked in at: {status?.checkedInAt}
              </p>

              <p className="text-neutral-600 text-sm">Zone: {zoneLabel}</p>

              <p className="text-success-600 font-medium mt-2">
                Status: SAFE / CHECKED IN
              </p>
            </>
          )}

          {view === "already" && (
            <>
              <p className="text-success-600 font-medium">
                ✓ You're already checked in tonight.
              </p>

              {status?.checkedInAt && (
                <p className="text-neutral-600 text-sm mt-2">
                  Checked in at: {status.checkedInAt}
                </p>
              )}
            </>
          )}

          {view === "error" && (
            <>
              <p className="text-danger-600 font-medium">
                Unable to complete check-in.
              </p>

              <p className="text-neutral-600 text-sm mt-1">{errorMessage}</p>

              <Button variant="outline" className="mt-4" onClick={loadStatus}>
                Retry
              </Button>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
