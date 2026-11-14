export const MEMBER = { email: 'bolormaa@must.edu.mn', password: 'Secret123' };
export const ADMIN = { email: 'admin@must.edu.mn', password: 'Admin1234' };

export async function login(page, { email, password }) {
  await page.goto('/authenticate');
  await page.getByTestId('field-email').fill(email);
  await page.getByTestId('field-password').fill(password);
  await page.getByTestId('submit').click();
  await page.getByTestId('user-name').first().waitFor({ state: 'attached' });
}

// Backend /api руу хүсэлт гарсан эсэхийг бүртгэнэ (Бие даалт 1: гарч болохгүй).
export function trackApi(page) {
  const calls = [];
  page.on('request', (r) => {
    if (new URL(r.url()).pathname.startsWith('/api/')) calls.push(r.url());
  });
  return calls;
}
