import { describe, expect, it } from 'vitest';
import { calcGrade, letterOf, neededExam } from './gradeCalc.js';
import { validateBreakdown } from './validate.js';

describe('grade calculations', () => {
  it.each([
    [0, 'F', 0],
    [59, 'F', 0],
    [60, 'D', 1],
    [64, 'D', 1],
    [65, 'D', 1.3],
    [69, 'D', 1.3],
    [70, 'C', 1.7],
    [72, 'C', 1.7],
    [73, 'C', 2],
    [76, 'C', 2],
    [77, 'C+', 2.3],
    [79, 'C+', 2.3],
    [80, 'B', 2.7],
    [82, 'B', 2.7],
    [83, 'B', 3],
    [86, 'B', 3],
    [87, 'B+', 3.3],
    [89, 'B+', 3.3],
    [90, 'A', 3.7],
    [94, 'A', 3.7],
    [95, 'A+', 4],
    [100, 'A+', 4],
  ])('total %i maps to %s (%s points)', (total, letter, gradePoint) => {
    expect(letterOf(total)).toMatchObject({ letter, gp: gradePoint });
  });

  it('62 coursework points plus 24 exam points gives 86 and B (3.0)', () => {
    expect(calcGrade({ attendance: 10, lab: 27, quiz: 25 }, 24)).toMatchObject({
      total: 86,
      letter: 'B',
      gradePoint: 3,
    });
  });

  it('calculates required exam points and marks scores above 30 impossible', () => {
    const required = neededExam({ attendance: 10, lab: 27, quiz: 25 });

    expect(required.find(({ letter, gradePoint }) => letter === 'A+' && gradePoint === 4)).toMatchObject({ exam: 33, possible: false });
    expect(required.find(({ letter }) => letter === 'A')).toMatchObject({ exam: 28, possible: true });
    expect(required.find(({ letter }) => letter === 'B+')).toMatchObject({ exam: 25, possible: true });
    expect(required.find(({ letter, gradePoint }) => letter === 'B' && gradePoint === 3)).toMatchObject({ exam: 21, possible: true });
    expect(required.find(({ letter, gradePoint }) => letter === 'B' && gradePoint === 2.7)).toMatchObject({ exam: 18, possible: true });
    expect(neededExam({ attendance: 0, lab: 0, quiz: 0 }).find(({ letter }) => letter === 'A'))
      .toMatchObject({ exam: 90, possible: false });
  });
});

describe('grade validation', () => {
  it('accepts 70 coursework points and rejects a breakdown above the field limits', () => {
    expect(validateBreakdown({ attendance: 10, lab: 30, quiz: 30 })).toEqual({});
    expect(validateBreakdown({ attendance: 10, lab: 30, quiz: 31 })).toHaveProperty('quiz');
  });

  it('rejects exam scores above 30', () => {
    expect(validateBreakdown({ attendance: 10, lab: 27, quiz: 25, exam: 31 })).toHaveProperty('exam');
  });
});
