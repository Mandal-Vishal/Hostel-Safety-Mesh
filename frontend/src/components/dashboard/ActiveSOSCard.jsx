import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'

export default function ActiveSOSCard({ sos }) {
  const navigate = useNavigate()

  return (
    <Card className="border-l-4 border-danger-600">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="danger">🔴 HIGH PRIORITY</Badge>
        <span className="text-xs text-neutral-600">{sos.triggeredAt}</span>
      </div>
      <p className="text-sm text-neutral-900">Resident: R***</p>
      <p className="text-sm text-neutral-600">Zone: {sos.zone}</p>
      <div className="flex gap-2 mt-3">
        <Button onClick={() => navigate(`/warden/sos/${sos.id}`)}>
          Acknowledge
        </Button>
        <Button variant="outline" onClick={() => navigate(`/warden/sos/${sos.id}`)}>
          View Details
        </Button>
      </div>
    </Card>
  )
}