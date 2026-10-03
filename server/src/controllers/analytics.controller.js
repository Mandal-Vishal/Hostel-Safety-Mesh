const { getAnalytics } = require("../services/analytics.service");

const getAnalyticsOverview = async (req, res) => {
  try {
    const days = req.query.days || 7;

    const analytics = await getAnalytics({
      days,
    });

    return res.status(200).json({
      success: true,

      data: analytics,
    });
  } catch (error) {
    console.error("Get analytics error:", error);

    return res.status(500).json({
      success: false,

      message: "Failed to fetch analytics",
    });
  }
};

module.exports = {
  getAnalyticsOverview,
};
