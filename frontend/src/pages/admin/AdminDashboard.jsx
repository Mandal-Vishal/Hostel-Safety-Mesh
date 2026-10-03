import DashboardLayout from '../../components/layout/DashboardLayout'
import Card from '../../components/ui/Card'

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/users', label: 'Users' },
  { to: '/admin/zones', label: 'Zones' },
  { to: '/admin/devices', label: 'Devices' },
  { to: '/admin/analytics', label: 'Analytics' },
  { to: '/admin/audit-logs', label: 'Audit Logs' },
]

const stats = [
  {
    title: 'Total Users',
    value: '24',
    description: 'Registered hostel users',
  },
  {
    title: 'Active Zones',
    value: '6',
    description: 'Monitored hostel zones',
  },
  {
    title: 'Connected Devices',
    value: '18',
    description: 'Devices currently connected',
  },
  {
    title: 'Active Alerts',
    value: '2',
    description: 'Alerts requiring attention',
  },
]

const recentAlerts = [
  {
    id: 'SOS-1024',
    zone: 'Zone A - Floor 1',
    status: 'Resolved',
    time: '10:48 PM',
  },
  {
    id: 'SOS-1023',
    zone: 'Zone B - Floor 2',
    status: 'Acknowledged',
    time: '09:32 PM',
  },
  {
    id: 'SOS-1022',
    zone: 'Zone C - Floor 3',
    status: 'Resolved',
    time: '08:17 PM',
  },
]

const systemStatus = [
  {
    name: 'MQTT Gateway',
    status: 'Online',
  },
  {
    name: 'Node Server',
    status: 'Online',
  },
  {
    name: 'Database',
    status: 'Online',
  },
  {
    name: 'Emergency Service',
    status: 'Online',
  },
]

function StatusBadge({ status }) {
  const isOnline = status === 'Online'
  const isResolved = status === 'Resolved'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isOnline || isResolved
          ? 'bg-green-100 text-green-700'
          : 'bg-yellow-100 text-yellow-700'
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isOnline || isResolved ? 'bg-green-600' : 'bg-yellow-600'
        }`}
      />

      {status}
    </span>
  )
}

export default function AdminDashboard() {
  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="space-y-6">

        {/* Page Header */}
        <div>
          <h1 className="text-xl font-bold text-neutral-900">
            Admin Dashboard
          </h1>

          <p className="mt-1 text-sm text-neutral-600">
            Overview of hostel safety, users, devices and emergency activity.
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <div>
                <p className="text-sm font-medium text-neutral-600">
                  {stat.title}
                </p>

                <p className="mt-2 text-3xl font-bold text-neutral-900">
                  {stat.value}
                </p>

                <p className="mt-2 text-xs text-neutral-500">
                  {stat.description}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Dashboard Content */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

          {/* Recent Alerts */}
          <Card>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-neutral-900">
                Recent Safety Alerts
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                Latest emergency events recorded by the system.
              </p>
            </div>

            <div className="divide-y divide-neutral-200">
              {recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between gap-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900">
                      {alert.id}
                    </p>

                    <p className="mt-1 text-xs text-neutral-500">
                      {alert.zone}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <StatusBadge status={alert.status} />

                    <p className="mt-1 text-xs text-neutral-500">
                      {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* System Status */}
          <Card>
            <div className="mb-4">
              <h2 className="text-base font-semibold text-neutral-900">
                System Status
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                Current status of important safety infrastructure.
              </p>
            </div>

            <div className="divide-y divide-neutral-200">
              {systemStatus.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between py-3"
                >
                  <span className="text-sm font-medium text-neutral-900">
                    {service.name}
                  </span>

                  <StatusBadge status={service.status} />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Safety Overview */}
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-900">
              Safety Overview
            </h2>

            <p className="mt-1 text-sm text-neutral-600">
              Current operational overview of the hostel safety network.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

            {/* Normal Operations */}
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">
                  Normal Operations
                </span>

                <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              </div>

              <p className="mt-3 text-2xl font-bold text-neutral-900">
                4
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Zones operating normally
              </p>
            </div>

            {/* Monitoring */}
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">
                  Monitoring
                </span>

                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500" />
              </div>

              <p className="mt-3 text-2xl font-bold text-neutral-900">
                2
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Zones requiring monitoring
              </p>
            </div>

            {/* Critical */}
            <div className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700">
                  Critical Alerts
                </span>

                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              </div>

              <p className="mt-3 text-2xl font-bold text-neutral-900">
                0
              </p>

              <p className="mt-1 text-xs text-neutral-500">
                Active unresolved emergencies
              </p>
            </div>

          </div>
        </Card>

        {/* Quick Summary */}
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-900">
              Administration Summary
            </h2>

            <p className="mt-1 text-sm text-neutral-600">
              Key information available to the hostel administrator.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Emergency Response
              </p>

              <p className="mt-2 text-sm font-medium text-neutral-900">
                SOS monitoring is active
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                Emergency events can be acknowledged, monitored and resolved
                by authorized safety personnel.
              </p>
            </div>

            <div className="rounded-lg bg-neutral-50 p-4">
              <p className="text-xs font-semibold uppercase text-neutral-500">
                Privacy
              </p>

              <p className="mt-2 text-sm font-medium text-neutral-900">
                Privacy-preserving monitoring
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                The system is designed to minimize unnecessary exposure of
                resident and location information.
              </p>
            </div>

          </div>
        </Card>

      </div>
    </DashboardLayout>
  )
}