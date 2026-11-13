// Эрч хүч: өдрийн цагаас хамаарна (хэмнэл) + өнөөдөр хэр их focus хийснээс (ядрал).
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function baseEnergy(hour) {
  if (hour < 5) return 15;
  if (hour < 6) return 25;
  if (hour < 9) return 80;
  if (hour < 12) return 90;
  if (hour < 14) return 60; // үдийн хоолны дараах уналт
  if (hour < 18) return 75;
  if (hour < 21) return 60;
  if (hour < 23) return 35;
  return 15;
}

export const energyLabel = (value) => {
  if (value < 30) return 'sleepy';
  if (value < 55) return 'tired';
  if (value < 80) return 'steady';
  return 'fresh';
};

export const ENERGY_TEXT = { sleepy: 'Нойрмог', tired: 'Ядарсан', steady: 'Хэвийн', fresh: 'Сэргэг' };

export function computeEnergy({ hour, focusMinutesToday = 0 }) {
  const fatigue = Math.min(25, (focusMinutesToday / 240) * 25);
  const value = clamp(Math.round(baseEnergy(hour) - fatigue), 0, 100);
  return { value, label: energyLabel(value) };
}
