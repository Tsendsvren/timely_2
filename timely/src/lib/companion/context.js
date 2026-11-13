import { addDays } from '../dates.js';
import { calcGrade } from '../gradeCalc.js';
import { currentGPA, requiredAverage } from '../gpaCalc.js';

const PRIORITY_RANK = { high: 0, med: 1, low: 2 };

export const daysBetween = (from, to) =>
  Math.round((new Date(to + 'T00:00:00Z') - new Date(from + 'T00:00:00Z')) / 86400000);

export const dayPhrase = (n) => (n <= 0 ? 'өнөөдөр' : n === 1 ? 'маргааш' : `${n} хоногийн дараа`);

// Хамгийн ойрхон сорил (quiz) — 7 хоногийн дотор.
export function findExamSoon(tasks, today, windowDays = 7) {
  const soon = tasks
    .filter((t) => (t.kind === 'quiz' || t.kind === 'exam') && t.status !== 'completed' && t.deadline
      && t.deadline >= today && t.deadline <= addDays(today, windowDays))
    .sort((a, b) => a.deadline.localeCompare(b.deadline));
  if (!soon.length) return null;
  return { task: soon[0], daysLeft: daysBetween(today, soon[0].deadline) };
}

// Саяхан (2 хоногийн дотор) шалгалтын оноо нь орсон дүн.
export function gradeReaction(grades, refDates, windowDays = 2) {
  const recent = grades
    .filter((g) => g.examEnteredAt && g.exam !== null && g.exam !== undefined
      && refDates.some((d) => {
        const diff = daysBetween(g.examEnteredAt, d);
        return diff >= 0 && diff <= windowDays;
      }))
    .sort((a, b) => b.examEnteredAt.localeCompare(a.examEnteredAt));
  if (!recent.length) return null;
  const g = recent[0];
  const calc = calcGrade(g);
  if (calc.gradePoint < 2.0) return { kind: 'bad', course: g.courseName, letter: calc.letter, total: calc.total };
  if (calc.gradePoint >= 3.3) return { kind: 'good', course: g.courseName, letter: calc.letter, total: calc.total };
  return null;
}

export function gpaStatus({ semesters = [], target }) {
  const cur = currentGPA(semesters);
  if (!cur.count || !target) return null;
  const gap = Math.round((Number(target) - cur.gpa) * 100) / 100;
  if (gap <= 0) return { kind: 'reached', current: cur.gpa, target, gap };
  if (gap <= 0.1) return { kind: 'close', current: cur.gpa, target, gap };
  const need = requiredAverage(semesters, Number(target));
  if (!need.feasible) return { kind: 'hard', current: cur.gpa, target, gap, required: need.required };
  return null;
}

// Хамгийн яаралтай дуусаагүй даалгавар.
export function nextTask(tasks) {
  return tasks
    .filter((t) => t.status !== 'completed')
    .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999')
      || (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3))[0] || null;
}
