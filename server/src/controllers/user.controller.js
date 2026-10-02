const User = require("../models/user.model");

const { sanitizeUserByRole } = require("../utils/privacy");

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const safeUser = sanitizeUserByRole(user, req.user.role);

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

module.exports = {
  getMe,
};