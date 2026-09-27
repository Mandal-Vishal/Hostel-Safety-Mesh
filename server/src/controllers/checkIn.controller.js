const CheckIn = require("../models/checkIn.model");
const User = require("../models/user.model");
const formatDateIST = require("../utils/formatDate");
const { getCurrentNightPeriod } = require("../utils/checkinPeriod");

const formatCheckIn = (checkIn) => {
  const data = checkIn.toObject ? checkIn.toObject() : checkIn;

  return {
    ...data,
    scheduledAt: formatDateIST(data.scheduledAt),
    checkedInAt: formatDateIST(data.checkedInAt),
    createdAt: formatDateIST(data.createdAt),
    updatedAt: formatDateIST(data.updatedAt),
  };
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

    // Always use the configured check-in start time (7:00 PM)
    const scheduledAt = new Date(
      `${period.periodKey}T${period.start}:00+05:30`
    );

    const checkedInAt = new Date();

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

      zone: req.user.currentZone || req.user.hostel || {},
    };

    const record = existing
      ? await CheckIn.findByIdAndUpdate(existing._id, data, {
          new: true,
          runValidators: true,
        })
      : await CheckIn.create(data);

    res.status(200).json({
      success: true,
      message: "Check-in successful",
      checkIn: formatCheckIn(record),
    });
  } catch (error) {
    console.error("Check-in error:", error);

    res.status(500).json({
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
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      checkIns: checkIns.map(formatCheckIn),
    });
  } catch (error) {
    console.error("Get my check-ins error:", error);

    res.status(500).json({
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

    // Scheduled time = 7:00 PM IST
    const scheduledAt = new Date(
      `${period.periodKey}T${period.start}:00+05:30`
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

    res.json({
      success: true,
      message: "Expected check-ins generated",
      count: residents.length,
      periodKey: period.periodKey,
      scheduledAt: formatDateIST(scheduledAt),
    });
  } catch (error) {
    console.error("Generate check-ins error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate expected check-ins",
    });
  }
};

// Mark uncompleted check-ins as MISSED after 10 PM
const evaluateMissedCheckIns = async (req, res) => {
  try {
    const period = getCurrentNightPeriod();

    // 10:00 PM IST
    const endTime = new Date(
      `${period.periodKey}T${period.end}:00+05:30`
    );

    const now = new Date();

    if (now < endTime) {
      return res.status(400).json({
        success: false,
        message: `Check-in period has not ended yet. It ends at ${formatDateIST(
          endTime
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
      }
    );

    res.json({
      success: true,
      message: "Missed check-ins evaluated",
      missedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Missed check-in error:", error);

    res.status(500).json({
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
      .populate("residentId", "firstName lastName email")
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      checkIns: checkIns.map(formatCheckIn),
    });
  } catch (error) {
    console.error("Get all check-ins error:", error);

    res.status(500).json({
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