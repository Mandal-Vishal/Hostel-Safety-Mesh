import { useEffect, useState } from "react";

import DashboardLayout from "../../components/layout/DashboardLayout";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";

import {
  getUsers,
  createStaff,
  setStaffStatus,
} from "../../services/adminService";

const sidebarLinks = [
  { to: "/admin/dashboard", label: "Dashboard" },
  { to: "/admin/users", label: "Users & Staff" },
];

const initialForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  role: "warden",
};

const roleVariant = {
  resident: "neutral",
  warden: "warning",
  security: "success",
  admin: "danger",
};

const inputClass =
  "w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-primary-600";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const data = await getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
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
      await createStaff({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
      });

      setForm(initialForm);

      setSuccess("Staff account created successfully. They can now log in.");

      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to create staff account.");
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(user) {
    const id = user.id || user._id;

    setActionId(id);
    setError("");
    setSuccess("");

    try {
      await setStaffStatus(id, !user.isActive);

      setSuccess(
        user.isActive
          ? "Staff account deactivated."
          : "Staff account activated.",
      );

      await loadUsers();
    } catch (err) {
      setError(err.message || "Failed to update staff account.");
    } finally {
      setActionId("");
    }
  }

  const staffUsers = users.filter(
    (user) => user.role === "warden" || user.role === "security",
  );

  return (
    <DashboardLayout sidebarLinks={sidebarLinks}>
      <div className="w-full max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            User & Staff Management
          </h1>

          <p className="text-sm text-neutral-500 mt-1">
            Create Warden and Security accounts and manage existing staff
            access.
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-danger-50 border border-danger-200 p-3">
            <p className="text-sm text-danger-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-success-50 border border-success-200 p-3">
            <p className="text-sm text-success-600">{success}</p>
          </div>
        )}

        <Card>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-neutral-900">
              Create Staff Account
            </h2>

            <p className="text-sm text-neutral-500 mt-1">
              Create a login for a Warden or Security staff member. Passwords
              must be at least 12 characters.
            </p>
          </div>

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
                className={inputClass}
                required
                maxLength={50}
                autoComplete="given-name"
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
                className={inputClass}
                required
                maxLength={50}
                autoComplete="family-name"
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
                className={inputClass}
                required
                maxLength={100}
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Initial Password
              </label>

              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className={inputClass}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Staff Role
              </label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className={inputClass}
                required
              >
                <option value="warden">Warden</option>
                <option value="security">Security</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Creating Account..." : "Create Staff Account"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-neutral-900">
              Staff Accounts
            </h2>

            <p className="text-sm text-neutral-500 mt-1">
              {staffUsers.length} staff account
              {staffUsers.length !== 1 ? "s" : ""}. Deactivated accounts cannot
              log in.
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : staffUsers.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No Warden or Security accounts found.
            </p>
          ) : (
            <div className="space-y-3">
              {staffUsers.map((user) => {
                const id = user.id || user._id;
                const active = user.isActive !== false;

                return (
                  <div
                    key={id}
                    className="rounded-xl border border-neutral-200 p-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-neutral-900">
                          {user.name ||
                            `${user.firstName || ""} ${user.lastName || ""}`.trim()}
                        </p>

                        <p className="text-sm text-neutral-600 mt-1 break-words">
                          {user.email}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant={roleVariant[user.role] || "neutral"}>
                            {user.role}
                          </Badge>

                          <Badge variant={active ? "success" : "danger"}>
                            {active ? "ACTIVE" : "INACTIVE"}
                          </Badge>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <button
                          type="button"
                          disabled={actionId === id}
                          onClick={() => handleStatusChange(user)}
                          className={
                            active
                              ? "rounded-lg border border-danger-200 px-3 py-2 text-sm font-medium text-danger-600 hover:bg-danger-50 disabled:opacity-50"
                              : "rounded-lg border border-success-200 px-3 py-2 text-sm font-medium text-success-600 hover:bg-success-50 disabled:opacity-50"
                          }
                        >
                          {actionId === id
                            ? "Updating..."
                            : active
                              ? "Deactivate"
                              : "Activate"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
