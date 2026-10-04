const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");

const { sanitizeUser } = require("../utils/privacy");

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    },
  );
};

const buildSafeUser = (user) => {
  return sanitizeUser(user, {
    includeEmail: true,
    includeLocation: true,
  });
};

/**
 * ---------------------------------------------------------
 * PUBLIC REGISTRATION
 * ---------------------------------------------------------
 *
 * SECURITY RULE:
 *
 * Public registration can ONLY create residents.
 *
 * The client-supplied role is intentionally ignored.
 *
 * Warden/security accounts must be provisioned separately.
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, hostel, currentZone } =
      req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Required fields are missing",
      });
    }

    if (typeof password !== "string" || password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message: "Valid email is required",
      });
    }

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    /**
     * IMPORTANT:
     *
     * role is always resident here.
     *
     * Even if the request contains:
     *
     * {
     *   "role": "warden"
     * }
     *
     * it is ignored.
     */
    const user = await User.create({
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: normalizedEmail,
      passwordHash,
      role: "resident",
      hostel: hostel || null,
      currentZone: currentZone || null,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: buildSafeUser(user),
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

/**
 * ---------------------------------------------------------
 * LOGIN
 * ---------------------------------------------------------
 *
 * The role comes from MongoDB.
 *
 * We never trust a role supplied by the client.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: buildSafeUser(user),
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  register,
  login,
};
