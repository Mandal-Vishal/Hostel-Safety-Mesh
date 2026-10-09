/**
 * Check-in window for the Hostel Safety Mesh demo.
 *
 * The window is 7:00 PM to 10:00 PM in India Standard Time.
 * A check-in period is keyed to the IST calendar date on which
 * that window starts, so evaluations after 10:00 PM on the
 * same date still target the correct period.
 */
const TIME_ZONE = "Asia/Kolkata";
const START = "19:00";
const END = "22:00";
const START_MINUTES = 19 * 60;
const END_MINUTES = 22 * 60;

const getCurrentNightPeriod = (now = new Date()) => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
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

  const periodKey = `${values.year}-${values.month}-${values.day}`;
  const minutesNow = Number(values.hour) * 60 + Number(values.minute);

  return {
    periodKey,
    start: START,
    end: END,
    inPeriod: minutesNow >= START_MINUTES && minutesNow < END_MINUTES,
  };
};

module.exports = {
  getCurrentNightPeriod,
};
