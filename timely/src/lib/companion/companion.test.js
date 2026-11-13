import { describe, expect, it } from 'vitest';
import { computeEnergy } from './energy.js';
import { computeMood } from './mood.js';
import { computeBond } from './bond.js';
import { findExamSoon, gpaStatus, gradeReaction, nextTask } from './context.js';
import { fill, pickLine } from './lines.js';
import { getCompanionState, timerReaction } from './index.js';

const TODAY = '2026-10-22';
const block = (id, start, end, status = 'scheduled', date = TODAY) => ({ id, date, start, end, status });
const task = (id, over = {}) => ({ id, title: `Даалгавар ${id}`, status: 'pending', deadline: '2026-10-30', priority: 'med', kind: 'assignment', ...over });
const state = (over = {}) => getCompanionState({ today: TODAY, hour: 10, name: 'Болормаа Батаа', ...over });

describe('companion: energy', () => {
  it('цагаас хамаарна: өглөө сэргэг, шөнө нойрмог', () => {
    expect(computeEnergy({ hour: 10 }).label).toBe('fresh');
    expect(computeEnergy({ hour: 13 }).label).toBe('steady');
    expect(computeEnergy({ hour: 22 }).label).toBe('tired');
    expect(computeEnergy({ hour: 2 }).label).toBe('sleepy');
  });
  it('их focus хийсэн бол ядарна (дээд тал нь 25)', () => {
    expect(computeEnergy({ hour: 10, focusMinutesToday: 0 }).value).toBe(90);
    expect(computeEnergy({ hour: 10, focusMinutesToday: 240 }).value).toBe(65);
    expect(computeEnergy({ hour: 10, focusMinutesToday: 2000 }).value).toBe(65);
  });
});

describe('companion: mood', () => {
  const base = { today: TODAY, tasks: [], blocks: [], minuteOfDay: 600 };
  it('төлөвлөгөөгүй, хоцрогдолгүй өдөр 60-аас буурахгүй', () => {
    const m = computeMood(base);
    expect(m.restDay).toBe(true);
    expect(m.score).toBeGreaterThanOrEqual(60);
  });
  it('блок дууссанаас хойш 30 минут өнгөрсний дараа л хоцорсонд тооцно', () => {
    const blocks = [block('B1', '11:00', '12:30')];
    expect(computeMood({ ...base, blocks, minuteOfDay: 12 * 60 + 40 }).slipped).toBe(0);
    expect(computeMood({ ...base, blocks, minuteOfDay: 13 * 60 + 1 }).slipped).toBe(1);
  });
  it('status=missed блок шууд хоцорсон', () => {
    expect(computeMood({ ...base, blocks: [block('B1', '08:00', '09:00', 'missed')] }).slipped).toBe(1);
  });
  it('нэг юм хийвэл сэтгэл хурдан сэргэнэ', () => {
    const slip = [block('B1', '08:00', '09:00'), block('B2', '09:00', '10:00')];
    const before = computeMood({ ...base, blocks: slip, minuteOfDay: 15 * 60 }).score;
    const recovered = computeMood({
      ...base, blocks: [{ ...slip[0], status: 'done' }, slip[1]], minuteOfDay: 15 * 60,
    }).score;
    expect(recovered).toBeGreaterThan(before + 10);
  });
  it('хугацаа хэтэрсэн даалгавар оноог бууруулна, completed тооцогдохгүй', () => {
    const late = [task('T1', { deadline: '2026-10-20' }), task('T2', { deadline: '2026-10-19', status: 'completed' })];
    const m = computeMood({ ...base, tasks: late });
    expect(m.overdue).toBe(1);
    expect(m.score).toBe(52);
  });
  it('0–100 хооронд хязгаарлагдана', () => {
    const many = Array.from({ length: 6 }, (_, i) => task(`T${i}`, { deadline: '2026-10-01' }));
    expect(computeMood({ ...base, tasks: many }).score).toBeGreaterThanOrEqual(0);
    const best = computeMood({
      ...base, blocks: [block('B', '08:00', '09:00', 'done')], focusMinutesToday: 500, completedToday: 9, streak: 20,
    });
    expect(best.score).toBeLessThanOrEqual(100);
    expect(best.allDone).toBe(true);
  });
});

describe('companion: bond', () => {
  it('шинэ хэрэглэгч 0-ээс эхэлнэ', () => {
    const b = computeBond({});
    expect(b.xp).toBe(0);
    expect(b.stage.id).toBe('new');
  });
  it('өдөр болон focus минутаас өснө, legacy үлдэгдлийг тооцохгүй', () => {
    const b = computeBond({
      sessions: [{ date: '2026-10-21', minutes: 120, status: 'stopped' }, { date: '2026-10-22', minutes: 60, status: 'running' }],
      pointsLog: [{ date: '2026-10-21', amount: 5, key: 'x' }, { date: TODAY, amount: 999, key: 'legacy-balance' }],
      tasks: [{ completedAt: '2026-10-20' }],
    });
    expect(b.days).toBe(2 + 1 - 1 + 0); // 10-21, 10-20 (running + legacy үгүй)
    expect(b.xp).toBe(2 * 10 + 20);
  });
  it('түвшин ахина, дотно байдал буурахгүй (илүү өгөгдөл → багагүй xp)', () => {
    const small = computeBond({ sessions: [{ date: '2026-10-01', minutes: 60, status: 'stopped' }] });
    const big = computeBond({
      sessions: Array.from({ length: 20 }, (_, i) => ({ date: `2026-09-${String(i + 1).padStart(2, '0')}`, minutes: 60, status: 'stopped' })),
    });
    expect(big.xp).toBeGreaterThan(small.xp);
    expect(big.stage.id).toBe('close');
  });
});

describe('companion: context', () => {
  it('7 хоногийн доторх ойрхон сорилыг олно', () => {
    const tasks = [
      task('T1', { kind: 'quiz', deadline: '2026-10-25' }),
      task('T2', { kind: 'quiz', deadline: '2026-10-23' }),
      task('T3', { kind: 'quiz', deadline: '2026-11-20' }),
      task('T4', { kind: 'assignment', deadline: '2026-10-22' }),
    ];
    const e = findExamSoon(tasks, TODAY);
    expect(e.task.id).toBe('T2');
    expect(e.daysLeft).toBe(1);
    expect(findExamSoon([tasks[2]], TODAY)).toBeNull();
  });
  it('саяхан орсон дүнд л хариу үйлдэл үзүүлнэ', () => {
    const bad = { courseName: 'Алгоритм', attendance: 5, lab: 10, quiz: 10, exam: 10, examEnteredAt: TODAY };
    const good = { courseName: 'Вэб', attendance: 10, lab: 28, quiz: 26, exam: 28, examEnteredAt: TODAY };
    const old = { ...bad, examEnteredAt: '2026-09-01' };
    expect(gradeReaction([bad], [TODAY]).kind).toBe('bad');
    expect(gradeReaction([good], [TODAY]).kind).toBe('good');
    expect(gradeReaction([old], [TODAY])).toBeNull();
    expect(gradeReaction([{ ...bad, examEnteredAt: undefined }], [TODAY])).toBeNull();
  });
  it('GPA зорилго: ойрхон / хүрсэн / хэцүү', () => {
    const sems = [{ semester: 1, gpa: 3.5, credits: 15 }, { semester: 2, gpa: 3.5, credits: 15 }, null, null, null, null, null, null];
    expect(gpaStatus({ semesters: sems, target: 3.55 }).kind).toBe('close');
    expect(gpaStatus({ semesters: sems, target: 3.4 }).kind).toBe('reached');
    expect(gpaStatus({ semesters: sems, target: 4.0 }).kind).toBe('hard');
    expect(gpaStatus({ semesters: sems, target: 3.7 })).toBeNull();
    expect(gpaStatus({ semesters: [null, null], target: 3.5 })).toBeNull();
  });
  it('хамгийн яаралтай дуусаагүй даалгаврыг сонгоно', () => {
    const t = nextTask([
      task('T1', { deadline: '2026-10-30' }),
      task('T2', { deadline: '2026-10-24', priority: 'low' }),
      task('T3', { deadline: '2026-10-24', priority: 'high' }),
      task('T4', { deadline: '2026-10-20', status: 'completed' }),
    ]);
    expect(t.id).toBe('T3');
    expect(nextTask([])).toBeNull();
  });
});

describe('companion: lines', () => {
  it('нэрийг хэрэглэх / орхих', () => {
    expect(fill('Сайн уу{, name}!', { name: 'Бат' })).toBe('Сайн уу, Бат!');
    expect(fill('Сайн уу{, name}!', { name: '' })).toBe('Сайн уу!');
    expect(fill('{a} ба {b}', { a: 1 })).toBe('1 ба ');
  });
  it('ижил seed → ижил үг, shift → өөр хувилбар', () => {
    const a = pickLine('tired', { seed: 's' });
    expect(pickLine('tired', { seed: 's' })).toBe(a);
    const seen = new Set([0, 1, 2].map((shift) => pickLine('tired', { seed: 's', shift })));
    expect(seen.size).toBe(3);
  });
  it('үл мэдэгдэх нөхцөлд унахгүй', () => {
    expect(pickLine('nope', { seed: 'x' })).toBeTruthy();
  });
});

describe('companion: getCompanionState', () => {
  it('шинэ хэрэглэгч: happy, хоосон өдөр, нэргүй', () => {
    const s = state({ name: 'Зулаа Батаа' });
    expect(s.emotion).toBe('happy');
    expect(s.situation).toBe('happy_idle');
    expect(s.glow).toBe(false);
    expect(s.nextStep).toBeNull();
    expect(s.line).not.toContain('Зулаа');
  });
  it('төлөвлөсөн блок хоцорвол гунигтай болж, дараагийн алхмыг санал болгоно', () => {
    const s = state({
      hour: 14,
      blocks: [block('B1', '11:00', '12:30'), block('B2', '19:30', '21:00')],
      tasks: [task('T1')],
    });
    expect(s.emotion).toBe('sad');
    expect(s.situation).toBe('slipped');
    expect(s.line).toContain('Даалгавар T1');
    expect(s.nextStep).toEqual({ label: '25 минут эхлэх', to: '/focus-timer?task=T1' });
  });
  it('нэг блок хийвэл гуниг арилна', () => {
    const s = state({
      hour: 14,
      blocks: [block('B1', '11:00', '12:30', 'done'), block('B2', '13:00', '13:30')],
      tasks: [task('T1')],
    });
    expect(s.emotion).not.toBe('sad');
  });
  it('амралтын өдөр гунигтай болохгүй', () => {
    expect(state({ hour: 23 }).emotion).not.toBe('sad');
  });
  it('шөнө бүгдийг дуусгавал бахархсан ч ядарсан (cup)', () => {
    const s = state({ hour: 22, blocks: [block('B1', '19:00', '20:30', 'done')] });
    expect(s.emotion).toBe('proud');
    expect(s.situation).toBe('proud_tired');
    expect(s.activity).toBe('cup');
  });
  it('бүгдийг биелүүлсэн үед гэрэлтэнэ, энгийн өдөр гэрэлтэхгүй', () => {
    const sessions = ['2026-10-20', '2026-10-21'].map((date, i) => ({ id: `F${i}`, date, minutes: 60, status: 'stopped' }));
    const s = state({ hour: 11, blocks: [block('B1', '08:00', '09:00', 'done')], sessions });
    expect(s.streak).toBe(2);
    expect(s.emotion).toBe('proud');
    expect(s.glow).toBe(true);
    const plain = state({ hour: 11, blocks: [block('B1', '15:00', '16:00')] });
    expect(plain.glow).toBe(false);
  });
  it('3+ өдрийн streak + өндөр сэтгэлтэй үед гэрэлтэнэ', () => {
    const sessions = ['2026-10-19', '2026-10-20', '2026-10-21'].map((date, i) => ({ id: `F${i}`, date, minutes: 60, status: 'stopped' }));
    const s = state({ hour: 11, blocks: [block('B1', '08:00', '09:00', 'done'), block('B2', '15:00', '16:00')], sessions });
    expect(s.streak).toBe(3);
    expect(s.mood.score).toBeGreaterThanOrEqual(80);
    expect(s.glow).toBe(true);
  });
  it('хэт их ачаалал → comfort, шүүмжлэлгүй, дахин төлөвлөхийг санал болгоно', () => {
    const tasks = [1, 2, 3].map((i) => task(`T${i}`, { deadline: '2026-10-15' }));
    const s = state({ hour: 15, tasks });
    expect(s.emotion).toBe('comfort');
    expect(s.situation).toBe('overload');
    expect(s.nextStep.to).toBe('/planner');
    expect(s.line).not.toMatch(/залхуу|буруу/);
  });
  it('муу дүн → comfort, сайн дүн → excited + glow', () => {
    const bad = { courseName: 'Алгоритм', attendance: 5, lab: 10, quiz: 10, exam: 10, examEnteredAt: TODAY };
    const good = { courseName: 'Вэб', attendance: 10, lab: 28, quiz: 26, exam: 28, examEnteredAt: TODAY };
    const b = state({ grades: [bad] });
    expect(b.emotion).toBe('comfort');
    expect(b.situation).toBe('grade_bad');
    expect(b.nextStep.to).toBe('/gpa-goal');
    const g = state({ grades: [good] });
    expect(g.emotion).toBe('excited');
    expect(g.glow).toBe(true);
    expect(g.line).toContain('Вэб');
  });
  it('шалгалт ойрхон бол сануулна', () => {
    const s = state({ tasks: [task('T1', { kind: 'quiz', deadline: '2026-10-23' })] });
    expect(s.situation).toBe('exam_soon');
    expect(s.line).toContain('маргааш');
    expect(s.nextStep.to).toContain('T1');
  });
  it('удаан байгаагүй бол гомдолгүй угтана', () => {
    const s = state({ pointsLog: [{ date: '2026-10-10', amount: 10, key: 'k' }] });
    expect(s.situation).toBe('welcome_back');
    expect(s.line).toMatch(/санлаа|баяртай/);
  });
  it('дотно болсны дараа нэрээр нь дууддаг', () => {
    const sessions = Array.from({ length: 8 }, (_, i) => ({ id: `F${i}`, date: `2026-10-${String(i + 1).padStart(2, '0')}`, minutes: 30, status: 'stopped' }));
    const s = state({ sessions, blocks: [block('B1', '15:00', '16:00')], hour: 10 });
    expect(s.bond.stageIndex).toBeGreaterThanOrEqual(1);
    expect(s.line).toContain('Болормаа');
  });
  it('mock болон бодит өнөөдрийн focus-ыг хоёуланг нь тооцно', () => {
    const s = state({
      realToday: '2026-11-08',
      sessions: [{ id: 'F1', date: '2026-11-08', minutes: 45, status: 'stopped' }],
    });
    expect(s.focusMinutesToday).toBe(45);
  });
});

describe('companion: timerReaction (хамт ажиллах)', () => {
  const phase = (elapsed) => timerReaction({ elapsed, total: 1500, seed: 'F1' });
  it('үе шат бүрт өөр төлөв', () => {
    expect(phase(5).phase).toBe('start');
    expect(phase(300).phase).toBe('focus');
    expect(phase(900).phase).toBe('half');
    expect(phase(1300).phase).toBe('almost');
    expect(phase(1500).phase).toBe('done');
    expect(phase(2000).phase).toBe('overtime');
  });
  it('ажиллах явцад ном уншина, дууссан үед гэрэлтэнэ, хэтэрвэл амрахыг хэлнэ', () => {
    expect(phase(300).activity).toBe('study');
    expect(phase(1500).glow).toBe(true);
    expect(phase(1500).emotion).toBe('excited');
    expect(phase(2000).activity).toBe('cup');
    expect(phase(2000).line).toMatch(/амар/);
  });
});
