
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider } from '../store/AppContext.jsx';
import Commitments from '../pages/Commitments.jsx';
import { seed } from '../mocks/data.js';

function setup() {
  const userId = seed.users[0].id;

  return render(
    <AppProvider initialUserId={userId}>
      <Commitments />
    </AppProvider>
  );
}

function addCommitment(title = 'Шинэ дадал') {
  fireEvent.change(screen.getByTestId('field-title'), {
    target: { value: title },
  });

  fireEvent.click(screen.getByTestId('day-0'));
  fireEvent.click(screen.getByTestId('submit'));
}

describe('Commitment & Habit CRUD', () => {
  it('READ: Commitment хуудас харагдана', () => {
    setup();

    expect(
      screen.getByTestId('page-commitments')
    ).toBeInTheDocument();

    expect(
      screen.getByTestId('commitment-form')
    ).toBeInTheDocument();
  });

  it('CREATE: Шинэ дадал нэмнэ', () => {
    setup();

    addCommitment('Өглөөний дасгал');

    expect(
      screen.getByText('Өглөөний дасгал')
    ).toBeInTheDocument();

    expect(
      screen.getByText('Ачаалал нэмэгдлээ')
    ).toBeInTheDocument();
  });

  it('UPDATE: Дадлын нэрийг засна', () => {
    setup();

    addCommitment('Ном унших');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Ном унших засах',
      })
    );

    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: 'Англи ном унших' },
    });

    fireEvent.click(screen.getByTestId('submit'));

    expect(
      screen.getByText('Англи ном унших')
    ).toBeInTheDocument();

    expect(
      screen.queryByText('Ном унших')
    ).not.toBeInTheDocument();
  });

  it('DELETE: Дадлыг устгана', () => {
    setup();

    addCommitment('Гүйх');

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Гүйх устгах',
      })
    );

    expect(
      screen.queryByText('Гүйх')
    ).not.toBeInTheDocument();

    expect(
      screen.getByText('Ачаалал устгагдлаа')
    ).toBeInTheDocument();
  });

  it('VALIDATION: Хоосон нэрийг зөвшөөрөхгүй', () => {
    setup();

    fireEvent.click(screen.getByTestId('day-0'));
    fireEvent.click(screen.getByTestId('submit'));

    expect(
      screen.getByText('Нэр оруулна уу')
    ).toBeInTheDocument();
  });

  it('VALIDATION: Өдөр сонгоогүй бол алдаа гарна', () => {
    setup();

    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: 'Дасгал' },
    });

    fireEvent.click(screen.getByTestId('submit'));

    expect(
      screen.getByText('Дор хаяж нэг өдөр сонгоно уу')
    ).toBeInTheDocument();
  });

  it('VALIDATION: Дуусах цаг эхлэх цагаас өмнө байж болохгүй', () => {
    setup();

    fireEvent.change(screen.getByTestId('field-title'), {
      target: { value: 'Сургалт' },
    });

    fireEvent.click(screen.getByTestId('day-0'));

    fireEvent.change(screen.getByTestId('field-start'), {
      target: { value: '19:00' },
    });

    fireEvent.change(screen.getByTestId('field-end'), {
      target: { value: '18:00' },
    });

    fireEvent.click(screen.getByTestId('submit'));

    expect(
      screen.getByText('Дуусах цаг эхлэх цагаас хойш байна')
    ).toBeInTheDocument();
  });
});
//app test hiine