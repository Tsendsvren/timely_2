import { currentFocusStreak, productiveFocusDates } from '../rewards.js';
import { computeEnergy, ENERGY_TEXT } from './energy.js';
import { computeMood, FOCUS_GOAL_MIN, moodLabel } from './mood.js';
import { activeDates, computeBond } from './bond.js';
import { dayPhrase, daysBetween, findExamSoon, gpaStatus, gradeReaction, nextTask } from './context.js';
import { pickLine } from './lines.js';

export { FOCUS_GOAL_MIN, ENERGY_TEXT, moodLabel };

// Бүх мэдээллээс муурын төлөвийг гаргана. Цэвэр функц: гаднаас цаг, өгөгдлөө авна.
// today — програмын "өнөөдөр" (mock), realToday — бодит өнөөдөр. Mock огнооны зөрүү
// байхад хоёуланд нь бүртгэгдсэн focus-ыг тооцно.
export function getCompanionState({
  today,
  realToday = today,
  hour = 12,
  minute = 0,
  name = '',
  tasks = [],
  blocks = [],
  sessions = [],
  grades = [],
  semesters = [],
  gpaTarget = null,
  pointsLog = [],
  shift = 0,
}) {
  const dates = [...new Set([today, realToday])];
  const finished = sessions.filter((s) => s.status !== 'running');
  const focusMinutesToday = finished.filter((s) => dates.includes(s.date)).reduce((a, s) => a + s.minutes, 0);
  const completedToday = tasks.filter((t) => t.completedAt && dates.includes(t.completedAt)).length;

  // streak: сүүлийн үр дүнтэй өдрөөс (өчигдөр эсвэл өнөөдөр) тоолно
  const productive = productiveFocusDates(sessions);
  const reference = [...dates].sort().reverse()[0];
  const lastProductive = [...productive].sort().reverse()[0];
  const streak = lastProductive && daysBetween(lastProductive, reference) <= 1
    ? currentFocusStreak(lastProductive, productive)
    : 0;

  const minuteOfDay = hour * 60 + minute;
  const mood = computeMood({ today, minuteOfDay, tasks, blocks, focusMinutesToday, completedToday, streak });
  const energy = computeEnergy({ hour, focusMinutesToday });
  const bond = computeBond({ sessions, pointsLog, tasks });

  const exam = findExamSoon(tasks, today);
  const grade = gradeReaction(grades, dates);
  const gpa = gpaStatus({ semesters, target: gpaTarget });
  const lastActive = [...activeDates({ sessions, pointsLog, tasks })].sort().reverse()[0];
  const away = lastActive ? daysBetween(lastActive, today) : 0;
  const task = nextTask(tasks);

  // ---- сэтгэл хөдлөл ----
  const overloaded = mood.overdue >= 3 || mood.slipped >= 3 || (mood.slipped >= 2 && mood.overdue >= 1);
  const troubled = (mood.slipped > 0 || mood.overdue > 0) && mood.score <= 50;
  let emotion = 'happy';
  if (grade?.kind === 'bad' || overloaded) emotion = 'comfort';
  else if (grade?.kind === 'good') emotion = 'excited';
  else if (troubled) emotion = 'sad';
  else if (mood.allDone) emotion = 'proud';
  else if (energy.label === 'sleepy') emotion = 'sleepy';
  else if (mood.score >= 80) emotion = 'excited';
  else if (energy.label === 'tired' && mood.score < 75) emotion = 'tired';

  const glow = (grade?.kind === 'good' || mood.score >= 80)
    && (grade?.kind === 'good' || mood.allDone || streak >= 3 || focusMinutesToday >= FOCUS_GOAL_MIN)
    && ['proud', 'excited', 'happy'].includes(emotion);
  const activity = emotion === 'tired' || (emotion === 'proud' && energy.value < 55) ? 'cup' : null;

  // ---- нөхцөл / үг ----
  let situation;
  if (grade?.kind === 'bad') situation = 'grade_bad';
  else if (emotion === 'comfort') situation = 'overload';
  else if (grade?.kind === 'good') situation = 'grade_good';
  else if (emotion === 'sad') situation = mood.slipped > 0 ? (task ? 'slipped' : 'slipped_generic') : 'overdue';
  else if (emotion === 'proud') situation = energy.value < 55 ? 'proud_tired' : 'proud';
  else if (away >= 3) situation = 'welcome_back';
  else if (exam && !mood.allDone) situation = 'exam_soon';
  else if (gpa?.kind === 'close') situation = 'gpa_close';
  else if (gpa?.kind === 'hard') situation = 'gpa_hard';
  else if (gpa?.kind === 'reached') situation = 'gpa_reached';
  else if (['excited', 'tired', 'sleepy'].includes(emotion)) situation = emotion;
  else situation = mood.planned > 0 ? 'happy_plan' : 'happy_idle';

  const overdueTask = tasks
    .filter((t) => t.status !== 'completed' && t.deadline && t.deadline < today)
    .sort((a, b) => a.deadline.localeCompare(b.deadline))[0];
  const first = name.trim().split(/\s+/)[0] || '';
  const vars = {
    name: bond.stageIndex >= 1 ? first : '',
    planned: mood.planned,
    left: Math.max(0, mood.planned - mood.done),
    slipped: mood.slipped,
    task: situation === 'overdue' ? overdueTask?.title : (exam && situation === 'exam_soon' ? exam.task.title : task?.title),
    when: exam ? dayPhrase(exam.daysLeft) : '',
    course: grade?.course,
    letter: grade?.letter,
    gap: gpa?.gap?.toFixed(2),
  };
  const line = pickLine(situation, { seed: `${today}|${Math.floor(hour / 4)}`, shift, vars });

  // ---- дараагийн жижиг алхам ----
  let nextStep = null;
  const focusOn = (t) => ({ label: '25 минут эхлэх', to: `/focus-timer?task=${t.id}` });
  if (situation === 'overload') nextStep = { label: 'Дахин төлөвлөх', to: '/planner' };
  else if (situation === 'grade_bad' || situation === 'gpa_hard') nextStep = { label: 'GPA зорилго харах', to: '/gpa-goal' };
  else if (situation === 'exam_soon') nextStep = focusOn(exam.task);
  else if (situation === 'overdue' && overdueTask) nextStep = focusOn(overdueTask);
  else if (['slipped', 'tired', 'welcome_back'].includes(situation) && task) nextStep = focusOn(task);

  const reasons = [];
  if (mood.planned) reasons.push(`${mood.done}/${mood.planned} блок дууссан`);
  if (mood.slipped) reasons.push(`${mood.slipped} блок хоцорсон`);
  if (mood.overdue) reasons.push(`${mood.overdue} даалгаврын хугацаа хэтэрсэн`);
  if (focusMinutesToday) reasons.push(`Өнөөдөр ${focusMinutesToday} мин focus`);
  if (streak) reasons.push(`${streak} өдрийн streak`);

  return {
    emotion, glow, activity, line, situation, nextStep, reasons,
    mood: { ...mood, label: moodLabel(mood.score) },
    energy: { ...energy, text: ENERGY_TEXT[energy.label] },
    bond, streak, focusMinutesToday,
    context: { exam, grade, gpa, away },
  };
}

// Хамт ажиллах: Focus Timer ажиллах үеийн муурын хариу үйлдэл.
export function timerReaction({ elapsed = 0, total = 1500, name = '', seed = '' }) {
  const ratio = total > 0 ? elapsed / total : 0;
  const pick = (list) => list[(seed.length + Math.floor(elapsed / 300)) % list.length];
  const who = name ? `, ${name}` : '';
  if (elapsed < 20) {
    return { phase: 'start', emotion: 'happy', activity: 'study', glow: false, line: `Явцгаая${who}! Би хажууд чинь ном уншиж суугаад байя.` };
  }
  if (ratio < 0.5) {
    return {
      phase: 'focus', emotion: 'happy', activity: 'study', glow: false,
      line: pick(['Чимээгүй, төвлөрч байна. Би ч бас уншиж байна.', 'Сайн явж байна. Утсаа хойш тавьсаар л байя.', 'Жижиг алхам бүр чухал. Үргэлжлүүл.']),
    };
  }
  if (ratio < 0.8) {
    return { phase: 'half', emotion: 'excited', activity: 'study', glow: false, line: 'Хагас нь боллоо! Ийм хэмнэлээр үргэлжлүүлээрэй.' };
  }
  if (ratio < 1) {
    return { phase: 'almost', emotion: 'excited', activity: 'study', glow: false, line: 'Бараг дууслаа, сүүлийн хэдэн минут!' };
  }
  if (ratio < 1.25) {
    return { phase: 'done', emotion: 'excited', activity: null, glow: true, line: 'Төлөвлөсөн хугацаа биеллээ! Stop дараад оноогоо аваарай.' };
  }
  return { phase: 'overtime', emotion: 'tired', activity: 'cup', glow: false, line: 'Хугацаа хэтэрлээ. Ядрахаас өмнө Stop дараад, ус уугаад амарвал дээр.' };
}

