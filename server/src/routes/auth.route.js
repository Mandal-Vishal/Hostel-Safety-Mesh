const express = require("express");

const { login } = require("../controllers/auth.controller");

const router = express.Router();

/*
 * Resident self-registration is intentionally disabled.
 *
 * Resident accounts must be created by authorized hostel staff.
 */
router.post("/register", (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Resident self-registration is disabled. Please contact hostel staff.",
  });
});

router.post("/login", login);

module.exports = router;