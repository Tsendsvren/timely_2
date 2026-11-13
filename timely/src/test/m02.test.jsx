import { describe, it, expect } from 'vitest';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './helpers.jsx';

const times = (list) => within(list).getAllByRole('listitem').map((li) => li.textContent.slice(0, 5));

describe('TML-DASH — Dashboard', () => {
  it('S1: өнөөдрийн хуваарь цагаар эрэмбэлэгдсэн', () => {
    renderApp('/', 'U01');
    const t = times(screen.getByTestId('schedule'));
    expect(t.length).toBeGreaterThan(1);
    expect([...t].sort()).toEqual(t);
  });

  it('S2: шинэ хэрэглэгчид хоосон төлөв харагдана', async () => {
    renderApp('/authenticate', null);
    await userEvent.click(screen.getByTestId('auth-mode-signup'));
    await userEvent.type(screen.getByTestId('field-name'), 'Тэмүүлэн');
    await userEvent.type(screen.getByTestId('field-email'), 'temuulen@must.edu.mn');
    await userEvent.type(screen.getByTestId('field-password'), 'Secret123');
    await userEvent.type(screen.getByTestId('field-confirm'), 'Secret123');
    await userEvent.click(screen.getByTestId('submit'));
    await screen.findByTestId('page-dashboard');
    expect(screen.queryByTestId('schedule')).not.toBeInTheDocument();
    expect(screen.getByText('Өнөөдөр төлөвлөгөө алга.')).toBeInTheDocument();
    expect(screen.getByTestId('stat-blocks')).toHaveTextContent('0');
    expect(screen.getByTestId('workload')).toHaveTextContent('ачаалал алга');
  });

  it('S3: токенгүй хандвал /authenticate руу шилжинэ', () => {
    renderApp('/', null);
    expect(screen.getByTestId('page-authenticate')).toBeInTheDocument();
  });

  it('S4: Study block-ийг дууссан гэж тэмдэглэж, буцааж болно', async () => {
    renderApp('/', 'U01');
    expect(screen.getByText('0/2 Study block дууссан')).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole('button', { name: 'Дууссан' })[0]);
    expect(screen.getByText('1/2 Study block дууссан')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /дуусаагүй болгох/ }));
    expect(screen.getByText('0/2 Study block дууссан')).toBeInTheDocument();
  });
});

describe('TML-PLAN — Planner', () => {
  it('S1: 7 хоногийн календарьт хичээл, commitment харагдана', () => {
    renderApp('/planner', 'U01');
    const cal = screen.getByTestId('week-calendar');
    expect(within(cal).getAllByRole('heading', { level: 3 })).toHaveLength(7);
    expect(within(cal).getAllByText('Алгоритм').length).toBeGreaterThan(0);
    expect(within(cal).getAllByText('Робот клубын уулзалт').length).toBeGreaterThan(0);
  });

  it('S4: шинэ хэрэглэгчид төлөвлөгөөний хоосон төлөв харагдана', async () => {
    renderApp('/authenticate', null);
    await userEvent.click(screen.getByTestId('auth-mode-signup'));
    await userEvent.type(screen.getByTestId('field-name'), 'Сараа');
    await userEvent.type(screen.getByTestId('field-email'), 'saraa@must.edu.mn');
    await userEvent.type(screen.getByTestId('field-password'), 'Secret123');
    await userEvent.type(screen.getByTestId('field-confirm'), 'Secret123');
    await userEvent.click(screen.getByTestId('submit'));
    await screen.findByTestId('page-dashboard');
    await userEvent.click(screen.getAllByRole('link', { name: /Цаг төлөвлөгч/ })[0]);
    await screen.findByTestId('page-planner');
    expect(screen.queryByTestId('week-calendar')).not.toBeInTheDocument();
    expect(screen.getByText(/Одоогоор төлөвлөгөө алга/)).toBeInTheDocument();
  });

  it('[Дахин төлөвлөх] сул цагийг дахин тооцоолж мэдэгдэнэ', async () => {
    renderApp('/planner', 'U01');
    await userEvent.click(screen.getByTestId('replan'));
    expect(screen.getByTestId('planner-msg')).toHaveTextContent(/Сул цагийг дахин тооцлоо|блок шилжлээ/);
  });
});
