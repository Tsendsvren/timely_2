import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderApp } from './helpers.jsx';

describe('Authentication password visibility', () => {
  it('toggles login password visibility and resets it when switching to signup', async () => {
    const user = userEvent.setup();
    renderApp('/authenticate');
    const password = screen.getByTestId('field-password');

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Нууц үг харуулах' }));
    expect(password).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Нууц үг нуух' })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByTestId('auth-mode-signup'));
    expect(screen.getByTestId('field-password')).toHaveAttribute('type', 'password');
  });

  it('toggles the registration password fields independently', async () => {
    const user = userEvent.setup();
    renderApp('/authenticate');
    await user.click(screen.getByTestId('auth-mode-signup'));

    const [showPassword, showConfirm] = screen.getAllByRole('button', { name: 'Нууц үг харуулах' });
    await user.click(showPassword);
    expect(screen.getByTestId('field-password')).toHaveAttribute('type', 'text');
    expect(screen.getByTestId('field-confirm')).toHaveAttribute('type', 'password');

    await user.click(showConfirm);
    expect(screen.getByTestId('field-confirm')).toHaveAttribute('type', 'text');
  });
});
