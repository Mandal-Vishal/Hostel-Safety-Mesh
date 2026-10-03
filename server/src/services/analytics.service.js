const Incident = require("../models/incident.model");
const CheckIn = require("../models/checkIn.model");
const Node = require("../models/node.model");

const DEFAULT_DAYS = 7;
const MAX_DAYS = 90;

const normalizeDays = (value) => {
  const days = Number(value);

  if (!Number.isFinite(days)) {
    return DEFAULT_DAYS;
  }

  return Math.min(Math.max(Math.floor(days), 1), MAX_DAYS);
};

const formatDuration = (milliseconds) => {
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) {
    return "00:00";
  }

  const totalSeconds = Math.floor(milliseconds / 1000);

  const hours = Math.floor(totalSeconds / 3600);

  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [
      String(hours).padStart(2, "0"),
      String(minutes).padStart(2, "0"),
      String(seconds).padStart(2, "0"),
    ].join(":");
  }

  return [
    String(minutes).padStart(2, "0"),
    String(seconds).padStart(2, "0"),
  ].join(":");
};

const getStartDate = (days) => {
  const start = new Date();

  start.setHours(0, 0, 0, 0);

  start.setDate(start.getDate() - (days - 1));

  return start;
};

const getAnalytics = async ({ days = DEFAULT_DAYS } = {}) => {
  const normalizedDays = normalizeDays(days);

  const startDate = getStartDate(normalizedDays);

  /**
   * -------------------------------------------------------
   * INCIDENT SUMMARY
   * -------------------------------------------------------
   */
  const [
    incidentSummary,
    incidentsByDay,
    incidentsByZone,
    incidentsByType,
    responseSummary,
  ] = await Promise.all([
    Incident.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: null,

          totalIncidents: {
            $sum: 1,
          },

          sosEvents: {
            $sum: {
              $cond: [
                {
                  $eq: ["$type", "SOS"],
                },
                1,
                0,
              ],
            },
          },

          resolved: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "RESOLVED"],
                },
                1,
                0,
              ],
            },
          },

          acknowledged: {
            $sum: {
              $cond: [
                {
                  $ne: ["$acknowledgedAt", null],
                },
                1,
                0,
              ],
            },
          },

          escalated: {
            $sum: {
              $cond: [
                {
                  $ne: ["$escalatedAt", null],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    /**
     * Incident count grouped by calendar day.
     *
     * Asia/Kolkata is used so the dashboard reflects
     * the project's operating timezone.
     */
    Incident.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          _id: 1,
        },
      },
    ]),

    /**
     * Incident count grouped by operational zone.
     */
    Incident.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: {
            $ifNull: ["$location.zone", "Unknown"],
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
          _id: 1,
        },
      },
    ]),

    /**
     * The current incident model only supports SOS,
     * so categories are derived from the actual stored
     * incident type.
     */
    Incident.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: "$type",

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
          _id: 1,
        },
      },
    ]),

    /**
     * Average acknowledgement latency.
     *
     * Only incidents that were actually acknowledged
     * are included.
     */
    Incident.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
          },

          acknowledgedAt: {
            $ne: null,
          },
        },
      },

      {
        $project: {
          responseTimeMs: {
            $subtract: ["$acknowledgedAt", "$createdAt"],
          },
        },
      },

      {
        $group: {
          _id: null,

          averageResponseTimeMs: {
            $avg: "$responseTimeMs",
          },
        },
      },
    ]),
  ]);

  /**
   * -------------------------------------------------------
   * CHECK-IN SUMMARY
   * -------------------------------------------------------
   */
  const [checkInSummary, nodeSummary] = await Promise.all([
    CheckIn.aggregate([
      {
        $match: {
          scheduledAt: {
            $gte: startDate,
          },
        },
      },

      {
        $group: {
          _id: null,

          expected: {
            $sum: 1,
          },

          checkedIn: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "CHECKED_IN"],
                },
                1,
                0,
              ],
            },
          },

          missed: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "MISSED"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),

    Node.aggregate([
      {
        $match: {
          isActive: true,
        },
      },

      {
        $group: {
          _id: null,

          total: {
            $sum: 1,
          },

          online: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "ONLINE"],
                },
                1,
                0,
              ],
            },
          },

          offline: {
            $sum: {
              $cond: [
                {
                  $eq: ["$status", "OFFLINE"],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]),
  ]);

  const incidentData = incidentSummary[0] || {
    totalIncidents: 0,
    sosEvents: 0,
    resolved: 0,
    acknowledged: 0,
    escalated: 0,
  };

  const checkInData = checkInSummary[0] || {
    expected: 0,
    checkedIn: 0,
    missed: 0,
  };

  const nodeData = nodeSummary[0] || {
    total: 0,
    online: 0,
    offline: 0,
  };

  const averageResponseTimeMs = responseSummary[0]?.averageResponseTimeMs || 0;

  /**
   * Fill missing days with zero so the frontend
   * receives a continuous time series.
   */
  const incidentDayMap = new Map(
    incidentsByDay.map((item) => [item._id, item.count]),
  );

  const incidentsByDayResult = [];

  for (let i = 0; i < normalizedDays; i += 1) {
    const date = new Date(startDate);

    date.setDate(startDate.getDate() + i);

    const year = date.getFullYear();

    const month = String(date.getMonth() + 1).padStart(2, "0");

    const day = String(date.getDate()).padStart(2, "0");

    const key = `${year}-${month}-${day}`;

    incidentsByDayResult.push({
      day: date.toLocaleDateString("en-IN", {
        weekday: "short",
        timeZone: "Asia/Kolkata",
      }),

      date: key,

      count: incidentDayMap.get(key) || 0,
    });
  }

  return {
    period: {
      days: normalizedDays,

      startDate: startDate.toISOString(),

      endDate: new Date().toISOString(),
    },

    incidents: {
      total: incidentData.totalIncidents,

      sos: incidentData.sosEvents,

      acknowledged: incidentData.acknowledged,

      escalated: incidentData.escalated,

      resolved: incidentData.resolved,

      pending: Math.max(incidentData.totalIncidents - incidentData.resolved, 0),
    },

    response: {
      averageAcknowledgement: formatDuration(averageResponseTimeMs),

      averageAcknowledgementMs: Math.round(averageResponseTimeMs),
    },

    checkIns: {
      expected: checkInData.expected,

      checkedIn: checkInData.checkedIn,

      missed: checkInData.missed,

      completionRate:
        checkInData.expected > 0
          ? Number(
              ((checkInData.checkedIn / checkInData.expected) * 100).toFixed(2),
            )
          : 0,
    },

    nodes: {
      total: nodeData.total,

      online: nodeData.online,

      offline: nodeData.offline,

      onlineRate:
        nodeData.total > 0
          ? Number(((nodeData.online / nodeData.total) * 100).toFixed(2))
          : 0,
    },

    totalIncidents: incidentData.totalIncidents,

    sosEvents: incidentData.sosEvents,

    avgResponse: formatDuration(averageResponseTimeMs),

    resolved: incidentData.resolved,

    incidentsByDay: incidentsByDayResult,

    incidentsByZone: incidentsByZone.map((item) => ({
      zone: item._id,
      count: item.count,
    })),

    categories: incidentsByType.map((item) => ({
      name: item._id,
      count: item.count,
    })),
  };
};

module.exports = {
  getAnalytics,
};
