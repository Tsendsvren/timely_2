import { act, renderHook, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppProvider, useApp } from '../store/AppContext.jsx';
import { getCompanionState } from '../lib/companion/index.js';
import { dateFromTimestamp } from '../lib/rewards.js';
import { TODAY } from '../lib/dates.js';
import { renderApp } from './helpers.jsx';

// Өдрийн 14:00: seed-ийн 11:00–12:30 блок хоцорсон, 19:30-ынх хараахан биш.
const AFTERNOON = new Date(`${TODAY}T14:00:00`).getTime();

beforeEach(() => { vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(AFTERNOON); });
afterEach(() => vi.useRealTimers());

describe('CatCompanion — Dashboard', () => {
  it('Dashboard дээр муур, яриа бөмбөлөг, 3 заагч харагдана', async () => {
    renderApp('/', 'U01');
    await screen.findByTestId('page-dashboard');
    expect(screen.getByTestId('companion')).toBeInTheDocument();
    expect(screen.getByTestId('companion-line').textContent.length).toBeGreaterThan(5);
    const meters = within(screen.getByTestId('companion-meters'));
    expect(meters.getByText('Сэтгэл')).toBeInTheDocument();
    expect(meters.getByText('Эрч хүч')).toBeInTheDocument();
    expect(meters.getByText('Дотно байдал')).toBeInTheDocument();
  });

  it('төлөвлөсөн блок хоцорвол гунигтай болж, дараагийн алхмыг санал болгоно', async () => {
    renderApp('/', 'U01');
    await screen.findByTestId('page-dashboard');
    const root = screen.getByTestId('companion');
    expect(root).toHaveAttribute('data-emotion', 'sad');
    expect(screen.getByTestId('companion-line')).toHaveTextContent('Өгөгдлийн сангийн лаб 3');
    expect(screen.getByTestId('companion-next')).toHaveAttribute('href', '/focus-timer?task=T01');
    expect(screen.getByTestId('companion-reasons')).toHaveTextContent('1 блок хоцорсон');
  });

  it('блок дуусгахад муур сэргэнэ (гуниг арилна)', async () => {
    renderApp('/', 'U01');
    await screen.findByTestId('page-dashboard');
    expect(screen.getByTestId('companion')).toHaveAttribute('data-emotion', 'sad');
    await userEvent.click(screen.getAllByRole('button', { name: 'Дууссан' })[0]);
    expect(screen.getByTestId('companion')).not.toHaveAttribute('data-emotion', 'sad');
  });

  it('дээр нь дарвал өөр үг хэлнэ, × дарвал бөмбөлөг нуугдана', async () => {
    renderApp('/', 'U01');
    await screen.findByTestId('page-dashboard');
    const first = screen.getByTestId('companion-line').textContent;
    await userEvent.click(screen.getByTestId('companion-cat'));
    expect(screen.getByTestId('companion-line').textContent).not.toBe(first);

    await userEvent.click(screen.getByRole('button', { name: 'Мессежийг хаах' }));
    expect(screen.queryByTestId('companion-line')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Муур юу гэж байна?' }));
    expect(screen.getByTestId('companion-line')).toBeInTheDocument();
  });

  it('админд муур харагдахгүй', async () => {
    renderApp('/', 'U99');
    await screen.findByTestId('page-dashboard');
    expect(screen.queryByTestId('companion')).not.toBeInTheDocument();
  });
});

describe('CatCompanion — Focus Timer: хамт ажиллах', () => {
  it('Start дарахад ном уншиж эхэлж, хугацаа биелэхэд баярлан гэрэлтэнэ', async () => {
    renderApp('/focus-timer', 'U01');
    await screen.findByTestId('page-focus-timer');
    await userEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(screen.getByTestId('companion-line')).toHaveTextContent('Явцгаая');
    expect(screen.getByTestId('companion')).toHaveAttribute('data-emotion', 'happy');
    expect(screen.queryByTestId('companion-next')).not.toBeInTheDocument();

    vi.setSystemTime(AFTERNOON + 26 * 60000);
    const line = await screen.findByText(/Төлөвлөсөн хугацаа биеллээ/, {}, { timeout: 3000 });
    expect(line).toBeInTheDocument();
    expect(screen.getByTestId('companion')).toHaveAttribute('data-emotion', 'excited');
    expect(screen.getByTestId('companion').className).toContain('is-glow');
  });
});

describe('Дүн оруулахад муур хариу үйлдэл үзүүлнэ', () => {
  const wrapper = ({ children }) => <AppProvider initialUserId="U01">{children}</AppProvider>;

  it('шалгалтын оноо шинээр орох үед тэмдэглэгдэнэ, өөрчлөгдөөгүй бол тэмдэглэгдэхгүй', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => { result.current.actions.updateGrade('G01', { exam: 10 }); });
    act(() => { result.current.actions.updateGrade('G03', { exam: 27 }); });
    const g = (id) => result.current.mine.grades.find((x) => x.id === id);
    expect(g('G01').examEnteredAt).toBe(dateFromTimestamp(Date.now()));
    expect(g('G03').examEnteredAt).toBeUndefined();
  });

  it('муу дүн орвол муур тайтгаруулна, сайн дүн орвол баярлана', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const stateFor = () => getCompanionState({
      today: TODAY, realToday: dateFromTimestamp(Date.now()), hour: 10, name: 'Болормаа',
      grades: result.current.mine.grades,
    });
    act(() => { result.current.actions.updateGrade('G01', { exam: 10 }); });
    expect(stateFor().emotion).toBe('comfort');
    expect(stateFor().line).toMatch(/хэцүү|дэргэд/);
    act(() => { result.current.actions.updateGrade('G01', { exam: 30 }); });
    const s = stateFor();
    expect(s.emotion).toBe('excited');
    expect(s.glow).toBe(true);
  });
});
