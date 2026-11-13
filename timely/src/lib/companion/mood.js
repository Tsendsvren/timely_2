import { toMin } from '../dates.js';

export const FOCUS_GOAL_MIN = 90; // өдрийн focus зорилго (минут)
export const SLIP_GRACE_MIN = 30; // блок дууссанаас хойш хэдэн минутын дараа "хоцорсон" гэж үзэх

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export const moodLabel = (score) => {
  if (score >= 80) return 'Гайхалтай';
  if (score >= 60) return 'Сайн';
  if (score >= 45) return 'Дунд';
  return 'Хүнд';
};

// Сэтгэл санаа: 0–100. Өнөөдрийн биелэлтээс гарна. Хурдан сэргэж, удаан унана.
export function computeMood({
  today,
  minuteOfDay,
  tasks = [],
  blocks = [],
  focusMinutesToday = 0,
  completedToday = 0,
  streak = 0,
}) {
  const todays = blocks.filter((b) => b.date === today);
  const planned = todays.length;
  const done = todays.filter((b) => b.status === 'done').length;
  const slipped = todays.filter(
    (b) => b.status === 'missed'
      || (b.status === 'scheduled' && minuteOfDay >= toMin(b.end) + SLIP_GRACE_MIN),
  ).length;
  const overdue = tasks.filter((t) => t.status !== 'completed' && t.deadline && t.deadline < today).length;

  let slipPenalty = Math.min(36, slipped * 12);
  if (done > 0) slipPenalty = Math.round(slipPenalty * 0.6); // нэг юм хийсэн бол сэргэлт хурдан
  const overduePenalty = Math.min(24, overdue * 8);

  let score = 60;
  score += planned ? Math.round((30 * done) / planned) : 0;
  score -= slipPenalty;
  score -= overduePenalty;
  score += Math.round(20 * Math.min(1, focusMinutesToday / FOCUS_GOAL_MIN));
  score += Math.min(20, completedToday * 10);
  score += Math.min(14, Math.min(streak, 7) * 2);

  // Төлөвлөгөөгүй, хоцрогдолгүй өдөр гунигтай болохгүй.
  const restDay = planned === 0 && overdue === 0;
  if (restDay) score = Math.max(score, 60);

  return {
    score: clamp(score, 0, 100),
    planned,
    done,
    slipped,
    overdue,
    allDone: planned > 0 && done === planned,
    restDay,
  };
}
