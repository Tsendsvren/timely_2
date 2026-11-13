// M02 (B242270134) — TML-PLAN-S3: давхцсан цагт Study block үүсгэх validation
import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { AppProvider, useApp } from '../store/AppContext.jsx';
import { TODAY } from '../lib/dates.js';

// AppContext-ийн утгыг тестэд авах туслах компонент
function Probe({ onReady }) {
  onReady(useApp());
  return null;
}

function setup() {
  const ref = {};
  render(
    <AppProvider initialUserId="U01">
      <Probe onReady={(app) => { ref.app = app; }} />
    </AppProvider>,
  );
  return ref;
}

describe('TML-PLAN-S3 — Study block validation', () => {
  it('хичээлтэй давхцсан цагт блок нэмэхэд алдаа гарч, record үүсэхгүй', () => {
    const ref = setup();
    const before = ref.app.mine.blocks.length;
    let r;
    // Пүрэв гаригт 08:30–10:00 Алгоритм хичээл байгаа
    act(() => { r = ref.app.actions.addBlock({ taskId: 'T01', date: TODAY, start: '09:00', end: '10:00' }); });
    expect(r.error).toMatch(/өөр үйл ажиллагаа/);
    expect(ref.app.mine.blocks).toHaveLength(before);
  });

  it('өөр Study block-тэй давхцсан цагт блок нэмэхэд алдаа гарна', () => {
    const ref = setup();
    let r;
    // B01: өнөөдөр 11:00–12:30
    act(() => { r = ref.app.actions.addBlock({ taskId: 'T02', date: TODAY, start: '11:30', end: '12:00' }); });
    expect(r.error).toBeTruthy();
  });

  it('сул цагт блок амжилттай нэмэгдэнэ', () => {
    const ref = setup();
    const before = ref.app.mine.blocks.length;
    let r;
    act(() => { r = ref.app.actions.addBlock({ taskId: 'T01', date: TODAY, start: '15:00', end: '16:00' }); });
    expect(r.ok).toBe(true);
    expect(ref.app.mine.blocks).toHaveLength(before + 1);
  });

  it('бусдын эсвэл байхгүй даалгаварт блок нэмэх боломжгүй', () => {
    const ref = setup();
    let r;
    act(() => { r = ref.app.actions.addBlock({ taskId: 'T999', date: TODAY, start: '15:00', end: '16:00' }); });
    expect(r.error).toMatch(/олдсонгүй/);
  });
});
