import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import TimerRing from '../components/TimerRing.jsx';
import CatCompanion from '../components/CatCompanion.jsx';
import { timerReaction } from '../lib/companion/index.js';

export default function FocusTimer() {
  const { mine, profile, data, actions } = useApp();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const running = mine.sessions.find((s) => s.status === 'running');
  const openTasks = mine.tasks.filter((t) => t.status !== 'completed');

  const [taskId, setTaskId] = useState(params.get('task') || openTasks[0]?.id || '');
  const blockId = params.get('block');
  const [planned, setPlanned] = useState('25');
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running?.id]);

  const start = () => {
    const res = actions.startFocus({ taskId, plannedMinutes: planned, blockId });
    setError(res.error || '');
  };

  const stop = () => {
    const res = actions.stopFocus(running.id);
    if (res.ok) navigate('/', { state: { earned: res.pointsEarned } });
    else setError(res.error);
  };

  const total = (running ? running.plannedMinutes : Number(planned) || 25) * 60;
  const elapsed = running ? Math.max(0, Math.floor((now - running.startedAt) / 1000)) : 0;
  const runningTask = running && mine.tasks.find((t) => t.id === running.taskId);
  const equipped = (profile?.equipped || []).map((id) => data.shopItems.find((i) => i.id === id)).filter(Boolean);
  // Хамт ажиллах: timer явж байх үед муур хажууд ном уншиж, үе шат бүрт хариу үйлдэл үзүүлнэ
  const together = running ? timerReaction({ elapsed, total, seed: running.id }) : null;

  return (
    <section className="page" data-testid="page-focus-timer">
      <div className="page-header">
        <div>
          <h1>Focus Timer</h1>
          <p className="muted">5+ focus минут тутам 1 оноо (өдөрт 240 хүртэл). Төлөвлөсөн хугацаагаа биелүүлбэл +20%, өдөрт 25+ мин бол streak bonus.</p>
        </div>
      </div>

      <div className="card timer-card center">
        <CatCompanion items={equipped} size={130} override={together} hideNextStep />
        <TimerRing elapsed={elapsed} total={total} />

        {running ? (
          <>
            <p className="muted">Даалгавар: <strong>{runningTask?.title ?? '—'}</strong></p>
            <div className="actions controls">
              <button type="button" className="btn danger" onClick={stop}>Stop</button>
            </div>
          </>
        ) : (
          <>
            <div className="row" style={{ width: '100%' }}>
              <div className="field">
                <label htmlFor="ft-task">Даалгавар</label>
                <select id="ft-task" value={taskId} disabled={Boolean(blockId)} onChange={(e) => setTaskId(e.target.value)}>
                  {openTasks.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ft-min">Төлөвлөсөн хугацаа (минут)</label>
                <input id="ft-min" inputMode="numeric" value={planned} onChange={(e) => setPlanned(e.target.value)} />
              </div>
            </div>
            <div className="actions controls">
              <button type="button" className="btn pri" onClick={start} disabled={!taskId}>Start</button>
            </div>
          </>
        )}
        {error && <p role="alert" className="banner-error">{error}</p>}
      </div>
    </section>
  );
}