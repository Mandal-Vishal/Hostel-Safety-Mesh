import Card from '../ui/Card'

export default function SOSStatusCard({ sos }) {
  return (
    <Card className="text-center border-danger-500">
      <p className="text-danger-600 font-bold text-lg">SOS ACTIVE</p>
      <p className="text-neutral-900 font-medium mt-2">Help has been requested</p>
      <p className="text-danger-600 font-semibold mt-3">● {sos.status}</p>
      <p className="text-neutral-600 text-sm mt-3">
        Your safety team has been notified.
      </p>
      <p className="text-neutral-600 text-sm mt-2">Location: {sos.zone}</p>
      <p className="text-neutral-600 text-sm">{sos.triggeredAt}</p>
    </Card>
  )
}