import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toMin } from '../lib/dates.js';
import { DAY_START, DAY_END } from '../lib/scheduler.js';

const PX_PER_HOUR = 56;

const LEGEND = [
  ['Хичээл', 'blu'],
  ['Study block', 'pri'],
  ['Дууссан', 'grn'],
  ['Гадуурх ачаалал', 'amb'],
  ['Хоцорсон', 'red'],
];

/**
 * days: [{ d, n, isToday, items: [{ key, s, e, t, tone, to? }] }]
 */
export default function WeekCalendar({ days }) {
  const todayIdx = days.findIndex((d) => d.isToday);
  // Тор нь 08:00–21:00, гэхдээ түүнээс гадуурх үйл ажиллагаа байвал (жишээ нь 07:00 гүйлт) өргөснө
  const all = days.flatMap((d) => d.items);
  const gridStart = Math.min(DAY_START, ...all.map((it) => Math.floor(toMin(it.s) / 60) * 60));
  const gridEnd = Math.max(DAY_END, ...all.map((it) => Math.ceil(toMin(it.e) / 60) * 60));
  const HEIGHT = ((gridEnd - gridStart) / 60) * PX_PER_HOUR;
  const HOURS = Array.from({ length: (gridEnd - gridStart) / 60 + 1 }, (_, i) => gridStart + i * 60);
  const yOf = (m) => ((Math.min(gridEnd, Math.max(gridStart, m)) - gridStart) / 60) * PX_PER_HOUR;
  const [active, setActive] = useState(Math.max(0, todayIdx));

  return (
    <section className="card" data-testid="week-calendar" aria-label="7 хоногийн календарь">
      <div className="m02-daytabs" role="tablist" aria-label="Өдөр сонгох">
        {days.map((day, i) => (
          <button key={day.d} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)}>
            {day.n}
            <b>{day.d.slice(8)}</b>
          </button>
        ))}
      </div>

      <div className="m02-cal-scroll">
        <div className="m02-cal-grid">
          <div className="m02-cal-spacer" />
          {days.map((day) => (
            <h3 key={day.d} className={'m02-cal-dayhead' + (day.isToday ? ' is-today' : '')}>
              <small>{day.n}</small>
              <b>{day.d.slice(8)}</b>
            </h3>
          ))}

          <div className="m02-cal-times" style={{ height: HEIGHT }} aria-hidden="true">
            {HOURS.map((m) => (
              <span key={m} className="m02-cal-time" style={{ top: yOf(m) }}>
                {String(m / 60).padStart(2, '0')}:00
              </span>
            ))}
          </div>

          {days.map((day, i) => (
            <div
              key={day.d}
              className={'m02-cal-col' + (day.isToday ? ' is-today' : '') + (i === active ? ' is-active' : '')}
              style={{ height: HEIGHT }}
            >
              {HOURS.slice(1, -1).map((m) => (
                <div key={m} className="m02-cal-line" style={{ top: yOf(m) }} />
              ))}
              {day.items.length === 0 && <p className="m02-cal-free">Сул</p>}

              {day.items.map((it) => {
                const top = yOf(toMin(it.s));
                const h = Math.max(24, yOf(toMin(it.e)) - top - 3);
                const body = (
                  <>
                    <strong className="m02-ev-title">{it.t}</strong>
                    {h >= 40 && <span className="m02-ev-time">{it.s}–{it.e}</span>}
                  </>
                );
                const props = {
                  className: `m02-ev ${it.tone}`,
                  style: { top: top + 1, height: h },
                  title: `${it.t} ${it.s}–${it.e}`,
                };
                return it.to ? (
                  <Link key={it.key} to={it.to} {...props}>{body}</Link>
                ) : (
                  <div key={it.key} {...props}>{body}</div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="m02-legend">
        {LEGEND.map(([label, tone]) => (
          <span key={tone}><i style={{ background: `var(--${tone})` }} />{label}</span>
        ))}
      </div>
    </section>
  );
}
