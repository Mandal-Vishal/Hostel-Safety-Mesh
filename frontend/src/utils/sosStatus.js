export const SOS_STATUSES = [
  "PENDING",
  "ACKNOWLEDGED",
  "ESCALATED",
  "RESOLVED",
];

export function getStatusMessage(status) {
  switch (status) {
    case "PENDING":
      return "Your SOS has been received. A warden is reviewing it.";

    case "ACKNOWLEDGED":
      return "Your warden has acknowledged the SOS.";

    case "ESCALATED":
      return "Your SOS has been escalated to security.";

    case "RESOLVED":
      return "This SOS incident has been resolved.";

    default:
      return "";
  }
}

export function getStatusLabel(status) {
  return status.replace("_", " ");
}
