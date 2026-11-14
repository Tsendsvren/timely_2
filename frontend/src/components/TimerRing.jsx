export default function TimerRing({ elapsed = 0, total = 1500, size = 220 }) {
  const r = size / 2 - 12;
  const c = 2 * Math.PI * r;
  const ratio = total > 0 ? Math.min(elapsed / total, 1) : 0;
  const left = Math.max(total - elapsed, 0);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  return (
    <div className="ring" data-testid="timer-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--pri)" strokeWidth="10"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - ratio)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="ring-text">
        <strong>{mm}:{ss}</strong>
        <span className="muted sm">үлдсэн хугацаа</span>
      </div>
    </div>
  );
}