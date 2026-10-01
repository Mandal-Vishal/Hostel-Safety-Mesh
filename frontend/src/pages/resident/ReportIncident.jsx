import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import IncidentForm from '../../components/incidents/IncidentForm'
import { createIncident } from '../../services/incidentService'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

export default function ReportIncident() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(data) {
    setSubmitting(true)
    setError('')
    try {
      await createIncident(data)
      navigate('/resident/incidents')
    } catch {
      setError('Unable to submit report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-neutral-900 mb-4">Report an Incident</h1>
        <Card>
          {error && <p className="text-danger-600 text-sm mb-3">{error}</p>}
          <IncidentForm onSubmit={handleSubmit} submitting={submitting} />
        </Card>
      </div>
    </DashboardLayout>
  )
}