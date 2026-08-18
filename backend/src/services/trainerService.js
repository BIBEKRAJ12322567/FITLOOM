/**
 * Pure scheduling logic for trainer bookings — no DB access, so it's cheap
 * to unit test in isolation from booking creation/controller wiring.
 */

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * True if a session of `durationMinutes` starting at `scheduledAt` falls
 * entirely within one of the trainer's weekly availability slots (same
 * day-of-week, session start >= slot start, session end <= slot end).
 * Uses the server's local time via Date's own getDay/getHours/getMinutes —
 * the same convention the streak-tracking date logic elsewhere in this
 * codebase uses (there's no per-user timezone field yet).
 */
function isWithinAvailability(scheduledAt, durationMinutes, availability) {
  if (!Array.isArray(availability) || availability.length === 0) return false;

  const day = scheduledAt.getDay();
  const startMin = scheduledAt.getHours() * 60 + scheduledAt.getMinutes();
  const endMin = startMin + durationMinutes;

  return availability.some((slot) => {
    if (slot.dayOfWeek !== day) return false;
    const slotStart = timeToMinutes(slot.startTime);
    const slotEnd = timeToMinutes(slot.endTime);
    return startMin >= slotStart && endMin <= slotEnd;
  });
}

/**
 * True if two bookings (each a start Date + duration in minutes) overlap.
 * Back-to-back bookings — one ends exactly when the other starts — do NOT
 * count as overlapping; that's a valid schedule, not a conflict.
 */
function bookingsOverlap(aStart, aDurationMinutes, bStart, bDurationMinutes) {
  const aEnd = new Date(aStart.getTime() + aDurationMinutes * 60000);
  const bEnd = new Date(bStart.getTime() + bDurationMinutes * 60000);
  return aStart < bEnd && bStart < aEnd;
}

/** Pro-rated session price from the trainer's hourly rate, rounded to paise/cents. */
function computeSessionPrice(hourlyRate, durationMinutes) {
  return Math.round(((hourlyRate * durationMinutes) / 60) * 100) / 100;
}

module.exports = { timeToMinutes, isWithinAvailability, bookingsOverlap, computeSessionPrice };