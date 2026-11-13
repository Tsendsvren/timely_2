import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import App from '../App.jsx';
import { AppProvider } from '../store/AppContext.jsx';
import { seed } from '../mock/data.js';

function renderGrades() {
  return render(
    <MemoryRouter initialEntries={['/grades']}>
      <AppProvider initialUserId={seed.users[0].id}>
        <App />
      </AppProvider>
    </MemoryRouter>,
  );
}

describe('grades page', () => {
  it('renders /grades and updates total and letter grade with the what-if slider', () => {
    renderGrades();

    expect(screen.getByTestId('page-grades')).toBeInTheDocument();
    expect(screen.getByTestId('total')).toHaveTextContent('86');
    expect(screen.getByTestId('letter')).toHaveTextContent('B · 3.0');

    fireEvent.change(screen.getByTestId('exam-slider'), { target: { value: '28' } });

    expect(screen.getByTestId('total')).toHaveTextContent('90');
    expect(screen.getByTestId('letter')).toHaveTextContent('A · 3.7');
  });

  it('adds a course through the existing mock store', async () => {
    renderGrades();

    await userEvent.type(screen.getByTestId('field-courseName'), 'Шинэ хичээл');
    await userEvent.click(screen.getByRole('button', { name: 'Нэмэх' }));

    expect(await screen.findByText('70 онооны задаргаа — Шинэ хичээл')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Шинэ хичээл · 3 кр' })).toBeInTheDocument();
  });

  it('saves edits through the mock store and keeps them when switching courses', async () => {
    renderGrades();

    await userEvent.clear(screen.getByTestId('field-attendance'));
    await userEvent.type(screen.getByTestId('field-attendance'), '9');
    fireEvent.change(screen.getByTestId('exam-slider'), { target: { value: '28' } });
    await userEvent.click(screen.getByTestId('save-grade'));

    expect(screen.getByTestId('grade-msg')).toHaveTextContent('Хадгалагдлаа');
    await userEvent.selectOptions(screen.getByTestId('course-select'), 'G02');
    await userEvent.selectOptions(screen.getByTestId('course-select'), 'G01');

    expect(screen.getByTestId('field-attendance')).toHaveValue(9);
    expect(screen.getByTestId('exam-value')).toHaveTextContent('28');
    expect(screen.getByTestId('total')).toHaveTextContent('89');
  });

  it('rejects an invalid coursework total without saving it', async () => {
    renderGrades();

    await userEvent.clear(screen.getByTestId('field-quiz'));
    await userEvent.type(screen.getByTestId('field-quiz'), '31');
    await userEvent.click(screen.getByTestId('save-grade'));

    expect(screen.getByTestId('error-quiz')).toHaveTextContent('0–30');
    expect(screen.queryByTestId('grade-msg')).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByTestId('course-select'), 'G02');
    await userEvent.selectOptions(screen.getByTestId('course-select'), 'G01');
    expect(screen.getByTestId('field-quiz')).toHaveValue(25);
  });

  it('deletes a course from the mock store', async () => {
    renderGrades();

    await userEvent.click(screen.getByTestId('delete-course'));

    expect(screen.queryByRole('option', { name: 'Өгөгдлийн сан · 3 кр' })).not.toBeInTheDocument();
    expect(screen.getByTestId('course-select')).toHaveValue('G02');
  });
});
