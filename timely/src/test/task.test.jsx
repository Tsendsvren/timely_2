import { renderHook, act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AppProvider, useApp } from '../store/AppContext.jsx';
import { renderApp } from './helpers.jsx';
import { TODAY, addDays } from '../lib/dates.js';

const wrapper = ({ children }) => <AppProvider initialUserId="U01">{children}</AppProvider>;
const valid = { title: 'Шинэ даалгавар', course: 'Алгоритм', kind: 'lab', deadline: addDays(TODAY, 2), priority: 'med', estimatedMinutes: '60' };

describe('TML-TASK — Task CRUD', () => {
  it('U01 даалгавар нэмнэ: 201, жагсаалтад харагдана', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let res;
    act(() => { res = result.current.actions.addTask(valid); });
    expect(res.code).toBe(201);
    expect(result.current.mine.tasks.some((t) => t.id === res.task.id)).toBe(true);
  });

  it('хоосон title: 422 field=title', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    let res;
    act(() => { res = result.current.actions.addTask({ ...valid, title: '   ' }); });
    expect(res).toMatchObject({ code: 422, field: 'title', error: 'Гарчиг заавал оруулна уу' });
    expect(result.current.mine.tasks).toHaveLength(4);
  });

  it('U02 нь U01-ийн даалгаврыг засах/устгах: 403', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.actions.signup({ name: 'Бат', email: 'u2@must.edu.mn', password: 'Secret123' }); });
    let a; let b;
    act(() => { a = result.current.actions.updateTask('T01', valid); });
    act(() => { b = result.current.actions.deleteTask('T01'); });
    expect(a.code).toBe(403);
    expect(b.code).toBe(403);
    expect(result.current.data.tasks.some((t) => t.id === 'T01')).toBe(true);
  });

  it('засаж, устгана', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.actions.updateTask('T02', { ...valid, title: 'Засагдсан' }); });
    expect(result.current.mine.tasks.find((t) => t.id === 'T02').title).toBe('Засагдсан');
    act(() => { result.current.actions.deleteTask('T02'); });
    expect(result.current.mine.tasks.find((t) => t.id === 'T02')).toBeUndefined();
  });

  it('UI: хоосон title илгээхэд алдаа харагдана', async () => {
    renderApp('/tasks/new', 'U01');
    await userEvent.click(screen.getByRole('button', { name: 'Нэмэх' }));
    expect(await screen.findByText('Гарчиг заавал оруулна уу')).toBeInTheDocument();
  });

  it('UI: зөв мэдээлэл → /planner руу шилжинэ', async () => {
    renderApp('/tasks/new', 'U01');
    await userEvent.type(screen.getByLabelText('Гарчиг'), 'UI даалгавар');
    fireEvent.change(screen.getByLabelText('Deadline'), { target: { value: addDays(TODAY, 2) } });
    await userEvent.click(screen.getByRole('button', { name: 'Нэмэх' }));
    expect(await screen.findByTestId('page-planner')).toBeInTheDocument();
  });

  it('UI: даалгавар дуусгахад оноо бүртгэнэ', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(`${TODAY}T10:00:00Z`).getTime());
    renderApp('/tasks/T01', 'U01');
    fireEvent.click(screen.getByTestId('complete-task'));
    expect(screen.getByTestId('page-planner')).toBeInTheDocument();
    expect(screen.getByTestId('points-chip')).toHaveTextContent('1,290');
    vi.useRealTimers();
  });
});