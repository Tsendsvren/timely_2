import { useEffect, useState } from 'react';
import { validateTask } from '../lib/validate.js';
import '../styles/m03.css';

const KINDS = [['lab', 'Лаб'], ['quiz', 'Сорил'], ['assignment', 'Бие даалт']];
const PRIORITIES = [['high', 'Өндөр'], ['med', 'Дунд'], ['low', 'Бага']];

export default function TaskForm({ initial, submitLabel = 'Хадгалах', today, allowPast = false, onSubmit, onDelete, onCancel }) {
  const [v, setV] = useState({
    title: '', course: '', kind: 'assignment', deadline: '',
    estimatedMinutes: '60', priority: 'med', notes: '', ...initial,
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!confirming) return undefined;
    const onKey = (e) => e.key === 'Escape' && setConfirming(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirming]);

  const set = (k) => (e) => setV((p) => ({ ...p, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setFormError('');
    const errs = validateTask(v, { today, allowPast });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = onSubmit(v);
    if (res?.error) {
      if (res.field) setErrors({ [res.field]: res.error });
      else setFormError(res.error);
    }
  };

  const err = (k) => errors[k] && <p role="alert" className="error">{errors[k]}</p>;

  return (
    <>
      <form onSubmit={submit} noValidate data-testid="task-form" className="card form">
        <div className="field">
          <label htmlFor="tf-title">Гарчиг</label>
          <input id="tf-title" value={v.title} onChange={set('title')} aria-invalid={!!errors.title} />
          {err('title')}
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="tf-course">Хичээл</label>
            <input id="tf-course" value={v.course} onChange={set('course')} />
          </div>
          <div className="field">
            <label htmlFor="tf-kind">Төрөл</label>
            <select id="tf-kind" value={v.kind} onChange={set('kind')}>
              {KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor="tf-deadline">Deadline</label>
            <input id="tf-deadline" type="date" value={v.deadline} onChange={set('deadline')} aria-invalid={!!errors.deadline} />
            {err('deadline')}
          </div>
          <div className="field">
            <label htmlFor="tf-minutes">Хугацаа (минут)</label>
            <input id="tf-minutes" inputMode="numeric" value={v.estimatedMinutes} onChange={set('estimatedMinutes')} aria-invalid={!!errors.estimatedMinutes} />
            {err('estimatedMinutes')}
          </div>
          <div className="field">
            <label htmlFor="tf-priority">Ач холбогдол</label>
            <select id="tf-priority" value={v.priority} onChange={set('priority')} aria-invalid={!!errors.priority}>
              {PRIORITIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
            {err('priority')}
          </div>
        </div>

        <div className="field">
          <label htmlFor="tf-notes">Тэмдэглэл</label>
          <textarea id="tf-notes" rows={3} value={v.notes} onChange={set('notes')} />
        </div>

        {formError && <p role="alert" className="banner-error">{formError}</p>}

        <div className="form-actions">
          {onDelete && (
            <button type="button" className="btn ghost" onClick={() => setConfirming(true)}>Устгах</button>
          )}
          <span className="spacer" />
          {onCancel && <button type="button" className="btn ghost" onClick={onCancel}>Болих</button>}
          <button type="submit" className="btn pri">{submitLabel}</button>
        </div>
      </form>

      {confirming && (
        <div className="m03-overlay" role="presentation" onClick={() => setConfirming(false)}>
          <div
            className="m03-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="del-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="del-title">Даалгавар устгах уу?</h2>
            <p className="muted">
              «{v.title || 'Нэргүй даалгавар'}» устгагдах ба холбоотой study block-ууд мөн
              planner-аас арилна. Энэ үйлдлийг буцаах боломжгүй.
            </p>
            <div className="form-actions">
              <button type="button" className="btn ghost" onClick={() => setConfirming(false)}>Болих</button>
              <button type="button" className="btn danger" onClick={onDelete}>Тийм, устгах</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}