import { describe, it, expect, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderApp } from './helpers.jsx';
import { loadSessionUserId } from '../store/AppContext.jsx';
import { TEAM } from '../mocks/team.js';

describe('Homepage: багийн мэдээлэл (Лаб 1)', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('баг, төсөл, 5 гишүүн, оюутны код харагдана', () => {
    renderApp('/', 'U01');
    expect(screen.getByTestId('team-name')).toHaveTextContent(TEAM.teamName);
    expect(screen.getByTestId('project-name')).toBeInTheDocument();
    expect(TEAM.members).toHaveLength(5);
    TEAM.members.forEach((m) => {
      const li = screen.getByTestId(`team-member-${m.code}`);
      expect(li).toHaveTextContent(m.name);
      expect(li).toHaveTextContent(m.code);
    });
  });
});

describe('Mock session (reload/URL-ээр шууд орох)', () => {
  beforeEach(() => window.sessionStorage.clear());

  it('нэвтэрсний дараа userId хадгалагдаж, дахин ачаалахад сэргэнэ', async () => {
    const first = renderApp('/authenticate');
    fireEvent.change(screen.getByTestId('field-email'), { target: { value: 'bolormaa@must.edu.mn' } });
    fireEvent.change(screen.getByTestId('field-password'), { target: { value: 'Secret123' } });
    fireEvent.click(screen.getByTestId('submit'));
    await waitFor(() => expect(screen.getByTestId('page-dashboard')).toBeInTheDocument());
    expect(loadSessionUserId()).toBe('U01');
    first.unmount();

    renderApp('/planner', loadSessionUserId());
    expect(screen.getByTestId('page-planner')).toBeInTheDocument();
  });

  it('гарахад session устна', async () => {
    renderApp('/', 'U01');
    fireEvent.click(screen.getAllByTestId('logout')[0]);
    await waitFor(() => expect(loadSessionUserId()).toBeNull());
  });
});
