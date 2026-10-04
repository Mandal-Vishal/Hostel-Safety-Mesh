import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import StatCard from "../../components/dashboard/StatCard";
import Spinner from "../../components/ui/Spinner";
import ErrorState from "../../components/ui/ErrorState";
import { getAnalytics } from "../../services/analyticsService";

const sidebarLinks = [
  { to: "/warden/dashboard", label: "Dashboard" },
  { to: "/warden/sos", label: "Active SOS" },
  { to: "/warden/check-ins", label: "Check-Ins" },
  { to: "/warden/incidents", label: "Incidents" },
  { to: "/warden/devices", label: "Devices" },
  { to: "/warden/analytics", label: "Analytics" },
  { to: "/warden/audit-logs", label: "Audit Logs" },
];

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    getAnalytics()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-neutral-900">
            Safety Analytics
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Overview of hostel incidents, SOS activity and response metrics.
          </p>
        </div>

        {loading && (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        )}

        {!loading && error && <ErrorState />}

        {!loading && !error && data && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              <StatCard label="Total Incidents" value={data.totalIncidents} />

              <StatCard
                label="SOS Events"
                value={data.sosEvents}
                accent="danger"
              />

              <StatCard label="Avg Response" value={data.avgResponse} />

              <StatCard label="Resolved" value={data.resolved} />
            </div>

            {/* Incidents by day */}
            <Card className="w-full overflow-hidden">
              <div className="mb-4">
                <p className="font-semibold text-neutral-900">
                  Incidents by Day
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Incident activity over the selected period.
                </p>
              </div>

              <div className="w-full overflow-hidden">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart
                    data={data.incidentsByDay}
                    margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="day"
                      stroke="#475569"
                      fontSize={11}
                      tickMargin={8}
                    />
                    <YAxis
                      stroke="#475569"
                      fontSize={11}
                      allowDecimals={false}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Incidents by zone */}
            <Card className="w-full overflow-hidden">
              <div className="mb-4">
                <p className="font-semibold text-neutral-900">
                  Incidents by Zone
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Distribution of incidents across hostel zones.
                </p>
              </div>

              <div className="w-full overflow-x-auto">
                <div className="min-w-[420px]">
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart
                      data={data.incidentsByZone}
                      margin={{ top: 5, right: 5, left: -15, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        dataKey="zone"
                        stroke="#475569"
                        fontSize={11}
                        tickMargin={8}
                      />
                      <YAxis
                        stroke="#475569"
                        fontSize={11}
                        allowDecimals={false}
                      />
                      <Tooltip />
                      <Bar
                        dataKey="count"
                        fill="#16a34a"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>

            {/* Incident categories */}
            <Card className="w-full">
              <div className="mb-4">
                <p className="font-semibold text-neutral-900">
                  Incident Categories
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Breakdown of reported incident types.
                </p>
              </div>

              <div className="space-y-4">
                {data.categories.map((c) => (
                  <div key={c.name} className="flex items-center gap-3">
                    <span className="text-sm text-neutral-900 w-24 sm:w-32 shrink-0 truncate">
                      {c.name}
                    </span>

                    <div className="flex-1 bg-neutral-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-primary-600 h-full rounded-full transition-all"
                        style={{
                          width: `${(c.count / data.totalIncidents) * 100 * 3}%`,
                        }}
                      />
                    </div>

                    <span className="text-sm font-medium text-neutral-600 w-8 text-right shrink-0">
                      {c.count}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
