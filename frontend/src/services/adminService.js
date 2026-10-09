import api from "./api";
import { USE_MOCK } from "./config";
import {
  mockAdminStats,
  mockUsers,
  mockZones,
} from "../mock/adminStats";

let mockUserStore = [...mockUsers];

export async function getAdminStats() {
  if (USE_MOCK) {
    await delay(300);
    return { ...mockAdminStats };
  }

  try {
    const response = await api.get("/admin/stats");
    return response.data.stats;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to load Admin statistics."
    );
  }
}

export async function getUsers() {
  if (USE_MOCK) {
    await delay(300);
    return [...mockUserStore];
  }

  try {
    const response = await api.get("/admin/users");
    return response.data.users;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to load users."
    );
  }
}

export async function createStaff(staffData) {
  if (USE_MOCK) {
    await delay(300);

    const email = staffData.email.trim().toLowerCase();

    if (
      mockUserStore.some(
        (user) => user.email?.toLowerCase() === email
      )
    ) {
      throw new Error("This email is already registered.");
    }

    const staff = {
      id: `mock-${Date.now()}`,
      firstName: staffData.firstName,
      lastName: staffData.lastName,
      name: `${staffData.firstName} ${staffData.lastName}`,
      email,
      role: staffData.role,
      zone: "—",
      isActive: true,
    };

    mockUserStore = [staff, ...mockUserStore];

    return staff;
  }

  try {
    const response = await api.post(
      "/admin/staff",
      staffData
    );

    return response.data.staff;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to create staff account."
    );
  }
}

export async function setStaffStatus(id, isActive) {
  if (USE_MOCK) {
    await delay(200);

    mockUserStore = mockUserStore.map((user) =>
      user.id === id || user._id === id
        ? { ...user, isActive }
        : user
    );

    return mockUserStore.find(
      (user) => user.id === id || user._id === id
    );
  }

  try {
    const response = await api.patch(
      `/admin/users/${id}/status`,
      { isActive }
    );

    return response.data.staff;
  } catch (error) {
    throw new Error(
      error.response?.data?.message ||
        "Failed to update staff status."
    );
  }
}

export async function getZones() {
  if (USE_MOCK) {
    await delay(300);
    return [...mockZones];
  }

  const response = await api.get("/admin/zones");
  return response.data;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}