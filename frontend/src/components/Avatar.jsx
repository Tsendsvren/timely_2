import { useId } from 'react';

// Timely аватар — бүтэн биетэй cartoon муур.
// Бүх хэсэг (сүүл, чих, гар, хөл, нүд, ам) тусдаа бүлэг тул анимейшнд шууд ашиглана:
//   .cat-all > .cat-tail | .cat-body | .cat-head (.cat-ear-l/.cat-ear-r, .cat-eyes) | .cat-arm-l/.cat-arm-r
// emotion: happy | excited | sad | shy (нүдээ дарна) | peek (нэг нүдээ нээж шагайна) | sleepy
//          | proud (бахархсан) | comfort (тайтгаруулж байна) | tired (ядарсан)
// gaze: { x, y } — нүдний харцыг хөдөлгөнө (-3..3 орчим)
// glow: true бол ард нь алтан гэрэл, оддын цацрал харагдана (амжилтын үед)
// activity: 'study' (ном уншина) | 'cup' (аягатай ундаа барина) | null
// animate: idle анимейшн (сүүл хөдөлнө, нүд ирмэнэ ...). Avatar.css-ийг үз.

// Хэсэг бүрийн байрлал (градус). Зүүн гар: + = гадагш, баруун гар: − = гадагш.
export const POSES = {
  happy: { armL: 8, armR: -8, tail: 0, earL: 0, earR: 0, front: false },
  excited: { armL: 125, armR: -125, tail: -6, earL: 0, earR: 0, front: false },
  sad: { armL: -6, armR: 6, tail: -38, earL: -20, earR: 20, front: false },
  shy: { armL: 180, armR: -180, tail: 0, earL: -6, earR: 6, front: true },
  sleepy: { armL: 4, armR: -4, tail: -20, earL: -10, earR: 10, front: false },
  // зүүн гар нүдийг бүрхсэн хэвээр, баруун гар хацар руу холдож баруун нүд харагдана
  peek: { armL: 180, armR: -148, tail: 6, earL: -6, earR: 14, front: true },
  proud: { armL: 38, armR: -38, tail: 12, earL: 0, earR: 0, front: false },
  comfort: { armL: 100, armR: -100, tail: -10, earL: -8, earR: 8, front: false },
  tired: { armL: -4, armR: 4, tail: -34, earL: -18, earR: 18, front: false },
};

// Үйлдлийн үед гарын байрлал (зөвхөн нүд бүрхээгүй үед)
const ACTIVITY_POSE = {
  study: { armL: -22, armR: 22 },
  cup: { armR: -35 },
};
const SPARKS = [[10, 26, 0], [110, 16, 0.5], [114, 72, 1], [6, 80, 1.5], [60, -4, 0.8]];

const SHOULDER_L = [42, 76];
const SHOULDER_R = [78, 76];
const ARM_LEN = 28;
const TAIL_ORIGIN = [42, 98];
const EASE = 'transform .5s cubic-bezier(.34,1.56,.64,1)';

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return '#' + [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => f(c).toString(16).padStart(2, '0')).join('');
}

const rot = (deg, [x, y]) => ({ transform: `rotate(${deg}deg)`, transformOrigin: `${x}px ${y}px`, transformBox: 'view-box', transition: EASE });

export default function Avatar({ items = [], emotion = 'happy', size = 120, animate = false, gaze = null, glow = false, activity = null }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const look = items.reduce((a, i) => ({ ...a, ...i.look }), {});
  const body = look.color || '#6f93ea';
  const dark = look.colorDark || shade(body, -0.2);
  const line = shade(body, -0.45);
  const basePose = POSES[emotion] || POSES.happy;
  const pose = activity && !basePose.front ? { ...basePose, ...ACTIVITY_POSE[activity] } : basePose;
  const eyeGaze = gaze || (activity === 'study' ? { x: 0, y: 3 } : null);
  const INK = '#1B1B2F';

  // нүд бүрхэх үед гарыг дээш, дотогш нь жаахан татна (алчуур нүдийг бүрэн таглана)
  const lift = (side) => (pose.front ? { transform: `translate(${side * 3}px, -8px)`, transition: EASE } : { transform: 'translate(0, 0)', transition: EASE });

  const arm = ([sx, sy], deg, cls, side) => (
    <g style={lift(side)}><g className={cls} style={rot(deg, [sx, sy])}>
      <path d={`M${sx} ${sy} L${sx} ${sy + ARM_LEN - 6}`} stroke={line} strokeWidth="12.5" strokeLinecap="round" fill="none" />
      <path d={`M${sx} ${sy} L${sx} ${sy + ARM_LEN - 6}`} stroke={body} strokeWidth="9.5" strokeLinecap="round" fill="none" />
      {/* алчуур (цагаан бээлий) + хурууны шугам */}
      <circle cx={sx} cy={sy + ARM_LEN - 4} r="6.8" fill="#fff" stroke={line} strokeWidth="1.5" />
      <path d={`M${sx - 2.3} ${sy + ARM_LEN - 2.5} v2.4 M${sx + 2.3} ${sy + ARM_LEN - 2.5} v2.4`} stroke={line} strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    </g></g>
  );

  const eyes = {
    happy: (
      <>
        <ellipse cx="44" cy="46" rx="7.5" ry="8.5" fill={INK} /><ellipse cx="76" cy="46" rx="7.5" ry="8.5" fill={INK} />
        <circle cx="41.5" cy="42.5" r="3" fill="#fff" /><circle cx="46.5" cy="49" r="1.5" fill="#fff" />
        <circle cx="73.5" cy="42.5" r="3" fill="#fff" /><circle cx="78.5" cy="49" r="1.5" fill="#fff" />
      </>
    ),
    excited: (
      <g stroke={INK} strokeWidth="3.4" strokeLinecap="round" fill="none">
        <path d="M36.5 49 Q44 38 51.5 49" /><path d="M68.5 49 Q76 38 83.5 49" />
      </g>
    ),
    sad: (
      <>
        <ellipse cx="44" cy="47" rx="7.5" ry="8" fill={INK} /><ellipse cx="76" cy="47" rx="7.5" ry="8" fill={INK} />
        <circle cx="41.5" cy="43.5" r="3.6" fill="#fff" /><circle cx="46.5" cy="50" r="1.6" fill="#fff" />
        <circle cx="73.5" cy="43.5" r="3.6" fill="#fff" /><circle cx="78.5" cy="50" r="1.6" fill="#fff" />
        <g stroke={INK} strokeWidth="2.4" strokeLinecap="round"><line x1="36" y1="37" x2="51" y2="32" /><line x1="84" y1="37" x2="69" y2="32" /></g>
        <path d="M37 56 q-3.6 5.5 0 8 q3.6 -2.5 0 -8z" fill="#7DD3FC" />
      </>
    ),
    sleepy: (
      <g stroke={INK} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d="M37 46 Q44 53 51 46" /><path d="M69 46 Q76 53 83 46" />
      </g>
    ),
  };
  eyes.shy = eyes.happy;
  eyes.peek = eyes.happy;
  eyes.proud = eyes.excited;
  eyes.comfort = (
    <>
      {eyes.happy}
      <g stroke={INK} strokeWidth="2.2" strokeLinecap="round"><line x1="37" y1="36" x2="50" y2="33.5" /><line x1="83" y1="36" x2="70" y2="33.5" /></g>
    </>
  );
  eyes.tired = (
    <>
      <ellipse cx="44" cy="46" rx="7.5" ry="8.5" fill={INK} /><ellipse cx="76" cy="46" rx="7.5" ry="8.5" fill={INK} />
      <circle cx="46.5" cy="49.5" r="1.8" fill="#fff" /><circle cx="78.5" cy="49.5" r="1.8" fill="#fff" />
      {/* зовхи: гадаад талдаа доошоо налуу тул ууртай биш, нойрмог харагдана */}
      <path d="M34.5 35 H53.5 V45 L34.5 48.8 Z M66.5 35 H85.5 V48.8 L66.5 45 Z" fill={body} />
      <path d="M35.5 48.4 L52.5 44.8 M67.5 44.8 L84.5 48.4" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M38 58 q6 2.5 12 0 M70 58 q6 2.5 12 0" stroke={dark} strokeWidth="1.6" fill="none" strokeLinecap="round" opacity="0.55" />
    </>
  );

  const mouth = {
    happy: <path d="M60 54.5 Q54 61 48 57.5 M60 54.5 Q66 61 72 57.5" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
    excited: (
      <>
        <path d="M51 57 Q60 72 69 57 Z" fill="#B83257" stroke={INK} strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M55.5 64 Q60 69 64.5 64 Q60 61.5 55.5 64Z" fill="#FF8FB1" />
      </>
    ),
    sad: <path d="M50 63 Q60 55 70 63" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
    shy: <path d="M54 58 Q60 63 66 58" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
    peek: <path d="M54 58 Q60 63 66 58" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
    sleepy: <path d="M55 58.5 Q60 62 65 58.5" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
    proud: <path d="M51 57 Q60 67 69 57" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
    comfort: <path d="M53 58 Q60 64 67 58" stroke={INK} strokeWidth="2" fill="none" strokeLinecap="round" />,
    tired: <ellipse cx="60" cy="60.5" rx="3.2" ry="4" fill="#B83257" stroke={INK} strokeWidth="1.6" />,
  };

  const arms = (
    <g className="cat-arms">
      {arm(SHOULDER_L, pose.armL, 'cat-arm-l', 1)}
      {arm(SHOULDER_R, pose.armR, 'cat-arm-r', -1)}
    </g>
  );

  return (
    <svg role="img" aria-label="Timely аватар (муур)" viewBox="0 0 120 120" width={size} height={size}
      className={`cat cat-${emotion}${animate ? ' cat-animate' : ''}`} style={{ maxWidth: '100%', overflow: 'visible' }}>
      {glow && (
        <g className="cat-glow" aria-hidden="true">
          <defs>
            <radialGradient id={`halo${uid}`}>
              <stop offset="0%" stopColor="#FFE58A" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#FFD76A" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#FFD76A" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle className="cat-halo" cx="60" cy="62" r="68" fill={`url(#halo${uid})`} />
          {SPARKS.map(([x, y, delay]) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
              <path className="cat-spark" style={{ animationDelay: `${delay}s` }} fill="#FFC93C"
                d="M0 -6 Q0.8 -0.8 6 0 Q0.8 0.8 0 6 Q-0.8 0.8 -6 0 Q-0.8 -0.8 0 -6Z" />
            </g>
          ))}
        </g>
      )}
      <ellipse cx="60" cy="115" rx="32" ry="3.8" fill={INK} opacity="0.1" />
      <g className="cat-all">
        {/* сүүл */}
        <g style={rot(pose.tail, TAIL_ORIGIN)}>
          <g className="cat-tail" style={{ transformOrigin: `${TAIL_ORIGIN[0]}px ${TAIL_ORIGIN[1]}px`, transformBox: 'view-box' }}>
            <path d="M42 98 C16 101 5 80 16 62" stroke={line} strokeWidth="13" strokeLinecap="round" fill="none" />
            <path d="M42 98 C16 101 5 80 16 62" stroke={body} strokeWidth="10" strokeLinecap="round" fill="none" />
            <circle cx="16" cy="62" r="6.2" fill="#fff" stroke={line} strokeWidth="1.5" />
          </g>
        </g>

        {/* хөл */}
        <g className="cat-legs">
          {[[46, 44], [74, 76]].map(([lx, fx]) => (
            <g key={lx}>
              <rect x={lx - 8} y="92" width="16" height="15" rx="8" fill={body} stroke={line} strokeWidth="1.5" />
              <ellipse cx={fx} cy="109" rx="11.5" ry="6.2" fill="#fff" stroke={line} strokeWidth="1.5" />
              <g fill="#FFB6C8"><circle cx={fx - 5} cy="110.5" r="1.6" /><circle cx={fx} cy="112" r="1.6" /><circle cx={fx + 5} cy="110.5" r="1.6" /></g>
            </g>
          ))}
        </g>

        {/* бие */}
        <g className="cat-body" style={{ transformOrigin: '60px 100px', transformBox: 'view-box' }}>
          <path d="M40 64 C32 84 34 101 60 101 C86 101 88 84 80 64 Z" fill={body} stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M60 71 C46 71 45 96 60 96 C75 96 74 71 60 71 Z" fill={dark} opacity="0.0" />
          <ellipse cx="60" cy="85" rx="14.5" ry="13.5" fill="#fff" opacity="0.95" />
        </g>

        {/* үйлдлийн зүйл: гарын ард, биеийн урд */}
        {activity === 'study' && !pose.front && (
          <g className="cat-book">
            <rect x="39" y="80" width="42" height="22" rx="3" fill="#E8A33D" stroke={INK} strokeWidth="1.5" />
            <path d="M42 82.5 Q51 78.5 60 82.5 Q69 78.5 78 82.5 V99.5 Q69 95.5 60 99.5 Q51 95.5 42 99.5 Z" fill="#FFF6D6" stroke={INK} strokeWidth="1.2" strokeLinejoin="round" />
            <path d="M60 82.5 V99.5" stroke={INK} strokeWidth="1.2" />
            <path d="M45 87 H56 M45 91 H56 M45 95 H53 M64 87 H75 M64 91 H75 M64 95 H72" stroke="#B9A878" strokeWidth="1" strokeLinecap="round" />
          </g>
        )}
        {activity === 'cup' && !pose.front && (
          <g className="cat-cup">
            <path d="M97 90 q6 0 6 6 q0 5 -6 5" fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" />
            <rect x="85" y="86" width="13" height="15" rx="3" fill="#fff" stroke={INK} strokeWidth="1.5" />
            <ellipse cx="91.5" cy="86.5" rx="6.5" ry="1.8" fill="#8B5E3C" stroke={INK} strokeWidth="1" />
            <g className="cat-steam" stroke="#AEB8D6" strokeWidth="1.6" strokeLinecap="round" fill="none">
              <path d="M89 82 q-2 -3 0 -6 q2 -3 0 -6" /><path d="M94 82 q-2 -3 0 -6 q2 -3 0 -6" />
            </g>
          </g>
        )}

        {/* гар (бие, толгойн хооронд) */}
        {!pose.front && arms}

        {/* толгой */}
        <g className="cat-head" style={{ transformOrigin: '60px 60px', transformBox: 'view-box' }}>
          <g style={rot(pose.earL, [31, 38])}>
            <path d="M24 44 C12 34 16 8 38 20 C44 24 32 40 24 44 Z" fill={body} stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M23 37 C18.5 30 21.5 17 34.5 24.5 Z" fill="#FFB6C8" />
          </g>
          <g style={rot(pose.earR, [89, 38])}>
            <path d="M96 44 C108 34 104 8 82 20 C76 24 88 40 96 44 Z" fill={body} stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M97 37 C101.5 30 98.5 17 85.5 24.5 Z" fill="#FFB6C8" />
          </g>
          {/* хацрын зөөлөн үс */}
          <polygon points="27,49 17,54.5 28,60" fill={body} stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
          <polygon points="93,49 103,54.5 92,60" fill={body} stroke={line} strokeWidth="1.5" strokeLinejoin="round" />
          <ellipse cx="60" cy="48" rx="36" ry="31" fill={body} stroke={line} strokeWidth="1.5" />
          {/* духны судал */}
          <g stroke={dark} strokeWidth="2.4" strokeLinecap="round"><line x1="60" y1="19" x2="60" y2="26" /><line x1="51.5" y1="20.5" x2="53" y2="26.5" /><line x1="68.5" y1="20.5" x2="67" y2="26.5" /></g>
          {/* хацар */}
          <ellipse cx="32" cy="57" rx="6.5" ry="3.6" fill="#FF8FB1" opacity={emotion === 'shy' || emotion === 'peek' ? 0.95 : 0.7} />
          <ellipse cx="88" cy="57" rx="6.5" ry="3.6" fill="#FF8FB1" opacity={emotion === 'shy' || emotion === 'peek' ? 0.95 : 0.7} />
          <g className="cat-eyes" style={{ transformOrigin: '60px 46px', transformBox: 'view-box' }}><g style={{ transform: `translate(${eyeGaze?.x || 0}px, ${eyeGaze?.y || 0}px)`, transition: 'transform .3s ease-out' }}>{eyes[emotion] || eyes.happy}</g></g>
          <polygon points="56.6,51.5 63.4,51.5 60,55" fill="#FF6B95" stroke="#FF6B95" strokeWidth="1" strokeLinejoin="round" />
          {mouth[emotion] || mouth.happy}
          <g stroke={INK} strokeWidth="1.5" strokeLinecap="round" opacity="0.45">
            <line x1="14" y1="47" x2="31" y2="52" /><line x1="13" y1="57" x2="31" y2="57.5" />
            <line x1="106" y1="47" x2="89" y2="52" /><line x1="107" y1="57" x2="89" y2="57.5" />
          </g>

          {/* дэлгүүрийн зүйлс */}
          {look.hat && (
            <g>
              <path d="M42 20 C42 6 78 6 78 20 Z" fill={look.hat} stroke={shade(look.hat, -0.3)} strokeWidth="1.2" />
              <rect x="35" y="18" width="50" height="6.5" rx="3.2" fill={look.hat} stroke={shade(look.hat, -0.3)} strokeWidth="1.2" />
            </g>
          )}
          {look.crown && <polygon points="42,23 47,6 54,16 60,3 66,16 73,6 78,23" fill="#F5A524" stroke="#C98211" strokeWidth="1.2" strokeLinejoin="round" />}
          {look.glasses && (
            <g stroke={INK} strokeWidth="2.5">
              <rect x="32" y="37.5" width="24" height="16" rx="6.5" fill={INK} fillOpacity="0.88" />
              <rect x="64" y="37.5" width="24" height="16" rx="6.5" fill={INK} fillOpacity="0.88" />
              <line x1="56" y1="45" x2="64" y2="45" strokeWidth="3" />
            </g>
          )}
        </g>

        {/* нүд дарах үед гар нүүрний урд */}
        {pose.front && arms}

        {emotion === 'comfort' && (
          <g transform="translate(101 22)" aria-hidden="true">
            <path className="cat-heart" d="M0 3 C-7 -3 -3 -9 0 -5 C3 -9 7 -3 0 3Z" fill="#FF7BA5" />
          </g>
        )}
      </g>
    </svg>
  );
}