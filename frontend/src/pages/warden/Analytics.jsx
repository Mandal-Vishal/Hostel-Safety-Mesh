import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'
import StatCard from '../../components/dashboard/StatCard'
import Spinner from '../../components/ui/Spinner'
import ErrorState from '../../components/ui/ErrorState'
import { getAnalytics } from '../../services/analyticsService'

const sidebarLinks = [
  { to: '/warden/dashboard', label: 'Dashboard' },
  { to: '/warden/sos', label: 'Active SOS' },
  { to: '/warden/check-ins', label: 'Check-Ins' },
  { to: '/warden/incidents', label: 'Incidents' },
  { to: '/warden/devices', label: 'Devices' },
  { to: '/warden/analytics', label: 'Analytics' },
  { to: '/warden/audit-logs', label: 'Audit Logs' },
]

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <h1 className="text-xl font-bold text-neutral-900 mb-4">Safety Analytics</h1>

      {loading && (
        <div className="flex justify-center py-10">
          <Spinner />
        </div>
      )}

      {!loading && error && <ErrorState />}

      {!loading && !error && data && (
        <div className="space-y-6 max-w-3xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total Incidents" value={data.totalIncidents} />
            <StatCard label="SOS Events" value={data.sosEvents} accent="danger" />
            <StatCard label="Avg Response" value={data.avgResponse} />
            <StatCard label="Resolved" value={data.resolved} />
          </div>

          <Card>
            <p className="font-semibold text-neutral-900 mb-3">Incidents by Day</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.incidentsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <p className="font-semibold text-neutral-900 mb-3">Incidents by Zone</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.incidentsByZone}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="zone" stroke="#475569" fontSize={12} />
                <YAxis stroke="#475569" fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" fill="#16a34a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <p className="font-semibold text-neutral-900 mb-3">Incident Categories</p>
            <div className="space-y-2">
              {data.categories.map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-900 w-32">{c.name}</span>
                  <div className="flex-1 bg-neutral-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-primary-600 h-full"
                      style={{ width: `${(c.count / data.totalIncidents) * 100 * 3}%` }}
                    />
                  </div>
                  <span className="text-sm text-neutral-600 w-8 text-right">{c.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </DashboardLayout>
  )
}