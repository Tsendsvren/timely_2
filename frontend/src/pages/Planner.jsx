import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { PageHeader, EmptyState, Badge, PRIORITY, STATUS } from '../components/ui.jsx';
import WeekCalendar from '../components/WeekCalendar.jsx';
import SuggestionStrip from '../components/SuggestionStrip.jsx';
import { TODAY, addDays, weekStart, DAY_NAMES, toMin } from '../lib/dates.js';
import { suggestSlots } from '../lib/scheduler.js';
import '../styles/m02.css';

const PAGE_SIZE = 5;
const MAX_SUGGESTIONS = 3;
const MSG_TIMEOUT_MS = 5000;

/** "2026-10-19", "2026-10-25" -> "10-р сарын 19 – 25" */
function weekLabel(from, to) {
  const [, m1, d1] = from.split('-').map(Number);
  const [, m2, d2] = to.split('-').map(Number);
  return m1 === m2 ? `${m1}-р сарын ${d1} – ${d2}` : `${m1}-р сарын ${d1} – ${m2}-р сарын ${d2}`;
}

export default function Planner() {
  const { mine, lessons, data, actions } = useApp();
  const [msg, setMsg] = useState(null); // { text, ok }
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const start = weekStart(TODAY);
  const end = addDays(start, 6);
  const title = (id) => data.tasks.find((t) => t.id === id)?.title || '';

  // Мэдэгдлийг хэдэн секундын дараа нуух
  useEffect(() => {
    if (!msg) return undefined;
    const t = setTimeout(() => setMsg(null), MSG_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [msg]);

  // ---- 7 хоногийн календарь ----
  const days = useMemo(() => {
    const titleOf = (id) => data.tasks.find((t) => t.id === id)?.title || '';
    return DAY_NAMES.map((n, i) => {
      const d = addDays(start, i);
      const items = [
        ...lessons.filter((l) => l.weekday === i).map((l) => ({ key: l.id, s: l.start, e: l.end, t: l.title, tone: 'blu' })),
        ...mine.commitments.filter((c) => c.days.includes(i)).map((c) => ({ key: c.id + d, s: c.start, e: c.end, t: c.title, tone: 'amb' })),
        ...mine.blocks.filter((b) => b.date === d).map((b) => ({
          key: b.id,
          s: b.start,
          e: b.end,
          t: (b.status === 'missed' ? 'Хоцорсон: ' : 'Study: ') + titleOf(b.taskId),
          tone: b.status === 'missed' ? 'red' : b.status === 'done' ? 'grn' : 'pri',
          to: `/tasks/${b.taskId}`,
        })),
      ].sort((a, b) => toMin(a.s) - toMin(b.s));
      return { n, d, isToday: d === TODAY, items };
    });
  }, [start, lessons, mine.commitments, mine.blocks, data.tasks]);

  // ---- Сул цагт Study block санал ----
  // Ирээдүйд товлогдсон блокгүй, дуусаагүй даалгаврууд — эдгээрт л санал хэрэгтэй
  const needsBlock = useMemo(() => {
    const hasFuture = (id) => mine.blocks.some((b) => b.taskId === id && b.status === 'scheduled' && b.date >= TODAY);
    return mine.tasks.filter((t) => t.status !== 'completed' && !hasFuture(t.id));
  }, [mine.tasks, mine.blocks]);
  const suggestions = useMemo(() => {
    const ctx = { lessons, commitments: mine.commitments, blocks: mine.blocks };
    return needsBlock
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
      .flatMap((t) => suggestSlots(t, ctx, { from: TODAY, limit: 1 }))
      .slice(0, MAX_SUGGESTIONS);
  }, [lessons, needsBlock, mine.commitments, mine.blocks]);

  // ---- Даалгаврын жагсаалт: хайлт, шүүлтүүр, хуудаслалт ----
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return mine.tasks
      .filter((t) => (status === 'all' ? true : t.status === status))
      .filter((t) => t.title.toLowerCase().includes(needle))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }, [mine.tasks, q, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const cur = Math.min(page, pages);
  const shown = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE);

  const add = (s) => {
    const r = actions.addBlock({ taskId: s.taskId, date: s.date, start: s.start, end: s.end });
    setMsg(r.error ? { text: r.error, ok: false } : { text: 'Study block нэмэгдлээ', ok: true });
  };
  // [Дахин төлөвлөх] — сул цагийг дахин тооцно (TML-PLAN).
  // Хоцорсон блок шилжүүлэх нь M04-ийн reschedule логик: AppContext-д replan нэмэгдсэн бол түүнийг дуудна.
  const replan = () => {
    const r = actions.replan?.();
    if (r?.moved) {
      setMsg({ text: `${r.moved} блок шилжлээ`, ok: true });
      return;
    }
    setMsg({
      text: suggestions.length ? `Сул цагийг дахин тооцлоо: ${suggestions.length} санал` : 'Сул цагийг дахин тооцлоо: шинэ санал алга',
      ok: true,
    });
  };

  const nothingYet = mine.tasks.length === 0 && days.every((d) => d.items.length === 0);

  return (
    <main className="page" data-testid="page-planner">
      <PageHeader title="Ухаалаг цаг төлөвлөгч" sub={`${weekLabel(start, end)} · Хатуу хуваарь + сул цагт Study block`}>
        <button type="button" className="btn ghost" onClick={replan} data-testid="replan">Дахин төлөвлөх</button>
        <Link className="btn pri" to="/tasks/new">+ Даалгавар нэмэх</Link>
      </PageHeader>

      {msg && (
        <p className={msg.ok ? 'notice' : 'banner-error'} role="status" data-testid="planner-msg">{msg.text}</p>
      )}

      {nothingYet ? (
        <section className="card">
          <EmptyState title="Одоогоор төлөвлөгөө алга. Даалгавар нэмж Study block санал аваарай.">
            <Link className="btn pri sm" to="/tasks/new">Даалгавар нэмэх</Link>
          </EmptyState>
        </section>
      ) : (
        <>
          <SuggestionStrip
            suggestions={suggestions}
            titleOf={title}
            onAdd={add}
            emptyText={
              needsBlock.length > 0
                ? 'Сул цаг олдсонгүй. Deadline эсвэл хугацааг өөрчилнө үү.'
                : 'Бүх даалгавар төлөвлөгдсөн байна. Шинэ даалгавар нэмбэл энд санал гарна.'
            }
          />

          <WeekCalendar days={days} />
        </>
      )}

      <section className="card" aria-labelledby="tl">
        <div className="between wrap">
          <h2 id="tl">Даалгаврууд</h2>
          <div className="filters">
            <input type="search" placeholder="Хайх…" aria-label="Даалгавар хайх" data-testid="task-search" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
            <select aria-label="Төлөвөөр шүүх" data-testid="task-status-filter" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">Бүгд</option>
              {Object.entries(STATUS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        </div>
        {filtered.length === 0 ? (
          <EmptyState title="Даалгавар олдсонгүй.">
            <Link className="btn pri sm" to="/tasks/new">Даалгавар нэмэх</Link>
          </EmptyState>
        ) : (
          <>
            <ul className="list" data-testid="task-list">
              {shown.map((t) => (
                <li key={t.id}>
                  <Link className="row-item" to={`/tasks/${t.id}`} data-testid="task-item">
                    <div className="grow"><strong>{t.title}</strong><p className="muted sm">Deadline: {t.deadline} · {t.actualMinutes}/{t.estimatedMinutes} мин</p></div>
                    <Badge tone={PRIORITY[t.priority][1]}>{PRIORITY[t.priority][0]}</Badge>
                    <Badge tone="gray">{STATUS[t.status]}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="pager">
              <button type="button" className="btn ghost sm" disabled={cur <= 1} onClick={() => setPage(cur - 1)} data-testid="page-prev" aria-label="Өмнөх хуудас">←</button>
              <span className="muted sm" data-testid="page-info">{cur} / {pages}</span>
              <button type="button" className="btn ghost sm" disabled={cur >= pages} onClick={() => setPage(cur + 1)} data-testid="page-next" aria-label="Дараагийн хуудас">→</button>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
