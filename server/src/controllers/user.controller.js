const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

const {
  sanitizeUser,
  sanitizeUserByRole,
} = require("../utils/privacy");

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-passwordHash"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const safeUser =
      req.user.role === "resident"
        ? sanitizeUser(user, {
            includeLocation: true,
          })
        : sanitizeUserByRole(
            user,
            req.user.role
          );

    return res.status(200).json({
      success: true,
      user: safeUser,
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

/*
 * Warden creates a resident account.
 */
const createResident = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      hostel,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "First name, last name, email and password are required",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Temporary password must be at least 8 characters",
      });
    }

    if (!hostel?.building) {
      return res.status(400).json({
        success: false,
        message: "Building is required",
      });
    }

    if (
      hostel.floor === undefined ||
      hostel.floor === null ||
      hostel.floor === ""
    ) {
      return res.status(400).json({
        success: false,
        message: "Floor is required",
      });
    }

    if (!hostel?.room) {
      return res.status(400).json({
        success: false,
        message: "Room is required",
      });
    }

    if (!hostel?.zone) {
      return res.status(400).json({
        success: false,
        message: "Zone is required",
      });
    }

    const normalizedEmail = String(email)
      .trim()
      .toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const floor = Number(hostel.floor);

    if (!Number.isFinite(floor) || floor < 0) {
      return res.status(400).json({
        success: false,
        message: "Floor must be a valid number",
      });
    }

    const passwordHash = await bcrypt.hash(
      password,
      12
    );

    const residentLocation = {
      building: String(hostel.building).trim(),
      floor,
      room: String(hostel.room).trim(),
      zone: String(hostel.zone).trim(),
    };

    const resident = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,

      passwordHash,

      /*
       * IMPORTANT:
       * Role is always resident.
       * It cannot be chosen by the frontend.
       */
      role: "resident",

      hostel: residentLocation,

      currentZone: {
        building: residentLocation.building,
        floor: residentLocation.floor,
        zone: residentLocation.zone,
        updatedAt: new Date(),
      },

      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "Resident account created successfully",
      resident: sanitizeUser(resident, {
        includeEmail: true,
        includeLocation: true,
      }),
    });
  } catch (error) {
    console.error(
      "Create resident error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create resident account",
    });
  }
};

/*
 * Warden views resident accounts.
 */
const getResidents = async (req, res) => {
  try {
    const residents = await User.find({
      role: "resident",
    })
      .select(
        "firstName lastName email hostel currentZone isActive createdAt"
      )
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      residents: residents.map((resident) =>
        sanitizeUser(resident, {
          includeEmail: true,
          includeLocation: true,
        })
      ),
    });
  } catch (error) {
    console.error(
      "Get residents error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch residents",
    });
  }
};

module.exports = {
  getMe,
  createResident,
  getResidents,
};