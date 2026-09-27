const getMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const getCurrentNightPeriod = () => {
  const start = process.env.CHECKIN_START || "19:00";
  const end = process.env.CHECKIN_END || "22:00";

  const now = new Date();

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = getMinutes(start);
  const endMinutes = getMinutes(end);

  const inPeriod =
    currentMinutes >= startMinutes &&
    currentMinutes < endMinutes;

  const periodKey = now.toISOString().split("T")[0];

  return {
    inPeriod,
    periodKey,
    start,
    end,
  };
};

module.exports = { getCurrentNightPeriod };