import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { AppProvider } from '../store/AppContext.jsx';

export function renderApp(path = '/', userId = null) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppProvider initialUserId={userId}>
        <App />
      </AppProvider>
    </MemoryRouter>,
  );
}