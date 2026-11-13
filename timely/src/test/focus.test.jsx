import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';
import { AppProvider, useApp } from '../store/AppContext.jsx';
import { TODAY } from '../lib/dates.js';

const wrapper = ({ children }) => <AppProvider initialUserId="U01">{children}</AppProvider>;
const T0 = new Date('2026-11-01T10:00:00').getTime();

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(T0); });
afterEach(() => vi.useRealTimers());

describe('TML-TIMER — Focus Timer', () => {
  it('5+ focus минут оноо авч, төлөвлөсөн хугацааны bonus хувьтай байна', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const before = result.current.profile.points;
    let s;
    act(() => { s = result.current.actions.startFocus({ taskId: 'T01', plannedMinutes: 90 }); });
    expect(s.code).toBe(201);
    vi.setSystemTime(T0 + 54 * 60000);
    let r;
    act(() => { r = result.current.actions.stopFocus(s.session.id); });
    expect(r.code).toBe(200);
    expect(r.session.focusPointsEarned).toBe(54);
    expect(r.session.pointsEarned).toBe(59);
    expect(result.current.profile.points).toBe(before + 59);
  });

  it('төлөвлөсөн хугацаагаа биелүүлбэл 20% bonus олгоно', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let s; let r;
    act(() => { s = result.current.actions.startFocus({ taskId: 'T01', plannedMinutes: 25 }); });
    vi.setSystemTime(T0 + 25 * 60000);
    act(() => { r = result.current.actions.stopFocus(s.session.id); });
    expect(r.pointsEarned).toBe(35);
  });

  it('5 минутаас богино session оноо өгөхгүй', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let s; let r;
    act(() => { s = result.current.actions.startFocus({ taskId: 'T01', plannedMinutes: 25 }); });
    vi.setSystemTime(T0 + 4 * 60000);
    act(() => { r = result.current.actions.stopFocus(s.session.id); });
    expect(r.pointsEarned).toBe(0);
    expect(result.current.profile.points).toBe(1250);
  });

  it('өдрийн focus минутын оноог 240-өөр хязгаарлана', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let first; let second;
    act(() => { first = result.current.actions.startFocus({ taskId: 'T01', plannedMinutes: 480 }); });
    vi.setSystemTime(T0 + 200 * 60000);
    act(() => { result.current.actions.stopFocus(first.session.id); });

    act(() => { second = result.current.actions.startFocus({ taskId: 'T02', plannedMinutes: 80 }); });
    vi.setSystemTime(T0 + 260 * 60000);
    act(() => { result.current.actions.stopFocus(second.session.id); });

    expect(result.current.mine.sessions.filter((session) => session.status === 'stopped')
      .reduce((total, session) => total + session.focusPointsEarned, 0)).toBe(240);
  });

  it('төлөвлөсөн Study block-ийн 80%-ийг focus хийвэл +15 авч, давхар авахгүй', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let session;
    act(() => {
      session = result.current.actions.startFocus({ taskId: 'T01', plannedMinutes: 72, blockId: 'B01' });
    });
    vi.setSystemTime(T0 + 72 * 60000);
    act(() => { result.current.actions.stopFocus(session.session.id); });

    let first;
    act(() => { first = result.current.actions.updateBlock('B01', { status: 'done' }); });
    expect(first.pointsEarned).toBe(15);
    act(() => { result.current.actions.updateBlock('B01', { status: 'scheduled' }); });
    act(() => { result.current.actions.updateBlock('B01', { status: 'done' }); });
    expect(result.current.profile.points).toBe(1250 + 72 + 14 + 5 + 15);
  });

  it('Study block-ийн 80%-д хүрээгүй focus бол block bonus өгөхгүй', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let session;
    act(() => {
      session = result.current.actions.startFocus({ taskId: 'T01', plannedMinutes: 71, blockId: 'B01' });
    });
    vi.setSystemTime(T0 + 71 * 60000);
    act(() => { result.current.actions.stopFocus(session.session.id); });

    let completion;
    act(() => { completion = result.current.actions.updateBlock('B01', { status: 'done' }); });
    expect(completion.pointsEarned).toBe(0);
    expect(result.current.profile.pointsLog.some((entry) => entry.key === 'block:B01')).toBe(false);
  });

  it('deadline-аас өмнө task дуусгавал priority bonus авч, нэг л удаа шагнуулна', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    vi.setSystemTime(new Date(`${TODAY}T10:00:00Z`).getTime());
    let first; let second;
    act(() => { first = result.current.actions.completeTask('T01'); });
    act(() => { second = result.current.actions.completeTask('T01'); });

    expect(first.pointsEarned).toBe(40);
    expect(second.pointsEarned).toBe(0);
    expect(result.current.profile.points).toBe(1290);
  });

  it('5 идэвхтэй өдөр streak болон долоо хоногийн bonus өгнө', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    vi.setSystemTime(new Date('2026-11-02T10:00:00Z').getTime());
    const before = result.current.profile.points;

    for (let day = 0; day < 5; day += 1) {
      let session;
      act(() => { session = result.current.actions.startFocus({ taskId: 'T01', plannedMinutes: 25 }); });
      vi.setSystemTime(Date.now() + 25 * 60000);
      act(() => { result.current.actions.stopFocus(session.session.id); });
      if (day < 4) vi.setSystemTime(Date.now() + 24 * 60 * 60000);
    }

    const earned = result.current.profile.points - before;
    expect(earned).toBe(275);
    expect(result.current.profile.pointsLog.filter((entry) => entry.key?.startsWith('focus-streak:'))).toHaveLength(5);
    expect(result.current.profile.pointsLog.filter((entry) => entry.key?.startsWith('focus-week:'))).toHaveLength(1);
  });

  it('ажиллаж байхад дахин Start: 409', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let r;
    act(() => { result.current.actions.startFocus({ taskId: 'T01', plannedMinutes: 25 }); });
    act(() => { r = result.current.actions.startFocus({ taskId: 'T02', plannedMinutes: 25 }); });
    expect(r.code).toBe(409);
  });

  it('зогссон session-ийг дахин Stop: 409', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let s; let r;
    act(() => { s = result.current.actions.startFocus({ taskId: 'T01', plannedMinutes: 25 }); });
    act(() => { result.current.actions.stopFocus(s.session.id); });
    act(() => { r = result.current.actions.stopFocus(s.session.id); });
    expect(r.code).toBe(409);
  });
});