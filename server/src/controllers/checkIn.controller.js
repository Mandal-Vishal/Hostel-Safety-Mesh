const CheckIn = require("../models/checkIn.model");
const User = require("../models/user.model");

const formatDateIST = require("../utils/formatDate");
const { getCurrentNightPeriod } = require("../utils/checkinPeriod");

const { sanitizeCheckIn, sanitizeCheckIns } = require("../utils/privacy");

/**
 * Format a privacy-filtered check-in.
 */
const formatSafeCheckIn = (checkIn, role) => {
  const data = sanitizeCheckIn(checkIn, role);

  if (!data) {
    return null;
  }

  return {
    ...data,

    scheduledAt: formatDateIST(data.scheduledAt),

    checkedInAt: formatDateIST(data.checkedInAt),
  };
};

/**
 * Format multiple privacy-filtered check-ins.
 */
const formatSafeCheckIns = (checkIns, role) => {
  return sanitizeCheckIns(checkIns, role).map((data) => ({
    ...data,

    scheduledAt: formatDateIST(data.scheduledAt),

    checkedInAt: formatDateIST(data.checkedInAt),
  }));
};

// Resident check-in
const checkIn = async (req, res) => {
  try {
    const period = getCurrentNightPeriod();

    if (!period.inPeriod) {
      return res.status(400).json({
        success: false,
        message: `Check-in is allowed between ${period.start} and ${period.end}`,
      });
    }

    const existing = await CheckIn.findOne({
      residentId: req.user._id,
      periodKey: period.periodKey,
    });

    if (existing?.status === "CHECKED_IN") {
      return res.status(409).json({
        success: false,
        message: "You have already checked in",
      });
    }

    // Always use configured check-in start time.
    const scheduledAt = new Date(
      `${period.periodKey}T${period.start}:00+05:30`,
    );

    const checkedInAt = new Date();

    /**
     * Location comes from authenticated server-side state.
     * We do not accept an arbitrary location from req.body.
     */
    const trustedLocation = req.user.currentZone || req.user.hostel || null;

    const data = {
      residentId: req.user._id,

      periodKey: period.periodKey,

      scheduledAt,

      checkedInAt,

      status: "CHECKED_IN",

      source: {
        type: "RESIDENT_APP",
        nodeId: null,
      },

      zone: trustedLocation || {},
    };

    const record = existing
      ? await CheckIn.findByIdAndUpdate(existing._id, data, {
          new: true,
          runValidators: true,
        })
      : await CheckIn.create(data);

    /**
     * Resident receives only their own
     * privacy-safe check-in representation.
     */
    return res.status(200).json({
      success: true,
      message: "Check-in successful",
      checkIn: formatSafeCheckIn(record, "resident"),
    });
  } catch (error) {
    console.error("Check-in error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to check in",
    });
  }
};

// Resident's own check-ins
const getMyCheckIns = async (req, res) => {
  try {
    const checkIns = await CheckIn.find({
      residentId: req.user._id,
    })
      .sort({
        createdAt: -1,
      })
      .limit(50);

    return res.json({
      success: true,
      checkIns: formatSafeCheckIns(checkIns, "resident"),
    });
  } catch (error) {
    console.error("Get my check-ins error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch check-ins",
    });
  }
};

// Generate EXPECTED check-ins for all residents
const generateExpectedCheckIns = async (req, res) => {
  try {
    const period = getCurrentNightPeriod();

    const residents = await User.find({
      role: "resident",
      isActive: true,
    }).select("_id");

    const scheduledAt = new Date(
      `${period.periodKey}T${period.start}:00+05:30`,
    );

    const operations = residents.map((resident) => ({
      updateOne: {
        filter: {
          residentId: resident._id,
          periodKey: period.periodKey,
        },

        update: {
          $setOnInsert: {
            residentId: resident._id,

            periodKey: period.periodKey,

            scheduledAt,

            checkedInAt: null,

            status: "EXPECTED",

            source: {
              type: "RESIDENT_APP",
              nodeId: null,
            },
          },
        },

        upsert: true,
      },
    }));

    if (operations.length) {
      await CheckIn.bulkWrite(operations);
    }

    return res.json({
      success: true,
      message: "Expected check-ins generated",
      count: residents.length,
      periodKey: period.periodKey,
      scheduledAt: formatDateIST(scheduledAt),
    });
  } catch (error) {
    console.error("Generate check-ins error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate expected check-ins",
    });
  }
};

// Mark uncompleted check-ins as MISSED after 10 PM
const evaluateMissedCheckIns = async (req, res) => {
  try {
    const period = getCurrentNightPeriod();

    const endTime = new Date(`${period.periodKey}T${period.end}:00+05:30`);

    const now = new Date();

    if (now < endTime) {
      return res.status(400).json({
        success: false,
        message: `Check-in period has not ended yet. It ends at ${formatDateIST(
          endTime,
        )}`,
      });
    }

    const result = await CheckIn.updateMany(
      {
        periodKey: period.periodKey,
        status: "EXPECTED",
      },
      {
        $set: {
          status: "MISSED",
        },
      },
    );

    return res.json({
      success: true,
      message: "Missed check-ins evaluated",
      missedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Missed check-in error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to evaluate missed check-ins",
    });
  }
};

// Warden / security view
const getAllCheckIns = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const checkIns = await CheckIn.find(filter)
      .populate("residentId", "firstName lastName email role")
      .sort({
        createdAt: -1,
      })
      .limit(100);

    return res.json({
      success: true,
      checkIns: formatSafeCheckIns(checkIns, req.user.role),
    });
  } catch (error) {
    console.error("Get all check-ins error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch check-ins",
    });
  }
};

module.exports = {
  checkIn,
  getMyCheckIns,
  generateExpectedCheckIns,
  evaluateMissedCheckIns,
  getAllCheckIns,
};