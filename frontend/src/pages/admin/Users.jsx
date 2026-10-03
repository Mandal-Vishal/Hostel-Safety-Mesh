import { useMemo, useState } from 'react'
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

const initialUsers = [
  {
    id: 1,
    name: 'Vishal',
    email: 'vishal@hostel.com',
    role: 'Admin',
    status: 'Active',
    zone: 'All Zones',
    lastActive: 'Just now',
  },
  {
    id: 2,
    name: 'Warden W102',
    email: 'warden102@hostel.com',
    role: 'Warden',
    status: 'Active',
    zone: 'Floor 1',
    lastActive: '2 min ago',
  },
  {
    id: 3,
    name: 'Security S201',
    email: 'security201@hostel.com',
    role: 'Security',
    status: 'Active',
    zone: 'Floor 2',
    lastActive: '5 min ago',
  },
  {
    id: 4,
    name: 'Rahul Patil',
    email: 'rahul@hostel.com',
    role: 'Resident',
    status: 'Active',
    zone: 'Floor 1',
    lastActive: '12 min ago',
  },
  {
    id: 5,
    name: 'Sneha Kulkarni',
    email: 'sneha@hostel.com',
    role: 'Resident',
    status: 'Active',
    zone: 'Floor 3',
    lastActive: '18 min ago',
  },
  {
    id: 6,
    name: 'Amit Sharma',
    email: 'amit@hostel.com',
    role: 'Resident',
    status: 'Inactive',
    zone: 'Floor 2',
    lastActive: '2 days ago',
  },
]

function StatusBadge({ status }) {
  const active = status === 'Active'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        active
          ? 'bg-green-100 text-green-700'
          : 'bg-neutral-100 text-neutral-600'
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? 'bg-green-600' : 'bg-neutral-400'
        }`}
      />

      {status}
    </span>
  )
}

function RoleBadge({ role }) {
  const classes = {
    Admin: 'bg-purple-100 text-purple-700',
    Warden: 'bg-blue-100 text-blue-700',
    Security: 'bg-orange-100 text-orange-700',
    Resident: 'bg-neutral-100 text-neutral-700',
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
        classes[role] || 'bg-neutral-100 text-neutral-700'
      }`}
    >
      {role}
    </span>
  )
}

export default function Users() {
  const [users, setUsers] = useState(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All')
  const [statusFilter, setStatusFilter] = useState('All')
  const [showAddUser, setShowAddUser] = useState(false)

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Resident',
    zone: 'Floor 1',
  })

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchText = search.toLowerCase().trim()

      const matchesSearch =
        !searchText ||
        user.name.toLowerCase().includes(searchText) ||
        user.email.toLowerCase().includes(searchText)

      const matchesRole =
        roleFilter === 'All' || user.role === roleFilter

      const matchesStatus =
        statusFilter === 'All' || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, search, roleFilter, statusFilter])

  const activeUsers = users.filter(
    (user) => user.status === 'Active'
  ).length

  const adminCount = users.filter(
    (user) => user.role === 'Admin'
  ).length

  const residentCount = users.filter(
    (user) => user.role === 'Resident'
  ).length

  function handleAddUser(event) {
    event.preventDefault()

    if (!newUser.name.trim() || !newUser.email.trim()) {
      return
    }

    const user = {
      id: Date.now(),
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      role: newUser.role,
      status: 'Active',
      zone:
        newUser.role === 'Admin'
          ? 'All Zones'
          : newUser.zone,
      lastActive: 'Just now',
    }

    setUsers((currentUsers) => [
      ...currentUsers,
      user,
    ])

    setNewUser({
      name: '',
      email: '',
      role: 'Resident',
      zone: 'Floor 1',
    })

    setShowAddUser(false)
  }

  function toggleUserStatus(id) {
    setUsers((currentUsers) =>
      currentUsers.map((user) =>
        user.id === id
          ? {
              ...user,
              status:
                user.status === 'Active'
                  ? 'Inactive'
                  : 'Active',
            }
          : user
      )
    )
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-neutral-900">
              Users
            </h1>

            <p className="mt-1 text-sm text-neutral-600">
              Manage users, roles and access to the Hostel Safety Mesh.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddUser(true)}
            className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
          >
            + Add User
          </button>
        </div>

        {/* User Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

          <Card>
            <p className="text-sm font-medium text-neutral-600">
              Total Users
            </p>

            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {users.length}
            </p>

            <p className="mt-2 text-xs text-neutral-500">
              Registered system users
            </p>
          </Card>

          <Card>
            <p className="text-sm font-medium text-neutral-600">
              Active Users
            </p>

            <p className="mt-2 text-3xl font-bold text-green-700">
              {activeUsers}
            </p>

            <p className="mt-2 text-xs text-neutral-500">
              Currently active accounts
            </p>
          </Card>

          <Card>
            <p className="text-sm font-medium text-neutral-600">
              Administrators
            </p>

            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {adminCount}
            </p>

            <p className="mt-2 text-xs text-neutral-500">
              Users with admin access
            </p>
          </Card>

          <Card>
            <p className="text-sm font-medium text-neutral-600">
              Residents
            </p>

            <p className="mt-2 text-3xl font-bold text-neutral-900">
              {residentCount}
            </p>

            <p className="mt-2 text-xs text-neutral-500">
              Registered residents
            </p>
          </Card>

        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">

            <div className="flex-1">
              <label
                htmlFor="user-search"
                className="mb-1.5 block text-xs font-semibold uppercase text-neutral-600"
              >
                Search
              </label>

              <input
                id="user-search"
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by name or email..."
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-300"
              />
            </div>

            <div className="w-full lg:w-48">
              <label
                htmlFor="role-filter"
                className="mb-1.5 block text-xs font-semibold uppercase text-neutral-600"
              >
                Role
              </label>

              <select
                id="role-filter"
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value)
                }
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Warden">Warden</option>
                <option value="Security">Security</option>
                <option value="Resident">Resident</option>
              </select>
            </div>

            <div className="w-full lg:w-48">
              <label
                htmlFor="status-filter"
                className="mb-1.5 block text-xs font-semibold uppercase text-neutral-600"
              >
                Status
              </label>

              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

          </div>
        </Card>

        {/* Users Table */}
        <Card className="w-full">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">
                User Directory
              </h2>

              <p className="mt-1 text-sm text-neutral-600">
                {filteredUsers.length} user
                {filteredUsers.length !== 1 ? 's' : ''} shown
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-semibold uppercase text-neutral-600">
                  <th className="px-3 py-3">
                    User
                  </th>

                  <th className="px-3 py-3">
                    Role
                  </th>

                  <th className="px-3 py-3">
                    Zone
                  </th>

                  <th className="px-3 py-3">
                    Status
                  </th>

                  <th className="px-3 py-3">
                    Last Active
                  </th>

                  <th className="px-3 py-3 text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-neutral-200">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-neutral-50"
                  >
                    <td className="px-3 py-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {user.name}
                        </p>

                        <p className="mt-0.5 text-xs text-neutral-500">
                          {user.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-3 py-3">
                      <RoleBadge role={user.role} />
                    </td>

                    <td className="px-3 py-3 text-sm text-neutral-600">
                      {user.zone}
                    </td>

                    <td className="px-3 py-3">
                      <StatusBadge status={user.status} />
                    </td>

                    <td className="px-3 py-3 text-sm text-neutral-600">
                      {user.lastActive}
                    </td>

                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          toggleUserStatus(user.id)
                        }
                        className="rounded-md border border-neutral-300 px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
                      >
                        {user.status === 'Active'
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-3 py-10 text-center"
                    >
                      <p className="text-sm font-medium text-neutral-900">
                        No users found
                      </p>

                      <p className="mt-1 text-xs text-neutral-500">
                        Try changing your search or filters.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Access Information */}
        <Card>
          <div className="mb-4">
            <h2 className="text-base font-semibold text-neutral-900">
              Access Roles
            </h2>

            <p className="mt-1 text-sm text-neutral-600">
              Roles determine which parts of the safety system users can
              access.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

            <div className="rounded-lg border border-neutral-200 p-4">
              <RoleBadge role="Admin" />

              <p className="mt-3 text-sm font-medium text-neutral-900">
                System administration
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                Manage users, zones, devices and system configuration.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 p-4">
              <RoleBadge role="Warden" />

              <p className="mt-3 text-sm font-medium text-neutral-900">
                Hostel supervision
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                Monitor safety events and respond to incidents.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 p-4">
              <RoleBadge role="Security" />

              <p className="mt-3 text-sm font-medium text-neutral-900">
                Emergency response
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                Receive and handle emergency safety alerts.
              </p>
            </div>

            <div className="rounded-lg border border-neutral-200 p-4">
              <RoleBadge role="Resident" />

              <p className="mt-3 text-sm font-medium text-neutral-900">
                Resident access
              </p>

              <p className="mt-1 text-xs text-neutral-600">
                Use supported safety and SOS features.
              </p>
            </div>

          </div>
        </Card>

      </div>

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">

            <div className="mb-5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">
                  Add User
                </h2>

                <p className="mt-1 text-sm text-neutral-600">
                  Create a new user for the demo system.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddUser(false)}
                className="text-xl text-neutral-500 hover:text-neutral-900"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleAddUser}
              className="space-y-4"
            >

              <div>
                <label
                  htmlFor="new-user-name"
                  className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                  Name
                </label>

                <input
                  id="new-user-name"
                  type="text"
                  value={newUser.name}
                  onChange={(event) =>
                    setNewUser({
                      ...newUser,
                      name: event.target.value,
                    })
                  }
                  placeholder="Enter user name"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label
                  htmlFor="new-user-email"
                  className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                  Email
                </label>

                <input
                  id="new-user-email"
                  type="email"
                  value={newUser.email}
                  onChange={(event) =>
                    setNewUser({
                      ...newUser,
                      email: event.target.value,
                    })
                  }
                  placeholder="user@example.com"
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                />
              </div>

              <div>
                <label
                  htmlFor="new-user-role"
                  className="mb-1.5 block text-sm font-medium text-neutral-700"
                >
                  Role
                </label>

                <select
                  id="new-user-role"
                  value={newUser.role}
                  onChange={(event) =>
                    setNewUser({
                      ...newUser,
                      role: event.target.value,
                    })
                  }
                  className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                >
                  <option value="Resident">
                    Resident
                  </option>

                  <option value="Warden">
                    Warden
                  </option>

                  <option value="Security">
                    Security
                  </option>

                  <option value="Admin">
                    Admin
                  </option>
                </select>
              </div>

              {newUser.role !== 'Admin' && (
                <div>
                  <label
                    htmlFor="new-user-zone"
                    className="mb-1.5 block text-sm font-medium text-neutral-700"
                  >
                    Zone
                  </label>

                  <select
                    id="new-user-zone"
                    value={newUser.zone}
                    onChange={(event) =>
                      setNewUser({
                        ...newUser,
                        zone: event.target.value,
                      })
                    }
                    className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
                  >
                    <option value="Floor 1">
                      Floor 1
                    </option>

                    <option value="Floor 2">
                      Floor 2
                    </option>

                    <option value="Floor 3">
                      Floor 3
                    </option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">

                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-semibold text-white hover:bg-neutral-800"
                >
                  Create User
                </button>

              </div>

            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}