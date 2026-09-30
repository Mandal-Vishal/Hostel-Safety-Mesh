import Navbar from './Navbar'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function DashboardLayout({ children, sidebarLinks, mobileLinks }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1">
        {sidebarLinks && <Sidebar links={sidebarLinks} />}
        <main className="flex-1 p-4 pb-20 md:pb-4">{children}</main>
      </div>
      {mobileLinks && <MobileNav links={mobileLinks} />}
    </div>
  )
}