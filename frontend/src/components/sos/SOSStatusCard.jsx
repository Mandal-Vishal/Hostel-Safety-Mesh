import Card from "../ui/Card";
import SOSTimeline from "./SOSTimeline";
import { getStatusMessage } from "../../utils/sosStatus";

const statusStyles = {
  PENDING: {
    label: "Awaiting acknowledgement",
    classes: "bg-warning-50 text-warning-600",
  },
  ACKNOWLEDGED: {
    label: "Help acknowledged",
    classes: "bg-success-50 text-success-600",
  },
  ESCALATED: {
    label: "Escalated to security",
    classes: "bg-danger-50 text-danger-600",
  },
  RESOLVED: {
    label: "Incident resolved",
    classes: "bg-success-50 text-success-600",
  },
};

export default function SOSStatusCard({ sos }) {
  const status = statusStyles[sos.status] || {
    label: sos.status,
    classes: "bg-neutral-100 text-neutral-600",
  };

  const isResolved = sos.status === "RESOLVED";
  const isEscalated = sos.status === "ESCALATED";

  return (
    <div className="space-y-4">
      <Card
        className={`overflow-hidden ${
          isResolved
            ? "border-success-300"
            : isEscalated
              ? "border-danger-500"
              : "border-danger-300"
        }`}
      >
        <div className="text-center px-2 sm:px-5 py-4">
          <div
            className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center ${
              isResolved
                ? "bg-success-50"
                : isEscalated
                  ? "bg-danger-50"
                  : "bg-danger-50"
            }`}
          >
            <span
              className={`font-bold ${
                isResolved ? "text-success-600" : "text-danger-600"
              }`}
            >
              {isResolved ? "✓" : "SOS"}
            </span>
          </div>

          <p
            className={`mt-4 text-lg font-bold ${
              isResolved ? "text-success-600" : "text-danger-600"
            }`}
          >
            {isResolved ? "SOS Resolved" : "SOS Active"}
          </p>

          <p className="text-sm text-neutral-700 mt-2">
            {getStatusMessage(sos.status)}
          </p>

          <span
            className={`inline-flex mt-4 px-3 py-1.5 rounded-full text-xs font-semibold ${status.classes}`}
          >
            {status.label}
          </span>

          <div className="mt-5 pt-4 border-t border-neutral-200 text-left space-y-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Location
              </p>

              <p className="text-sm font-medium text-neutral-900 mt-1 break-words">
                {sos.zone || "Location unavailable"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">
                Triggered
              </p>

              <p className="text-sm text-neutral-700 mt-1">
                {sos.triggeredAt || "Recorded"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <p className="font-semibold text-neutral-900 mb-4">
          SOS Status Timeline
        </p>

        <SOSTimeline currentStatus={sos.status} />
      </Card>
    </div>
  );
}
