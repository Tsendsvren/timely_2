import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar.jsx';
import { Progress } from './ui.jsx';
import { useCompanion } from './useCompanion.js';
import '../styles/companion.css';

// Амьд хамтрагч муур: бодит өгөгдлөөс сэтгэл санаа, эрч хүч, дотно байдлаа гаргаж,
// яриа бөмбөлгөөр хэлнэ. Дээр нь дарвал энхрийлүүлж, өөр үг хэлнэ.
// override — Focus Timer шиг тусгай үед төлөвийг дарж бичнэ ({ emotion, glow, activity, line }).
export default function CatCompanion({ items = [], override = null, size = 150, meters = false, hideNextStep = false }) {
  const [shift, setShift] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [petted, setPetted] = useState(false);
  const base = useCompanion({ shift });
  if (!base) return null;

  const view = override ? { ...base, ...override } : base;
  const pet = () => { setShift((s) => s + 1); setHidden(false); setPetted(true); };
  const nextStep = override || hideNextStep ? null : view.nextStep;
  const { bond } = view;

  return (
    <div className={'companion' + (view.glow ? ' is-glow' : '')} data-testid="companion" data-emotion={view.emotion} data-situation={view.situation}>
      <div className="companion-stage">
        {hidden ? (
          <button type="button" className="btn ghost sm companion-reopen" onClick={() => setHidden(false)}>Муур юу гэж байна?</button>
        ) : (
          <div className={`companion-bubble tone-${view.emotion}`} role="status" aria-live="polite">
            <p key={view.line} data-testid="companion-line">{view.line}</p>
            {nextStep && (
              <Link className="btn soft sm" to={nextStep.to} data-testid="companion-next">{nextStep.label}</Link>
            )}
            <button type="button" className="companion-x" aria-label="Мессежийг хаах" onClick={() => setHidden(true)}>×</button>
          </div>
        )}
        <button
          type="button"
          className={'companion-cat' + (petted ? ' is-petted' : '')}
          onClick={pet}
          onAnimationEnd={() => setPetted(false)}
          aria-label="Муурыг энхрийлэх"
          data-testid="companion-cat"
        >
          <Avatar items={items} size={size} emotion={view.emotion} glow={view.glow} activity={view.activity} animate />
        </button>
      </div>

      {meters && (
        <div className="companion-meters" data-testid="companion-meters">
          <div className="meter">
            <span className="between"><span>Сэтгэл</span><strong>{view.mood.label}</strong></span>
            <Progress value={view.mood.score} max={100} tone="grn" />
          </div>
          <div className="meter">
            <span className="between"><span>Эрч хүч</span><strong>{view.energy.text}</strong></span>
            <Progress value={view.energy.value} max={100} tone="amb" />
          </div>
          <div className="meter">
            <span className="between"><span>Дотно байдал</span><strong>{bond.stage.name}</strong></span>
            <Progress value={bond.progress} max={bond.required} tone="blu" />
            <span className="muted sm">
              {bond.next ? `"${bond.next.name}" хүртэл ${bond.required - bond.progress} дотно оноо` : 'Хамгийн дотно түвшин'}
              {' · '}{bond.days} өдөр хамт
            </span>
          </div>
          {view.reasons.length > 0 && <p className="muted sm" data-testid="companion-reasons">{view.reasons.join(' · ')}</p>}
        </div>
      )}
    </div>
  );
}
