import { useState } from 'react';
import { useApp } from '../store/AppContext.jsx';
import { PageHeader, EmptyState, Field, Input, Progress } from '../components/ui.jsx';
import { calcGrade, neededExam } from '../lib/gradeCalc.js';
import { validateBreakdown, validateCourse, GRADE_MAX } from '../lib/validate.js';
import WhatIfSlider from '../components/WhatIfSlider.jsx';

export default function GradesPage() {
  const { mine, actions } = useApp();
  const [selected, setSelected] = useState(() => ({
    id: mine.grades[0]?.id || '',
    breakdown: null,
    exam: null,
  }));
  const id = selected.id;
  const g = mine.grades.find((x) => x.id === id) || mine.grades[0];
  const b = g
    ? selected.id === g.id && selected.breakdown
      ? selected.breakdown
      : { attendance: g.attendance, lab: g.lab, quiz: g.quiz }
    : null;
  const exam = g && selected.id === g.id && selected.exam !== null
    ? selected.exam
    : g?.exam ?? 24;
  const [err, setErr] = useState({});
  const [msg, setMsg] = useState('');
  const [add, setAdd] = useState({ courseName: '', credits: '3' });
  const [addErr, setAddErr] = useState({});

  const submitAdd = (e) => {
    e.preventDefault();
    const errors = validateCourse(add);
    setAddErr(errors);
    if (Object.keys(errors).length) return;
    const result = actions.addGrade(add);
    if (result.error) {
      setAddErr({ [result.field || 'courseName']: result.error });
      return;
    }
    setSelected({
      id: result.grade.id,
      breakdown: { attendance: 0, lab: 0, quiz: 0 },
      exam: 24,
    });
    setAdd({ courseName: '', credits: '3' });
    setErr({});
    setMsg('');
  };

  const save = () => {
    const errors = validateBreakdown({ ...b, exam });
    setErr(errors);
    if (Object.keys(errors).length) return;
    actions.updateGrade(g.id, {
      attendance: Number(b.attendance),
      lab: Number(b.lab),
      quiz: Number(b.quiz),
      exam: Number(exam),
    });
    setMsg('Хадгалагдлаа');
  };

  const valid = b && Object.keys(validateBreakdown({ ...b, exam })).length === 0;
  const result = valid ? calcGrade(b, exam) : null;

  return (
    <main className="page" data-testid="page-grades">
      <PageHeader title='Дүнгийн "What-if" тооцоолуур' sub="Хичээл бүрийн 70 оноо (ирц, лаб, сорил) + 30 оноо (шалгалт)">
        {mine.grades.length > 0 && (
          <select aria-label="Хичээл сонгох" data-testid="course-select" value={g?.id || ''} onChange={(e) => { setSelected({ id: e.target.value, breakdown: null, exam: null }); setErr({}); setMsg(''); }}>
            {mine.grades.map((course) => <option key={course.id} value={course.id}>{course.courseName} · {course.credits} кр</option>)}
          </select>
        )}
      </PageHeader>
      <div className="two-col wide-left">
        <div className="stack">
          {!g || !b ? (
            <EmptyState title="Хичээл нэмээгүй байна">Доорх маягтаар эхний хичээлээ нэмнэ үү.</EmptyState>
          ) : (
            <section className="card form" aria-labelledby="bd">
              <div className="between">
                <h2 id="bd">70 онооны задаргаа — {g.courseName}</h2>
                <button className="btn ghost sm" onClick={() => { const next = mine.grades.find((course) => course.id !== g.id); actions.deleteGrade(g.id); setSelected({ id: next?.id || '', breakdown: null, exam: null }); setErr({}); setMsg(''); }} data-testid="delete-course">Хичээл устгах</button>
              </div>
              {err.breakdown && <p className="error" role="alert" data-testid="error-breakdown">{err.breakdown}</p>}
              {[
                ['attendance', 'Ирц'],
                ['lab', 'Лабораторийн ажил'],
                ['quiz', 'Сорил / Бие даалт'],
              ].map(([key, label]) => (
                <div key={key} className="grade-row">
                  <Field label={`${label} (дээд ${GRADE_MAX[key]})`} name={key} error={err[key]}>
                    <Input name={key} type="number" value={b[key]} onChange={(e) => { setSelected((current) => ({ ...current, breakdown: { ...b, [key]: e.target.value } })); setMsg(''); }} error={err[key]} />
                  </Field>
                  <Progress value={Number(b[key]) || 0} max={GRADE_MAX[key]} />
                </div>
              ))}
              <WhatIfSlider value={exam} onChange={(value) => setSelected((current) => ({ ...current, exam: value }))} error={err.exam} />
              <div className="form-actions">
                {msg && <span className="notice" role="status" data-testid="grade-msg">{msg}</span>}
                <button className="btn pri" onClick={save} data-testid="save-grade">Хадгалах</button>
              </div>
            </section>
          )}
          <form className="card form" onSubmit={submitAdd} noValidate data-testid="course-form">
            <h2>Хичээл нэмэх</h2>
            <div className="row">
              <Field label="Хичээлийн нэр" name="courseName" error={addErr.courseName}>
                <Input name="courseName" value={add.courseName} onChange={(e) => setAdd({ ...add, courseName: e.target.value })} error={addErr.courseName} />
              </Field>
              <Field label="Кредит" name="credits" error={addErr.credits}>
                <Input name="credits" type="number" value={add.credits} onChange={(e) => setAdd({ ...add, credits: e.target.value })} error={addErr.credits} />
              </Field>
            </div>
            <div className="form-actions"><button className="btn pri" type="submit">Нэмэх</button></div>
          </form>
        </div>
        <div className="stack">
          <section className="card center total" aria-label="Нийт дүн">
            <span className="muted sm">Нийт дүн (таамаглал)</span>
            <strong className="big" data-testid="total">{result ? result.total : '—'}</strong>
            <span className="badge pri" data-testid="letter">{result ? `Үсгэн дүн: ${result.letter} · ${result.gradePoint.toFixed(1)}` : 'Оноогоо шалгана уу'}</span>
          </section>
          {b && (
            <section className="card" aria-labelledby="nd">
              <h2 id="nd">Зорилтот дүнд хүрэхэд</h2>
              <ul className="list" data-testid="needed">
                {neededExam(b).map((item) => (
                  <li key={`${item.letter}-${item.gradePoint}`} className="row-item">
                    <strong>{item.letter} · {item.gradePoint.toFixed(1)} ({item.min}+)</strong>
                    <span className="grow" />
                    <span>{item.possible ? `Шалгалтаас ${item.exam} / 30` : 'Боломжгүй'}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
