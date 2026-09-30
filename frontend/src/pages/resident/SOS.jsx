import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import SOSButton from '../../components/sos/SOSButton'
import SOSConfirmation from '../../components/sos/SOSConfirmation'
import SOSStatusCard from '../../components/sos/SOSStatusCard'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getActiveSOS, createSOS } from '../../services/sosService'

const mobileLinks = [
  { to: '/resident/dashboard', label: 'Home' },
  { to: '/resident/check-in', label: 'Check-In' },
  { to: '/resident/sos', label: 'SOS' },
  { to: '/resident/incidents', label: 'Incidents' },
]

export default function SOS() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeSOS, setActiveSOS] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    loadActive()
  }, [])

  function loadActive() {
    setLoading(true)
    setError(false)
    getActiveSOS()
      .then(setActiveSOS)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  async function handleConfirmSOS() {
    setSending(true)
    try {
      const sos = await createSOS()
      setActiveSOS(sos)
      setConfirmOpen(false)
    } catch {
      setError(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <DashboardLayout mobileLinks={mobileLinks}>
      <div className="max-w-md mx-auto">
        {loading && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState onRetry={loadActive} />}

        {!loading && !error && !activeSOS && (
          <div className="text-center py-10">
            <p className="text-neutral-600 mb-6 text-sm">
              Press the button below only if you need immediate assistance.
            </p>
            <SOSButtonDirect onPress={() => setConfirmOpen(true)} />
          </div>
        )}

        {!loading && !error && activeSOS && <SOSStatusCard sos={activeSOS} />}

        <SOSConfirmation
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirmSOS}
          sending={sending}
        />
      </div>
    </DashboardLayout>
  )
}

// local variant of SOSButton that triggers the confirm modal instead of navigating
function SOSButtonDirect({ onPress }) {
  return (
    <button
      onClick={onPress}
      className="w-40 h-40 rounded-full bg-danger-600 hover:bg-danger-500 text-white flex flex-col items-center justify-center shadow-lg mx-auto transition-colors"
    >
      <span className="text-2xl font-bold">SOS</span>
      <span className="text-xs mt-1">GET HELP NOW</span>
    </button>
  )
}