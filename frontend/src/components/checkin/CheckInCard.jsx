import { useNavigate } from 'react-router-dom'
import Card from '../ui/Card'
import Button from '../ui/Button'

export default function CheckInCard({ status }) {
  const navigate = useNavigate()

  return (
    <Card className="text-center">
      <p className="text-xs font-semibold tracking-wide text-neutral-600 uppercase">
        Night Check-In
      </p>

      {status.checkedIn ? (
        <>
          <p className="text-success-600 font-semibold mt-3">✓ Checked In</p>
          <p className="text-neutral-600 text-sm mt-1">{status.checkedInAt}</p>
        </>
      ) : (
        <>
          <p className="text-neutral-900 font-medium mt-3">You haven't checked in yet</p>
          <Button className="mt-4" onClick={() => navigate('/resident/check-in')}>
            Check In
          </Button>
        </>
      )}
    </Card>
  )
}