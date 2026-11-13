import { addDays, weekStart } from './dates.js';

export const MAX_DAILY_FOCUS_MINUTES = 240;
export const MIN_REWARDED_SESSION_MINUTES = 5;
export const DAILY_STREAK_MINUTES = 25;

export const dateFromTimestamp = (timestamp) => new Date(timestamp).toISOString().slice(0, 10);

export const totalPoints = (pointsLog = []) =>
  pointsLog.reduce((total, entry) => total + entry.amount, 0);

export function productiveFocusDates(sessions) {
  const minutesByDate = new Map();
  sessions
    .filter((session) => session.status !== 'running')
    .forEach((session) => minutesByDate.set(
      session.date,
      (minutesByDate.get(session.date) || 0) + session.minutes,
    ));
  return new Set(
    [...minutesByDate]
      .filter(([, minutes]) => minutes >= DAILY_STREAK_MINUTES)
      .map(([date]) => date),
  );
}

export function currentFocusStreak(date, productiveDates) {
  let cursor = date;
  let streak = 0;

  while (productiveDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  if (productiveDates.has(addDays(cursor, -1))) {
    cursor = addDays(cursor, -1);
    while (productiveDates.has(cursor)) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
  }

  return streak;
}

export function focusWeekStart(date) {
  return weekStart(date);
}

export function levelProgress(points) {
  let level = 1;
  let progress = points;
  let required = 170;

  while (progress >= required) {
    progress -= required;
    level += 1;
    required = 170 * level;
  }

  return { level, progress, required };
}
