import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";

import { getResidents, createResident } from "../../services/residentService";

const sidebarLinks = [
  { to: "/warden/dashboard", label: "Dashboard" },
  { to: "/warden/sos", label: "Active SOS" },
  { to: "/warden/check-ins", label: "Check-Ins" },
  { to: "/warden/incidents", label: "Incidents" },
  { to: "/warden/devices", label: "Devices" },
  { to: "/warden/analytics", label: "Analytics" },
  { to: "/warden/audit-logs", label: "Audit Logs" },
];

export default function Residents() {
  const [residents, setResidents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    building: "",
    floor: "",
    room: "",
    zone: "",
  });

  async function loadResidents() {
    setLoading(true);
    setError("");

    try {
      const data = await getResidents();
      setResidents(data);
    } catch (err) {
      console.error("Load residents failed:", err);
      setError(err.message || "Failed to load residents.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadResidents();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await createResident({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,

        hostel: {
          building: form.building,
          floor: Number(form.floor),
          room: form.room,
          zone: form.zone,
        },
      });

      setSuccess("Resident account created successfully.");

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        building: "",
        floor: "",
        room: "",
        zone: "",
      });

      await loadResidents();
    } catch (err) {
      console.error("Create resident failed:", err);
      setError(err.message || "Failed to create resident.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600";

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Resident Management
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Create and manage resident accounts.
          </p>
        </div>

        <Card>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-neutral-900">
              Add Resident
            </h2>

            <p className="text-sm text-neutral-500 mt-1">
              Resident accounts are created by hostel staff. Residents do not
              self-register.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-danger-50 border border-danger-200 p-3">
              <p className="text-sm text-danger-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 rounded-lg bg-success-50 border border-success-200 p-3">
              <p className="text-sm text-success-600">{success}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                First Name
              </label>

              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Last Name
              </label>

              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Email
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Temporary Password
              </label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                minLength={8}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Building
              </label>

              <input
                name="building"
                value={form.building}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="Block A"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Floor
              </label>

              <input
                type="number"
                name="floor"
                value={form.floor}
                onChange={handleChange}
                min="0"
                required
                className={inputClass}
                placeholder="2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Room
              </label>

              <input
                name="room"
                value={form.room}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="204"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Zone
              </label>

              <input
                name="zone"
                value={form.zone}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder="North Corridor"
              />
            </div>

            <div className="md:col-span-2">
              <Button
                type="submit"
                disabled={saving}
                className="w-full md:w-auto"
              >
                {saving ? "Creating Resident..." : "Create Resident"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900">
                Registered Residents
              </h2>

              <p className="text-sm text-neutral-500 mt-1">
                {residents.length} resident
                {residents.length !== 1 ? "s" : ""} currently registered.
              </p>
            </div>
          </div>

          {loading && (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          )}

          {!loading && residents.length === 0 && (
            <p className="text-sm text-neutral-500">
              No residents have been created yet.
            </p>
          )}

          {!loading && residents.length > 0 && (
            <div className="space-y-3">
              {residents.map((resident) => (
                <div
                  key={resident.id}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-neutral-900">
                        {resident.firstName} {resident.lastName}
                      </p>

                      <p className="text-sm text-neutral-600 mt-1">
                        {resident.email}
                      </p>
                    </div>

                    <Badge variant={resident.isActive ? "success" : "danger"}>
                      {resident.isActive ? "ACTIVE" : "INACTIVE"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-neutral-200">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Building
                      </p>
                      <p className="text-sm font-medium text-neutral-900 mt-1">
                        {resident.hostel?.building || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Floor
                      </p>
                      <p className="text-sm font-medium text-neutral-900 mt-1">
                        {resident.hostel?.floor ?? "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Room
                      </p>
                      <p className="text-sm font-medium text-neutral-900 mt-1">
                        {resident.hostel?.room || "—"}
                      </p>
                    </div>

                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-neutral-500">
                        Zone
                      </p>
                      <p className="text-sm font-medium text-neutral-900 mt-1">
                        {resident.hostel?.zone || "—"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
