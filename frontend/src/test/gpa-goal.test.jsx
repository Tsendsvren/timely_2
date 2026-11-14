import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppProvider, useApp } from '../store/AppContext.jsx';
import GpaGoal from '../pages/GpaGoal.jsx';
import { seed } from '../mock/data.js';

function SavedGpa() {
  const { mine, profile } = useApp();
  return <output data-testid="saved-gpa">{`${mine.semesters[0]?.gpa ?? ''}|${profile.gpaTarget}`}</output>;
}

function renderGpaGoal(userId = seed.users[0].id) {
  return render(
    <AppProvider initialUserId={userId}>
      <GpaGoal />
      <SavedGpa />
    </AppProvider>,
  );
}

describe('GPA goal page', () => {
  it('loads semesters and saves the GPA target without crashing', () => {
    renderGpaGoal();

    expect(screen.getByTestId('page-gpa-goal')).toBeInTheDocument();
    expect(screen.getByTestId('gpa-0')).toHaveValue(3.2);
    expect(screen.getByTestId('cr-0')).toHaveValue(15);

    fireEvent.change(screen.getByTestId('gpa-0'), { target: { value: '3.8' } });
    fireEvent.change(screen.getByTestId('target'), { target: { value: '3.9' } });
    fireEvent.click(screen.getByTestId('save-gpa'));

    expect(screen.getByTestId('gpa-msg')).toHaveTextContent('Хадгалагдлаа');
    expect(screen.getByTestId('saved-gpa')).toHaveTextContent('3.8|3.9');
  });

  it('shows eight empty semesters for a user without saved GPA data', () => {
    renderGpaGoal(seed.users[1].id);

    expect(screen.getByTestId('page-gpa-goal')).toBeInTheDocument();
    expect(screen.getByTestId('gpa-7')).toHaveValue(null);
  });
});
