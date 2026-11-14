export default function WhatIfSlider({ value, onChange, error }) {
  return (
    <div className="whatif">
      <div className="between">
        <strong>30 онооны шалгалт — таамаглал</strong>
        <span><strong data-testid="exam-value">{value}</strong> / 30</span>
      </div>
      <input
        type="range"
        min="0"
        max="30"
        value={value}
        aria-label="Шалгалтын оноо"
        data-testid="exam-slider"
        onChange={(event) => onChange(Number(event.target.value))}
      />
      {error && <p className="error" role="alert">{error}</p>}
    </div>
  );
}
