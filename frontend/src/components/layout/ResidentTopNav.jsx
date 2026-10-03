import { NavLink } from 'react-router-dom'

const links = [
  { to: '/resident/dashboard', label: 'Home', icon: '🏠' },
  { to: '/resident/check-in', label: 'Check-In', icon: '✓' },
  { to: '/resident/sos', label: 'SOS', icon: '🔴' },
  { to: '/resident/incidents', label: 'Incidents', icon: '📋' },
  { to: '/resident/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/resident/privacy', label: 'Privacy', icon: '🔒' },
]

export default function ResidentTopNav() {
  return (
    <nav className="bg-white border-b border-neutral-200 px-4">
      <div className="flex gap-1 overflow-x-auto max-w-3xl mx-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-1.5 text-sm font-medium whitespace-nowrap px-3 py-3 border-b-2 transition-colors ${
                isActive
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-200'
              }`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}