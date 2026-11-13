import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { PageHeader, EmptyState, Badge, Progress } from '../components/ui.jsx';
import CatCompanion from '../components/CatCompanion.jsx';
import WorkloadChart from '../components/WorkloadChart.jsx';
import { IconCalendar, IconCheck, IconClock } from '../components/m02Icons.jsx';
import { TODAY, addDays, weekday, weekStart, DAY_NAMES, toMin, durationMin } from '../lib/dates.js';
import { currentFocusStreak, levelProgress, productiveFocusDates } from '../lib/rewards.js';
import '../styles/m02.css';

const FOCUS_GOAL_MIN = 180;
const POINTS_GOAL = 150;
const FULL_DAY_NAMES = ['Даваа', 'Мягмар', 'Лхагва', 'Пүрэв', 'Баасан', 'Бямба', 'Ням'];

const round1 = (n) => Math.round(n * 10) / 10;

/** "2026-10-22" -> "Пүрэв, 10-р сарын 22" */
function humanDate(iso) {
  const [, m, d] = iso.split('-').map(Number);
  return `${FULL_DAY_NAMES[weekday(iso)]}, ${m}-р сарын ${d}`;
}

function StatCard({ icon, tone, label, value, hint, testId }) {
  return (
    <div className="card stat m02-stat">
      <span className={`m02-stat-icon ${tone}`} aria-hidden="true">{icon}</span>
      <div className="m02-stat-body">
        <span className="muted sm">{label}</span>
        <strong data-testid={testId}>{value}</strong>
        <span className="muted sm">{hint}</span>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, profile, data, mine, lessons = [], actions } = useApp();
  const wd = weekday(TODAY);

  // ---- Өнөөдрийн хуваарь, цагаар эрэмбэлсэн (TML-DASH-S1) ----
  const items = useMemo(() => {
    const taskTitle = (id) => data.tasks.find((t) => t.id === id)?.title || 'Даалгавар';
    return [
      ...lessons
        .filter((l) => l.weekday === wd)
        .map((l) => ({ key: l.id, start: l.start, end: l.end, title: l.title, sub: l.room, tag: 'Хичээл', tone: 'blu' })),
      ...mine.commitments
        .filter((c) => c.days.includes(wd))
        .map((c) => ({ key: c.id, start: c.start, end: c.end, title: c.title, sub: 'Гадуурх ачаалал', tag: 'Commitment', tone: 'amb' })),
      ...mine.blocks
        .filter((b) => b.date === TODAY && b.status !== 'missed')
        .map((b) => ({
          key: b.id,
          block: b,
          start: b.start,
          end: b.end,
          title: 'Study block: ' + taskTitle(b.taskId),
          sub: b.status === 'done' ? 'Дууссан' : 'Санал болгосон',
          tag: 'Study block',
          tone: 'pri',
        })),
    ].sort((a, b) => toMin(a.start) - toMin(b.start));
  }, [lessons, mine.commitments, mine.blocks, data.tasks, wd]);

  // ---- Долоо хоногийн ачаалал ----
  const workload = useMemo(() => {
    const start = weekStart(TODAY);
    return DAY_NAMES.map((n, i) => {
      const d = addDays(start, i);
      const mins =
        lessons.filter((l) => l.weekday === i).reduce((a, l) => a + durationMin(l), 0) +
        mine.commitments.filter((c) => c.days.includes(i)).reduce((a, c) => a + durationMin(c), 0) +
        mine.blocks.filter((b) => b.date === d && b.status !== 'missed').reduce((a, b) => a + durationMin(b), 0);
      return { n, d, h: round1(mins / 60) };
    });
  }, [lessons, mine.commitments, mine.blocks]);
  const total = round1(workload.reduce((a, w) => a + w.h, 0));

  // ---- Өчигдрийн гүйцэтгэл ----
  const yday = useMemo(() => {
    const Y = addDays(TODAY, -1);
    const blocks = mine.blocks.filter((b) => b.date === Y);
    const done = blocks.filter((b) => b.status === 'done').length;
    const sessions = mine.sessions.filter((s) => s.date === Y);
    return {
      total: blocks.length,
      done,
      rate: blocks.length ? Math.round((done / blocks.length) * 100) : 0,
      minutes: sessions.reduce((a, s) => a + s.minutes, 0),
      points: profile.pointsLog
        .filter((entry) => entry.date === Y)
        .reduce((total, entry) => total + entry.amount, 0),
    };
  }, [mine.blocks, mine.sessions, profile.pointsLog]);

  const studyItems = items.filter((i) => i.block);
  const studyDone = studyItems.filter((i) => i.block.status === 'done').length;
  const plannedH = round1(
    items.filter((i) => i.tone !== 'blu').reduce((a, i) => a + (toMin(i.end) - toMin(i.start)), 0) / 60,
  );
  const equipped = profile.equipped.map((id) => data.shopItems.find((i) => i.id === id)).filter(Boolean);
  const level = levelProgress(profile.earnedPoints ?? profile.points); // зарцуулалтаар level буурахгүй
  const activeFocusDates = productiveFocusDates(mine.sessions);
  const latestFocusDate = [...activeFocusDates].sort().reverse()[0];
  const latestStreak = latestFocusDate ? currentFocusStreak(latestFocusDate, activeFocusDates) : 0;
  const hasYesterday = yday.total > 0 || yday.minutes > 0;

  return (
    <main className="page" data-testid="page-dashboard">
      <PageHeader
        title={`Сайн байна уу, ${user.name.split(' ')[0]}`}
        sub={`${humanDate(TODAY)} · Өнөөдөр ${studyItems.length} Study block төлөвлөгдсөн`}
      >
        <Link className="btn pri" to="/tasks/new">+ Даалгавар нэмэх</Link>
      </PageHeader>

      <div className="grid-dash">
        <div className="stack">
          <div className="stats">
            <StatCard icon={<IconCalendar />} tone="pri" label="Study block" value={studyItems.length} hint="өнөөдөр" testId="stat-blocks" />
            <StatCard icon={<IconClock />} tone="blu" label="Төлөвлөсөн цаг" value={`${plannedH} цаг`} hint="блок + ачаалал" />
            <StatCard
              icon={<IconCheck />} tone="grn" label="Өчигдрийн гүйцэтгэл" value={`${yday.rate}%`}
              hint={`${yday.done}/${yday.total} блок дууссан`} testId="stat-rate"
            />
          </div>

          <section className="card" aria-labelledby="sched">
            <div className="between wrap">
              <h2 id="sched">Өнөөдрийн хуваарь</h2>
              {studyItems.length > 0 && (
                <Badge tone={studyDone === studyItems.length ? 'grn' : 'pri'}>
                  {studyDone}/{studyItems.length} Study block дууссан
                </Badge>
              )}
            </div>
            {items.length === 0 ? (
              <EmptyState title="Өнөөдөр төлөвлөгөө алга.">
                <Link className="btn pri sm" to="/tasks/new">Даалгавар нэмэх</Link>
              </EmptyState>
            ) : (
              <ul className="list" data-testid="schedule">
                {items.map((i) => {
                  const done = i.block?.status === 'done';
                  return (
                    <li key={i.key} className={'row-item' + (done ? ' m02-done' : '')}>
                      <span className="time">{i.start} – {i.end}</span>
                      <span className={`bar ${i.tone}`} />
                      <div className="grow"><strong>{i.title}</strong><p className="muted sm">{i.sub}</p></div>
                      <Badge tone={done ? 'grn' : i.tone}>{i.tag}</Badge>
                      {i.block && !done && (
                        <>
                          <Link className="btn ghost sm" to={`/focus-timer?task=${i.block.taskId}&block=${i.block.id}`}>Эхлүүлэх</Link>
                          <button type="button" className="btn ghost sm" onClick={() => actions.updateBlock(i.block.id, { status: 'done' })}>
                            Дууссан
                          </button>
                        </>
                      )}
                      {done && (
                        <button
                          type="button"
                          className="btn ghost sm"
                          aria-label={`${i.title}: дуусаагүй болгох`}
                          onClick={() => actions.updateBlock(i.block.id, { status: 'scheduled' })}
                        >
                          Буцаах
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <section className="card" aria-labelledby="load">
            <div className="between"><h2 id="load">Долоо хоногийн ачаалал (цаг)</h2><span className="muted sm">Нийт {total} цаг</span></div>
            <WorkloadChart data={workload} today={TODAY} />
          </section>
        </div>

        <div className="stack">
          <section className="card center" aria-label="Timely аватар">
            <CatCompanion items={equipped} size={150} meters />
            <h2>Timely · Level {level.level}</h2>
            <Progress value={level.progress} max={level.required} />
            <p className="muted sm">Дараагийн түвшин хүртэл {level.required - level.progress} оноо</p>
            <p className="muted sm">Сүүлийн focus streak: {latestStreak} өдөр · нэг өдөр өнжих grace-тэй</p>
            {equipped.length > 0 ? (
              <div className="chips">{equipped.map((i) => <Badge key={i.id} tone="amb">{i.name}</Badge>)}</div>
            ) : (
              <Link className="btn ghost sm" to="/gamification/shop">Дэлгүүр рүү очих</Link>
            )}
          </section>

          <section className="card" aria-labelledby="yday">
            <h2 id="yday">Өчигдрийн гүйцэтгэл</h2>
            {!hasYesterday ? (
              <p className="muted sm">Өчигдөр бүртгэгдсэн гүйцэтгэл алга. Focus Timer ашиглаж эхэлмэгц энд харагдана.</p>
            ) : (
              <>
                <div className="metric"><span>Study block</span><strong>{yday.done} / {yday.total}</strong></div>
                <Progress value={yday.done} max={Math.max(1, yday.total)} />
                <div className="metric"><span>Focus хугацаа</span><strong>{yday.minutes} мин</strong></div>
                <Progress value={yday.minutes} max={FOCUS_GOAL_MIN} tone="blu" />
                <div className="metric"><span>Авсан оноо</span><strong>+{yday.points}</strong></div>
                <Progress value={yday.points} max={POINTS_GOAL} tone="amb" />
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}