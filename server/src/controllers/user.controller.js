const User = require("../models/user.model");

const { sanitizeUser, sanitizeUserByRole } = require("../utils/privacy");

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-passwordHash");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    /**
     * A user is allowed to see their own operational location.
     *
     * Residents do not receive other users' locations through
     * the generic resident projection, but their own profile
     * needs hostel/currentZone for the dashboard and check-in UI.
     */
    const safeUser =
      req.user.role === "resident"
        ? sanitizeUser(user, {
            includeLocation: true,
          })
        : sanitizeUserByRole(user, req.user.role);

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
