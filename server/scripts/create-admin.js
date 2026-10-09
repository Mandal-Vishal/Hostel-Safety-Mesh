require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const User = require("../src/models/user.model");

async function createFirstAdmin() {
  const {
    MONGODB_URI,
    ADMIN_FIRST_NAME,
    ADMIN_LAST_NAME,
    ADMIN_EMAIL,
    ADMIN_PASSWORD,
  } = process.env;

  if (
    !MONGODB_URI ||
    !ADMIN_FIRST_NAME?.trim() ||
    !ADMIN_LAST_NAME?.trim() ||
    !ADMIN_EMAIL?.trim() ||
    !ADMIN_PASSWORD
  ) {
    throw new Error(
      "Set MONGODB_URI, ADMIN_FIRST_NAME, ADMIN_LAST_NAME, ADMIN_EMAIL and ADMIN_PASSWORD before running this script.",
    );
  }

  if (ADMIN_PASSWORD.length < 8) {
    throw new Error(
      "The first Admin password must contain at least 12 characters.",
    );
  }

  await mongoose.connect(MONGODB_URI);

  const existingAdmin = await User.exists({
    role: "admin",
  });

  if (existingAdmin) {
    throw new Error(
      "An Admin account already exists. First-admin setup has been blocked.",
    );
  }

  const email = ADMIN_EMAIL.trim().toLowerCase();

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error(
      "That email is already registered to another account. Choose a different email.",
    );
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await User.create({
    firstName: ADMIN_FIRST_NAME.trim(),
    lastName: ADMIN_LAST_NAME.trim(),
    email,
    passwordHash,
    role: "admin",
    isActive: true,
  });

  console.log("First Admin account created successfully.");
  console.log(`Email: ${admin.email}`);
  console.log("Role: admin");
  console.log("You can now log in through the normal login page.");
}

createFirstAdmin()
  .catch((error) => {
    console.error("Admin setup failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
