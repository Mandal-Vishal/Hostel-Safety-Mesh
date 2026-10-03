import { useEffect, useState } from 'react'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getZones } from '../../services/adminService'

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/zones', label: 'Zones' },
  { to: '/admin/devices', label: 'Devices' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
]

export default function Zones() {
  const [zones, setZones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getZones()
      .then(setZones)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Zones</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState />}

      {!loading && !error && (
        <div className="grid sm:grid-cols-3 gap-3 max-w-3xl">
          {zones.map((z) => (
            <Card key={z.id}>
              <p className="font-semibold text-neutral-900">{z.name}</p>
              <p className="text-sm text-neutral-600 mt-1">{z.floors} floors</p>
              <p className="text-sm text-neutral-600">{z.residents} residents</p>
              <p className="text-sm text-neutral-600">{z.devices} devices</p>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}