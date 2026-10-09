const getMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid check-in time: ${time}. Expected HH:mm.`);
  }

  return hours * 60 + minutes;
};

const getCurrentNightPeriod = (now = new Date()) => {
  // Use the project's intended 7:00 PM–10:00 PM window by default.
  // Render servers may run in UTC, so calculate all times in IST explicitly.
  const start = process.env.CHECKIN_START || "19:00";
  const end = process.env.CHECKIN_END || "22:00";

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const currentMinutes = Number(values.hour) * 60 + Number(values.minute);
  const startMinutes = getMinutes(start);
  const endMinutes = getMinutes(end);
  const periodKey = `${values.year}-${values.month}-${values.day}`;

  const inPeriod =
    startMinutes <= endMinutes
      ? currentMinutes >= startMinutes && currentMinutes < endMinutes
      : currentMinutes >= startMinutes || currentMinutes < endMinutes;

  return {
    inPeriod,
    periodKey,
    start,
    end,
  };
};

module.exports = { getCurrentNightPeriod };
