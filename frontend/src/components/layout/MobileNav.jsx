import { NavLink } from 'react-router-dom'

export default function MobileNav({ links }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex justify-around py-2 z-40">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            `flex flex-col items-center text-xs px-2 py-1 rounded-lg ${
              isActive ? 'text-primary-700 font-semibold' : 'text-neutral-600'
            }`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  )
}