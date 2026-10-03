const CheckIn = require("../models/checkIn.model");
const User = require("../models/user.model");

const formatDateIST = require("../utils/formatDate");
const { getCurrentNightPeriod } = require("../utils/checkinPeriod");

const { sanitizeCheckIn, sanitizeCheckIns } = require("../utils/privacy");

const ALLOWED_CHECK_IN_STATUSES = ["EXPECTED", "CHECKED_IN", "MISSED"];

/**
 * Format one privacy-filtered check-in.
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

/**
 * ---------------------------------------------------------
 * RESIDENT CHECK-IN
 * ---------------------------------------------------------
 */
const checkIn = async (req, res) => {
  try {
    const period = getCurrentNightPeriod();

    if (!period.inPeriod) {
      return res.status(400).json({
        success: false,

        message: `Check-in is allowed between ${period.start} and ${period.end}`,
      });
    }

    const residentId = req.user._id;

    const existing = await CheckIn.findOne({
      residentId,
      periodKey: period.periodKey,
    });

    /**
     * Never allow a second check-in
     * for the same night.
     */
    if (existing?.status === "CHECKED_IN") {
      return res.status(409).json({
        success: false,

        message: "You have already checked in",
      });
    }

    /**
     * The scheduled time is controlled by
     * the configured night period.
     */
    const scheduledAt = new Date(
      `${period.periodKey}T${period.start}:00+05:30`,
    );

    const checkedInAt = new Date();

    /**
     * SECURITY:
     *
     * Never trust a location supplied by
     * the client.
     */
    const trustedLocation = req.user.currentZone || req.user.hostel || null;

    const data = {
      residentId,

      periodKey: period.periodKey,

      scheduledAt,

      checkedInAt,

      status: "CHECKED_IN",

      source: {
        type: "RESIDENT_APP",
        nodeId: null,
      },

      zone: trustedLocation || null,
    };

    let record;

    if (existing) {
      record = await CheckIn.findByIdAndUpdate(
        existing._id,
        {
          $set: data,
        },
        {
          new: true,
          runValidators: true,
        },
      );
    } else {
      try {
        record = await CheckIn.create(data);
      } catch (error) {
        /**
         * Another request may have created
         * the unique record between our find()
         * and create().
         */
        if (error?.code === 11000) {
          return res.status(409).json({
            success: false,

            message: "You have already checked in",
          });
        }

        throw error;
      }
    }

    /**
     * ---------------------------------------------------------
     * REAL-TIME WARDEN UPDATE
     * ---------------------------------------------------------
     *
     * The resident's check-in has now been persisted.
     * Notify operational staff through Socket.IO.
     *
     * Only the privacy-filtered Warden representation is
     * emitted. Internal fields are never exposed.
     */
    await record.populate(
      "residentId",
      "firstName lastName role hostel currentZone",
    );

    const wardenCheckIn = formatSafeCheckIn(record, "warden");

    const io = req.app.get("io");

    if (io) {
      io.to("role:warden").emit("checkin:updated", {
        checkIn: wardenCheckIn,
      });
    }

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

/**
 * ---------------------------------------------------------
 * RESIDENT CHECK-IN HISTORY
 * ---------------------------------------------------------
 */
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

/**
 * ---------------------------------------------------------
 * GENERATE EXPECTED CHECK-INS
 * ---------------------------------------------------------
 */
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

            zone: null,
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

/**
 * ---------------------------------------------------------
 * EVALUATE MISSED CHECK-INS
 * ---------------------------------------------------------
 */
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

/**
 * ---------------------------------------------------------
 * WARDEN / SECURITY CHECK-IN VIEW
 * ---------------------------------------------------------
 */
const getAllCheckIns = async (req, res) => {
  try {
    const filter = {};

    if (req.query.status) {
      const status = String(req.query.status).toUpperCase();

      if (!ALLOWED_CHECK_IN_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,

          message: "Invalid check-in status",
        });
      }

      filter.status = status;
    }

    const checkIns = await CheckIn.find(filter)
      .populate("residentId", "firstName lastName email role hostel")
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
