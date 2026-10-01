import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import StatCard from '../../components/dashboard/StatCard'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getDevices } from '../../services/deviceService'

const sidebarLinks = [
  { to: '/warden/dashboard', label: 'Dashboard' },
  { to: '/warden/sos', label: 'Active SOS' },
  { to: '/warden/check-ins', label: 'Check-Ins' },
  { to: '/warden/incidents', label: 'Incidents' },
  { to: '/warden/devices', label: 'Devices' },
  { to: '/warden/analytics', label: 'Analytics' },
]

const statusDot = {
  ONLINE: 'text-success-600',
  OFFLINE: 'text-danger-600',
  WARNING: 'text-warning-600',
}

export default function Devices() {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    setError(false)
    getDevices()
      .then(setDevices)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  const total = devices.length
  const online = devices.filter((d) => d.status === 'ONLINE').length
  const offline = devices.filter((d) => d.status === 'OFFLINE').length
  const warning = devices.filter((d) => d.status === 'WARNING').length

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Device Health</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState onRetry={load} />}

      {!loading && !error && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 max-w-2xl">
            <StatCard label="Total Devices" value={total} />
            <StatCard label="Online" value={online} />
            <StatCard label="Offline" value={offline} accent="danger" />
            <StatCard label="Warning" value={warning} />
          </div>

          <Card className="max-w-2xl">
            <div className="divide-y divide-neutral-200">
              <div className="grid grid-cols-3 text-xs font-semibold text-neutral-600 uppercase pb-2">
                <span>Device ID</span>
                <span>Zone</span>
                <span>Status</span>
              </div>
              {devices.map((d) => (
                <div key={d.id} className="grid grid-cols-3 py-3 text-sm">
                  <span className="text-neutral-900 font-medium">{d.id}</span>
                  <span className="text-neutral-600">{d.zone}</span>
                  <span className={`font-medium ${statusDot[d.status]}`}>● {d.status}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </DashboardLayout>
  )
}