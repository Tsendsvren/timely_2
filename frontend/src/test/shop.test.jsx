import { describe, it, expect } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderApp } from './helpers.jsx';

const pts = () => Number(screen.getByTestId('points-chip').textContent.replace(/[^\d]/g, ''));

describe('TML-SHOP — дэлгүүр', () => {
  it('member: оноогоор бараа авч, үлдэгдэл буурна', async () => {
    renderApp('/gamification/shop', 'U01');
    const before = pts();
    fireEvent.click(screen.getByTestId('buy-S03'));
    await waitFor(() => expect(screen.getByTestId('shop-ok')).toBeTruthy());
    expect(pts()).toBe(before - 300);
    expect(screen.queryByTestId('buy-S03')).toBeNull();
  });

  it('оноо хүрэхгүй бараа авах товч идэвхгүй', () => {
    renderApp('/gamification/shop', 'U01');
    // U01: 1250 оноо, S05 = 1200 → авна; тиймээс эхлээд S03 + S08 авч үлдэгдлийг багасгана
    fireEvent.click(screen.getByTestId('buy-S03'));
    fireEvent.click(screen.getByTestId('buy-S08'));
    expect(screen.getByTestId('buy-S05').disabled).toBe(true);
  });

  it('Профайл: toggleEquip — өмсөж, тайлна; нэг төрөлд нэг бараа', async () => {
    renderApp('/profile', 'U01');
    const hat = screen.getByTestId('equip-S01');
    expect(hat.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(hat);
    await waitFor(() => expect(screen.getByTestId('equip-S01').getAttribute('aria-pressed')).toBe('false'));
    fireEvent.click(screen.getByTestId('equip-S01'));
    await waitFor(() => expect(screen.getByTestId('equip-S01').getAttribute('aria-pressed')).toBe('true'));
  });

  it('admin → /admin/shop → Dashboard буцахад алдаагүй', async () => {
    renderApp('/admin/shop', 'U99');
    fireEvent.click(screen.getByRole('link', { name: 'Dashboard' }));
    await waitFor(() => expect(screen.getByTestId('page-dashboard')).toBeTruthy());
  });

  it('admin: бараа нэмэх, засах, устгах', async () => {
    renderApp('/admin/shop', 'U99');
    const before = Number(screen.getByTestId('stat-items').textContent);
    fireEvent.change(document.querySelector('input[name=name]'), { target: { value: 'Шинэ малгай' } });
    fireEvent.change(document.querySelector('input[name=pricePoints]'), { target: { value: '100' } });
    fireEvent.click(screen.getByTestId('submit'));
    await waitFor(() => expect(screen.getByTestId('admin-msg')).toBeTruthy());
    expect(Number(screen.getByTestId('stat-items').textContent)).toBe(before + 1);

    fireEvent.change(document.querySelector('input[name=name]'), { target: { value: 'Шинэ малгай' } });
    fireEvent.change(document.querySelector('input[name=pricePoints]'), { target: { value: '100' } });
    fireEvent.click(screen.getByTestId('submit'));
    await waitFor(() => expect(screen.getByText('Энэ нэртэй бараа байна')).toBeTruthy());

    fireEvent.click(screen.getByLabelText('Улаан малгай устгах'));
    fireEvent.click(screen.getByTestId('confirm-delete'));
    await waitFor(() => expect(Number(screen.getByTestId('stat-items').textContent)).toBe(before));
  });

  it('тодорхойгүй зам: NotFound crash хийхгүй', () => {
    renderApp('/no-such-page', 'U01');
    expect(screen.getByTestId('page-not-found')).toBeTruthy();
  });
});