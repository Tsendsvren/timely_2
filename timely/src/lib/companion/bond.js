// Дотно байдал: хамт өнгөрүүлсэн өдөр, focus минутаас гарна. Хэзээ ч буурахгүй.
export const BOND_STAGES = [
  { id: 'new', name: 'Танилцаж байна', min: 0 },
  { id: 'friend', name: 'Найз', min: 60 },
  { id: 'close', name: 'Дотны найз', min: 200 },
  { id: 'partner', name: 'Салшгүй хамтрагч', min: 500 },
];

export function activeDates({ sessions = [], pointsLog = [], tasks = [] }) {
  const dates = new Set();
  sessions.filter((s) => s.status !== 'running' && s.minutes > 0).forEach((s) => dates.add(s.date));
  pointsLog.filter((e) => !String(e.key).startsWith('legacy-balance')).forEach((e) => dates.add(e.date));
  tasks.filter((t) => t.completedAt).forEach((t) => dates.add(t.completedAt));
  return dates;
}

export function computeBond({ sessions = [], pointsLog = [], tasks = [] }) {
  const days = activeDates({ sessions, pointsLog, tasks });
  const focusMinutes = sessions.filter((s) => s.status !== 'running').reduce((a, s) => a + (s.minutes || 0), 0);
  const xp = days.size * 10 + Math.floor(focusMinutes / 6);

  let stageIndex = 0;
  BOND_STAGES.forEach((s, i) => { if (xp >= s.min) stageIndex = i; });
  const stage = BOND_STAGES[stageIndex];
  const next = BOND_STAGES[stageIndex + 1] || null;
  return {
    xp,
    days: days.size,
    focusMinutes,
    stageIndex,
    stage,
    next,
    progress: next ? xp - stage.min : 1,
    required: next ? next.min - stage.min : 1,
  };
}
