import { useEffect } from "react";

import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import MobileNav from "./MobileNav";
import ResidentTopNav from "./ResidentTopNav";

import { useAuth } from "../../hooks/useAuth";
import { USE_MOCK } from "../../services/config";
import { enablePushNotifications } from "../../services/pushNotificationService";

export default function DashboardLayout({
  children,
  sidebarLinks,
  mobileLinks,
}) {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || USE_MOCK) {
      return;
    }

    enablePushNotifications();
  }, [user]);

  const finalSidebarLinks =
    user?.role === "warden" && sidebarLinks
      ? sidebarLinks.some((link) => link.to === "/warden/residents")
        ? sidebarLinks
        : [
            ...sidebarLinks,
            {
              to: "/warden/residents",
              label: "Residents",
            },
          ]
      : sidebarLinks;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <Navbar />

      {mobileLinks && <ResidentTopNav />}

      <div className="flex flex-1">
        {finalSidebarLinks && <Sidebar links={finalSidebarLinks} />}

        <main className="flex-1 min-w-0 px-3 py-4 sm:px-5 sm:py-6 lg:px-7 lg:py-7 pb-20 md:pb-6">
          <div className="w-full">{children}</div>
        </main>
      </div>

      {mobileLinks && <MobileNav links={mobileLinks} />}
    </div>
  );
}
