import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Spinner from '../../components/ui/Spinner'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

// view states: 'loading' | 'not_checked_in' | 'checking_in' | 'success' | 'already' | 'outside_period' | 'error'
export default function CheckIn() {
  const [view, setView] = useState('loading')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    loadStatus()
  }, [])

  function loadStatus() {
    setView('loading')
    import('../../services/checkInService').then(({ getCurrentStatus }) => {
      getCurrentStatus()
        .then((data) => {
          setStatus(data)
          if (data.checkedIn) setView('already')
          else if (!data.withinPeriod) setView('outside_period')
          else setView('not_checked_in')
        })
        .catch(() => setView('error'))
    })
  }

  async function handleCheckIn() {
    setView('checking_in')
    try {
      const { checkIn } = await import('../../services/checkInService')
      const updated = await checkIn()
      setStatus(updated)
      setView('success')
    } catch (err) {
      if (err.message === 'OUTSIDE_PERIOD') setView('outside_period')
      else if (err.message === 'ALREADY_CHECKED_IN') setView('already')
      else setView('error')
    }
  }

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="max-w-md mx-auto">
        <Card className="text-center">
          <p className="text-xs font-semibold tracking-wide text-neutral-600 uppercase mb-4">
            Night Check-In
          </p>

          {view === 'loading' && (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          )}

          {view === 'not_checked_in' && (
            <>
              <p className="text-neutral-900 font-medium">You are currently eligible to check in.</p>
              <p className="text-neutral-600 text-sm mt-2">Zone: {status?.zone}</p>
              <Button className="mt-4" onClick={handleCheckIn}>Check In</Button>
            </>
          )}

          {view === 'checking_in' && (
            <div className="py-4">
              <Spinner className="mx-auto" />
              <p className="text-neutral-600 text-sm mt-3">Checking you in...</p>
            </div>
          )}

          {view === 'success' && (
            <>
              <p className="text-success-600 font-semibold text-lg">✓ Check-in successful</p>
              <p className="text-neutral-600 text-sm mt-2">Checked in at: {status?.checkedInAt}</p>
              <p className="text-neutral-600 text-sm">Zone: {status?.zone}</p>
              <p className="text-success-600 font-medium mt-2">Status: SAFE / CHECKED IN</p>
            </>
          )}

          {view === 'already' && (
            <p className="text-success-600 font-medium">✓ You're already checked in tonight.</p>
          )}

          {view === 'outside_period' && (
            <>
              <p className="text-neutral-900 font-medium">Check-in isn't currently available.</p>
              <p className="text-neutral-600 text-sm mt-2">
                Next check-in period: {status?.periodStart} – {status?.periodEnd}
              </p>
            </>
          )}

          {view === 'error' && (
            <>
              <p className="text-danger-600 font-medium">Unable to complete check-in.</p>
              <p className="text-neutral-600 text-sm mt-1">Please try again.</p>
              <Button variant="outline" className="mt-4" onClick={loadStatus}>Retry</Button>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  )
}