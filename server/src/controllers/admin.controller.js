const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/user.model");
const Node = require("../models/node.model");
const Incident = require("../models/incident.model");

const { createAuditLog } = require("../services/audit.service");

const STAFF_ROLES = ["warden", "security"];

const formatUser = (user) => {
  const data =
    typeof user.toObject === "function"
      ? user.toObject()
      : user;

  return {
    id: String(data._id || data.id),
    firstName: data.firstName,
    lastName: data.lastName,
    name: [data.firstName, data.lastName]
      .filter(Boolean)
      .join(" "),
    email: data.email,
    role: data.role,
    zone:
      data.hostel?.zone ||
      data.currentZone?.zone ||
      "—",
    isActive: data.isActive,
    createdAt: data.createdAt,
  };
};

// GET /api/admin/stats
const getAdminStats = async (req, res) => {
  try {
    const now = new Date();

    const monthStart = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        1
      )
    );

    const [
      totalUsers,
      residents,
      wardens,
      securityStaff,
      activeDevices,
      onlineDevices,
      incidentsThisMonth,
      sosEvents,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "resident" }),
      User.countDocuments({ role: "warden" }),
      User.countDocuments({ role: "security" }),

      Node.countDocuments({ isActive: true }),

      Node.countDocuments({
        isActive: true,
        status: "ONLINE",
      }),

      Incident.countDocuments({
        createdAt: { $gte: monthStart },
      }),

      Incident.countDocuments({
        type: "SOS",
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        residents,
        wardens,
        securityStaff,
        activeDevices,
        onlineDevices,
        incidentsThisMonth,
        sosEvents,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load admin statistics",
    });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select(
        "firstName lastName email role hostel currentZone isActive createdAt"
      )
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      users: users.map(formatUser),
    });
  } catch (error) {
    console.error("Admin user list error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load users",
    });
  }
};

// POST /api/admin/staff
// Admin can create Wardens and Security staff only.
const createStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, password, role } =
      req.body;

    if (
      !firstName?.trim() ||
      !lastName?.trim() ||
      !email?.trim() ||
      !password ||
      !role
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (!STAFF_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Only Warden or Security accounts can be created here",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Staff passwords must contain at least 8 characters",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
    ) {
      return res.status(400).json({
        success: false,
        message: "Enter a valid email address",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email address is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 8);

    const staff = await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      role,
      isActive: true,
    });

    // Do not leave a new staff account behind if its
    // required audit record cannot be written.
    try {
      await createAuditLog({
        action: "STAFF_ACCOUNT_CREATED",
        actor: {
          type: "USER",
          userId: req.user._id,
          role: req.user.role,
        },
        entity: {
          type: "USER",
          entityId: staff._id,
        },
        newState: "ACTIVE",
        metadata: {
          email: staff.email,
          role: staff.role,
        },
      });
    } catch (auditError) {
      await User.deleteOne({ _id: staff._id });

      throw new Error(
        "Staff account was not created because the audit log could not be written."
      );
    }

    return res.status(201).json({
      success: true,
      message: "Staff account created successfully",
      staff: formatUser(staff),
    });
  } catch (error) {
    console.error("Create staff error:", error);

    const duplicate = error.code === 11000;

    return res.status(duplicate ? 409 : 500).json({
      success: false,
      message: duplicate
        ? "This email address is already registered"
        : error.message ||
          "Failed to create staff account",
    });
  }
};

// PATCH /api/admin/users/:id/status
// Admin can change the status of Wardens and Security staff.
// Admin and resident accounts cannot be changed through this endpoint.
const setStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be true or false",
      });
    }

    const staff = await User.findOne({
      _id: id,
      role: { $in: STAFF_ROLES },
    });

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: "Warden or Security account not found",
      });
    }

    const previousActive = staff.isActive;

    if (previousActive === isActive) {
      return res.status(200).json({
        success: true,
        message: "No status change was necessary",
        staff: formatUser(staff),
      });
    }

    staff.isActive = isActive;
    await staff.save();

    try {
      await createAuditLog({
        action: isActive
          ? "STAFF_ACCOUNT_ACTIVATED"
          : "STAFF_ACCOUNT_DEACTIVATED",
        actor: {
          type: "USER",
          userId: req.user._id,
          role: req.user.role,
        },
        entity: {
          type: "USER",
          entityId: staff._id,
        },
        previousState: previousActive
          ? "ACTIVE"
          : "INACTIVE",
        newState: isActive ? "ACTIVE" : "INACTIVE",
        metadata: {
          email: staff.email,
          role: staff.role,
        },
      });
    } catch (auditError) {
      // Roll the status change back if audit logging fails.
      staff.isActive = previousActive;
      await staff.save();

      console.error(
        "Staff status audit error:",
        auditError
      );

      return res.status(500).json({
        success: false,
        message:
          "Status change was rolled back because audit logging failed",
      });
    }

    return res.status(200).json({
      success: true,
      message: isActive
        ? "Staff account activated"
        : "Staff account deactivated",
      staff: formatUser(staff),
    });
  } catch (error) {
    console.error("Update staff status error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update staff status",
    });
  }
};

module.exports = {
  getAdminStats,
  getUsers,
  createStaff,
  setStaffStatus,
};