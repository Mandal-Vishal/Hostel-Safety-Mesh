import { useState } from 'react'
import { NavLink } from 'react-router-dom'

export default function Sidebar({ links }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const renderLinks = (mobile = false) =>
    links.map((link) => (
      <NavLink
        key={link.to}
        to={link.to}
        onClick={() => mobile && setMobileOpen(false)}
        className={({ isActive }) =>
          `flex items-center w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? 'bg-primary-50 text-primary-700'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`
        }
      >
        {link.label}
      </NavLink>
    ))

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-56 shrink-0 bg-white border-r border-neutral-200 min-h-[calc(100vh-57px)]">
        <nav className="p-4 space-y-1">
          {renderLinks()}
        </nav>
      </aside>

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-[68px] left-4 z-30 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-neutral-200 shadow-sm text-neutral-700 hover:bg-neutral-50"
        aria-label="Open navigation menu"
      >
        <span className="text-xl leading-none">☰</span>
      </button>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Overlay */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/30"
            aria-label="Close navigation menu"
          />

          {/* Drawer */}
          <aside className="relative w-72 max-w-[85vw] h-full bg-white shadow-xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-neutral-200">
              <div>
                <p className="font-semibold text-neutral-900">
                  Hostel Safety Mesh
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Navigation
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-9 h-9 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 text-lg"
                aria-label="Close navigation menu"
              >
                ×
              </button>
            </div>

            <nav className="p-4 space-y-1">
              {renderLinks(true)}
            </nav>
          </aside>
        </div>
      )}
    </>
  )
}