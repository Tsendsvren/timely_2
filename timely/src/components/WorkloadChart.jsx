
export default function WorkloadChart({ data, today }) {
  const total = Math.round(data.reduce((a, w) => a + w.h, 0) * 10) / 10;
  const maxH = Math.max(1, ...data.map((w) => w.h));

  if (total === 0) {
    return (
      <p className="muted sm" data-testid="workload">
        Энэ долоо хоногт ачаалал алга. Хичээл, ачаалал, даалгавар нэмэхэд энд харагдана.
      </p>
    );
  }

  return (
    <div className="chart" data-testid="workload" role="img" aria-label={`Долоо хоногийн ачаалал, нийт ${total} цаг`}>
      {data.map((w) => (
        <div key={w.n} className="col">
          <span className="m02-val">{w.h}</span>
          <span className={'colbar' + (w.d === today ? ' today' : '')} style={{ height: (w.h / maxH) * 100 + 'px' }} />
          <span className={'sm' + (w.d === today ? '' : ' muted')}>{w.n}</span>
        </div>
      ))}
    </div>
  );
}
