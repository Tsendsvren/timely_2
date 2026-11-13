import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { TODAY } from '../lib/dates.js';
import { dateFromTimestamp } from '../lib/rewards.js';
import { getCompanionState } from '../lib/companion/index.js';

// Минут тутам шинэчлэгдэх одоогийн цаг (эрч хүч, хоцролт цагаас хамаарна).
function useNow(intervalMs = 60000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

// Нэвтэрсэн оюутны өгөгдлөөс муурын төлөвийг гаргана. Админ/зочинд null.
export function useCompanion({ shift = 0 } = {}) {
  const { user, profile, mine } = useApp();
  const now = useNow();
  const minuteKey = Math.floor(now.getTime() / 60000);
  return useMemo(() => {
    if (!user || user.role !== 'member' || !profile) return null;
    const date = new Date(minuteKey * 60000);
    return getCompanionState({
      today: TODAY,
      realToday: dateFromTimestamp(date.getTime()),
      hour: date.getHours(),
      minute: date.getMinutes(),
      name: user.name,
      tasks: mine.tasks,
      blocks: mine.blocks,
      sessions: mine.sessions,
      grades: mine.grades,
      semesters: mine.semesters,
      gpaTarget: profile.gpaTarget,
      pointsLog: profile.pointsLog,
      shift,
    });
  }, [user, profile, mine, minuteKey, shift]);
}
