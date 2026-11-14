import { DAY_NAMES, weekday } from '../lib/dates.js';

/**
 * suggestions: [{ taskId, date, start, end, score }]  — scheduler.suggestSlots-ийн үр дүн
 * titleOf: (taskId) => даалгаврын нэр
 * onAdd: (suggestion) => void  — [Нэмэх] дарахад
 * emptyText: санал байхгүй үед харуулах текст
 */
export default function SuggestionStrip({ suggestions, titleOf, onAdd, emptyText }) {
  return (
    <section className="card" aria-labelledby="sug">
      <h2 id="sug">Санал болгосон Study block</h2>
      {suggestions.length === 0 ? (
        <p className="muted" data-testid="no-suggestions">{emptyText}</p>
      ) : (
        <ul className="chips-row" data-testid="suggestions">
          {suggestions.map((s) => (
            <li key={s.taskId + s.date + s.start} className="suggest">
              <div>
                <strong>{DAY_NAMES[weekday(s.date)]} {s.start}–{s.end}</strong>
                <p className="muted sm">{titleOf(s.taskId)} · {Math.round(s.score * 100)}%</p>
              </div>
              <button type="button" className="btn pri sm" onClick={() => onAdd(s)}>Нэмэх</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
