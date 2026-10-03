import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

export default function ReportIncident() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/resident/sos', { replace: true })
  }, [navigate])

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <p className="text-neutral-900 font-medium">
            Redirecting to SOS...
          </p>

          <p className="text-neutral-600 text-sm mt-2">
            The current backend incident workflow uses SOS alerts.
          </p>

          <Button
            className="mt-4"
            onClick={() => navigate('/resident/sos')}
          >
            Go to SOS
          </Button>
        </Card>
      </div>
    </DashboardLayout>
  )
}