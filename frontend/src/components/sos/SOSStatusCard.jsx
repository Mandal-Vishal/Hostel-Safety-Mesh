import Card from '../ui/Card'
import SOSTimeline from './SOSTimeline'
import { getStatusMessage } from '../../utils/sosStatus'

export default function SOSStatusCard({ sos }) {
  return (
    <div className="space-y-4">
      <Card className="text-center border-danger-500">
        <p className="text-danger-600 font-bold text-lg">SOS ACTIVE</p>
        <p className="text-neutral-900 font-medium mt-2">{getStatusMessage(sos.status)}</p>
        <p className="text-danger-600 font-semibold mt-3">● {sos.status}</p>
        <p className="text-neutral-600 text-sm mt-3">Location: {sos.zone}</p>
        <p className="text-neutral-600 text-sm">{sos.triggeredAt}</p>
      </Card>

      <Card>
        <p className="font-semibold text-neutral-900 mb-4">SOS Status</p>
        <SOSTimeline currentStatus={sos.status} />
      </Card>
    </div>
  )
}