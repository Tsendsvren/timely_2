import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './helpers.jsx';

describe('Social authentication demo buttons', () => {
  it('shows providers and clearly reports that social login is a demo', async () => {
    renderApp('/authenticate');

    for (const provider of ['Google', 'GitHub', 'Facebook', 'Apple', 'LinkedIn']) {
      expect(screen.getByRole('button', { name: provider })).toBeInTheDocument();
    }

    await userEvent.click(screen.getByRole('button', { name: 'LinkedIn' }));
    expect(screen.getByRole('status')).toHaveTextContent('backend холбогдоогүй тул зөвхөн демо товч');
    expect(screen.getByTestId('page-authenticate')).toBeInTheDocument();
  });
});
