import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

export default function ActiveSOSCard({ sos }) {
  const navigate = useNavigate()

  const isEscalated = sos.status === 'ESCALATED'
  const isAcknowledged = sos.status === 'ACKNOWLEDGED'
  const isPending = sos.status === 'PENDING'

  return (
    <Card
      className={`border-l-4 ${
        isEscalated
          ? 'border-danger-600 bg-danger-50'
          : 'border-danger-600'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge variant="danger">
          {isEscalated ? 'ESCALATED' : 'HIGH PRIORITY'}
        </Badge>

        <span className="text-xs text-neutral-600">
          {sos.triggeredAt}
        </span>
      </div>

      {isEscalated && (
        <p className="text-danger-600 text-xs font-medium mb-2">
          This SOS has been escalated to security.
        </p>
      )}

      <p className="text-sm text-neutral-900">
        Resident: R***
      </p>

      <p className="text-sm text-neutral-600">
        Zone: {sos.zone}
      </p>

      <p className="text-sm text-neutral-600 mt-1">
        Status: {sos.status}
      </p>

      <div className="flex gap-2 mt-3">
        {isPending && (
          <Button onClick={() => navigate(`/warden/sos/${sos.id}`)}>
            Acknowledge
          </Button>
        )}

        {isAcknowledged && (
          <Button onClick={() => navigate(`/warden/sos/${sos.id}`)}>
            View / Escalate
          </Button>
        )}

        {isEscalated && (
          <Button onClick={() => navigate(`/warden/sos/${sos.id}`)}>
            View Escalation
          </Button>
        )}

        <Button
          variant="outline"
          onClick={() => navigate(`/warden/sos/${sos.id}`)}
        >
          Details
        </Button>
      </div>
    </Card>
  )
}