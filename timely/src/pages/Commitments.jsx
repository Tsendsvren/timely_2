
import { useState } from 'react';
import { useApp } from '../store/AppContext.jsx';
import {
  PageHeader,
  EmptyState,
  Badge,
  Field,
  Input,
  Segmented,
  CTYPE,
} from '../components/ui.jsx';
import { validateCommitment } from '../lib/validate.js';
import { DAY_NAMES, durationMin } from '../lib/dates.js';

const BLANK = {
  title: '',
  type: 'habit',
  days: [],
  start: '18:00',
  end: '19:30',
};

export default function Commitments() {
  const { mine, actions } = useApp();

  const [v, setV] = useState(BLANK);
  const [editId, setEditId] = useState(null);
  const [err, setErr] = useState({});
  const [msg, setMsg] = useState('');

  const commitments = mine?.commitments ?? [];

  const set = (key, value) => {
    setV((prev) => ({ ...prev, [key]: value }));
  };

  // Давтагдах өдрийг сонгох, сонголтыг болиулах
  const toggleDay = (day) => {
    set(
      'days',
      v.days.includes(day)
        ? v.days.filter((d) => d !== day)
        : [...v.days, day]
    );
  };

  // Төрөл тус бүрийн долоо хоногийн нийт цаг
  const hours = (type) => {
    const minutes = commitments
      .filter((c) => c.type === type)
      .reduce(
        (total, c) =>
          total + durationMin(c) * c.days.length,
        0
      );

    return Math.round((minutes / 60) * 10) / 10;
  };

  // CREATE болон UPDATE
  const submit = (e) => {
    e.preventDefault();

    const errors = validateCommitment(v);
    setErr(errors);
    setMsg('');

    if (Object.keys(errors).length > 0) {
      return;
    }

    const result = editId
      ? actions.updateCommitment(editId, v)
      : actions.addCommitment(v);

    if (result.error) {
      setMsg(result.error);
      return;
    }

    setMsg(
      editId
        ? 'Өөрчлөлт хадгалагдлаа'
        : 'Ачаалал нэмэгдлээ'
    );

    setV({ ...BLANK, days: [] });
    setEditId(null);
    setErr({});
  };

  // Засах горимд шилжих
  const edit = (c) => {
    setEditId(c.id);

    setV({
      title: c.title,
      type: c.type,
      days: [...c.days],
      start: c.start,
      end: c.end,
    });

    setErr({});
    setMsg('');
  };

  // DELETE
  const remove = (id) => {
    const result = actions.deleteCommitment(id);

    if (result.error) {
      setMsg(result.error);
      return;
    }

    if (editId === id) {
      setEditId(null);
      setV({ ...BLANK, days: [] });
      setErr({});
    }

    setMsg('Ачаалал устгагдлаа');
  };

  // Засах горимыг цуцлах
  const cancelEdit = () => {
    setEditId(null);
    setV({ ...BLANK, days: [] });
    setErr({});
    setMsg('');
  };

  return (
    <main className="page" data-testid="page-commitments">
      <PageHeader
        title="Гадуурх ачаалал & Дадал"
        sub="Ажил, клуб, тогтмол дадлаа бүртгэж төлөвлөгөөнд тусгана"
      />

      <div className="two-col wide-left">
        <div className="stack">
          {/* Долоо хоногийн нийт цагийн статистик */}
          <div className="stats">
            {Object.entries(CTYPE).map(([key, [label]]) => (
              <div key={key} className="card stat">
                <span className="muted sm">
                  {label} (7 хоног)
                </span>

                <strong data-testid={`hours-${key}`}>
                  {hours(key)} цаг
                </strong>
              </div>
            ))}
          </div>

          {/* Бүртгэлтэй ачааллын жагсаалт */}
          <section className="card" aria-labelledby="cl">
            <h2 id="cl">Бүртгэлтэй ачаалал</h2>

            {commitments.length === 0 ? (
              <EmptyState title="Гадуурх ачаалал бүртгээгүй байна.">
                Ажил, клуб, дадлаа нэмээрэй.
              </EmptyState>
            ) : (
              <ul
                className="list"
                data-testid="commitment-list"
              >
                {commitments.map((c) => (
                  <li
                    key={c.id}
                    className="row-item"
                    data-testid="commitment-item"
                  >
                    <div className="grow">
                      <strong>{c.title}</strong>

                      <p className="muted sm">
                        {c.days
                          .map((d) => DAY_NAMES[d])
                          .join(', ')}
                        {' · '}
                        {c.start} – {c.end}
                      </p>
                    </div>

                    <Badge tone={CTYPE[c.type]?.[1] ?? 'pri'}>
                      {CTYPE[c.type]?.[0] ?? c.type}
                    </Badge>

                    <button
                      type="button"
                      className="btn ghost sm"
                      aria-label={`${c.title} засах`}
                      onClick={() => edit(c)}
                    >
                      Засах
                    </button>

                    <button
                      type="button"
                      className="btn ghost sm"
                      aria-label={`${c.title} устгах`}
                      onClick={() => remove(c.id)}
                    >
                      Устгах
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Ачаалал нэмэх болон засах форм */}
        <form
          className="card form"
          onSubmit={submit}
          noValidate
          data-testid="commitment-form"
        >
          <h2>
            {editId
              ? 'Ачаалал засах'
              : 'Шинэ ачаалал нэмэх'}
          </h2>

          {msg && (
            <p
              className="notice"
              role="status"
              data-testid="commit-msg"
            >
              {msg}
            </p>
          )}

          <Field
            label="Нэр"
            name="title"
            error={err.title}
          >
            <Input
              name="title"
              value={v.title}
              onChange={(e) =>
                set('title', e.target.value)
              }
              error={err.title}
              placeholder="Жишээ: Бокс дасгал"
            />
          </Field>

          <Field
            label="Төрөл"
            name="type"
            error={err.type}
          >
            <Segmented
              name="type"
              value={v.type}
              onChange={(value) =>
                set('type', value)
              }
              options={[
                ['job', 'Ажил'],
                ['club', 'Клуб'],
                ['habit', 'Дадал'],
              ]}
            />
          </Field>

          <Field
            label="Давтагдах өдрүүд"
            name="days"
            error={err.days}
          >
            <div
              className="chips"
              role="group"
              aria-label="Өдрүүд"
            >
              {DAY_NAMES.map((day, index) => (
                <button
                  type="button"
                  key={day}
                  aria-pressed={v.days.includes(index)}
                  className={
                    'chip' +
                    (v.days.includes(index) ? ' on' : '')
                  }
                  data-testid={`day-${index}`}
                  onClick={() => toggleDay(index)}
                >
                  {day}
                </button>
              ))}
            </div>
          </Field>

          <div className="row">
            <Field
              label="Эхлэх"
              name="start"
              error={err.start}
            >
              <Input
                name="start"
                type="time"
                value={v.start}
                onChange={(e) =>
                  set('start', e.target.value)
                }
                error={err.start}
              />
            </Field>

            <Field
              label="Дуусах"
              name="end"
              error={err.end}
            >
              <Input
                name="end"
                type="time"
                value={v.end}
                onChange={(e) =>
                  set('end', e.target.value)
                }
                error={err.end}
              />
            </Field>
          </div>

          <div className="form-actions">
            {editId && (
              <button
                type="button"
                className="btn ghost"
                onClick={cancelEdit}
              >
                Болих
              </button>
            )}

            <button
              className="btn pri"
              type="submit"
              data-testid="submit"
            >
              Хадгалах
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
