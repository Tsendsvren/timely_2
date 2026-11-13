import { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext.jsx';
import { Field, Input, ErrorBanner } from '../components/ui.jsx';
import Avatar from '../components/Avatar.jsx';
import { validateAuth } from '../lib/validate.js';
import '../styles/auth.css';
import {
  FaGoogle,
  FaGithub,
  FaFacebookF,
  FaApple,
  FaLinkedinIn
} from 'react-icons/fa';

const COVER_MS = 1900; // нүдээ бүрхсэн хугацаа
const PEEK_MS = 1400; // нэг нүдээ нээж шагайх хугацаа
const EMAIL_OK = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CAT = [{ look: { color: '#FFFFFF', hat: '#F5A524' } }];
const SOCIAL_PROVIDERS = [
  { name: 'Google', Icon: FaGoogle, className: 'google' },
  { name: 'GitHub', Icon: FaGithub, className: 'github' },
  { name: 'Facebook', Icon: FaFacebookF, className: 'facebook' },
  { name: 'Apple', Icon: FaApple, className: 'apple' },
  { name: 'LinkedIn', Icon: FaLinkedinIn, className: 'linkedin' },
];

const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

// Талбарын төлөв + бичсэн утгаас муурын хэлэх үг, сэтгэл хөдлөлийг гаргана.
function reaction({ mode, focus, v, err, serverErr, touched, peeking }) {
  const name = v.name.trim();
  const first = name.split(/\s+/)[0];
  const email = v.email.trim();
  const local = email.split('@')[0];

  if (focus === 'password' || focus === 'confirm') {
    const val = focus === 'password' ? v.password : v.confirm;
    if (!peeking) return { emotion: 'shy', text: 'Нүдээ дарлаа, би юу ч харахгүй шүү 🙈' };
    if (focus === 'confirm' && v.confirm) {
      return v.confirm === v.password
        ? { emotion: 'peek', text: 'Хөөх, нэг шагайчихлаа. Хоёулаа таарч байна 👀' }
        : { emotion: 'peek', text: 'Нэг шагайхад хоёр нууц үг таарахгүй байна шүү 👀' };
    }
    if (!val) return { emotion: 'peek', text: 'Юу ч бичээгүй байна шүү 👀' };
    if (focus === 'password' && val.length < 8) return { emotion: 'peek', text: 'Шагайгаад харчлаа, нууц үг богино юмаа. 8+ тэмдэгт хэрэгтэй 👀' };
    return { emotion: 'peek', text: 'Нэг шагайчихлаа, сайн нууц үг байна. Хэнд ч хэлэхгүй 🤫' };
  }

  if (focus === 'name') {
    if (!name) return { emotion: 'happy', text: 'Чамайг юу гэж дуудах вэ?' };
    if (name.length < 2) return { emotion: 'happy', text: 'Нэр чинь жаахан богино юмаа…' };
    return { emotion: 'excited', text: `Аан, нэр чинь ${first} юм уу? Сайхан нэр байна!` };
  }

  if (focus === 'email') {
    if (!email) return { emotion: 'happy', text: 'Имэйлээ бич, би шалгаад өгье.' };
    if (EMAIL_OK.test(email)) {
      return mode === 'login'
        ? { emotion: 'excited', text: `Аан, ${local} сайн уу? Тавтай морил!` }
        : { emotion: 'excited', text: 'Имэйл зөв байна, гоё!' };
    }
    if (!email.includes('@')) return { emotion: 'happy', text: 'Имэйл чинь @ тэмдэггүй байна шүү…' };
    return { emotion: 'happy', text: '@-ийн ард домэйнээ бич (жишээ нь must.edu.mn).' };
  }

  // Талбараас гарсан, эсвэл илгээсний дараах алдаа
  if (serverErr) return { emotion: 'sad', text: `${serverErr}. Дахин оролдоод үз.` };
  if (err.email || (touched.email && email && !EMAIL_OK.test(email))) {
    return { emotion: 'sad', text: 'Имэйл чинь буруу бичигдсэн юм биш үү?' };
  }
  if (err.password) return { emotion: 'sad', text: 'Нууц үг 8-аас дээш тэмдэгттэй байх ёстой шүү.' };
  if (err.confirm) return { emotion: 'sad', text: 'Хоёр нууц үг таарахгүй байна, дахин нягтлаарай.' };
  if (err.name) return { emotion: 'sad', text: 'Нэрээ оруулахаа мартчихсан бололтой.' };

  return mode === 'login'
    ? { emotion: 'happy', text: 'Сайн уу! Нэвтэрч орох уу?' }
    : { emotion: 'happy', text: 'Мяу! Шинэ найз болъё 🐾' };
}

const IconUser = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7z" /></svg>);
const IconMail = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18v12H3z" /><path d="m3 7 9 7 9-7" fill="none" /></svg>);
const IconLock = () => (<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2.5" /><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" /></svg>);
const IconEye = ({ visible }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M2.5 12s3.4-6 9.5-6 9.5 6 9.5 6-3.4 6-9.5 6-9.5-6-9.5-6Z" fill="none" />
    <circle cx="12" cy="12" r="2.5" fill="none" />
    {visible && <path d="m4 4 16 16" fill="none" />}
  </svg>
);

function Icon({ children }) {
  return <span className="auth-ic">{children}</span>;
}

export default function Authenticate() {
  const { user, actions } = useApp();
  const nav = useNavigate();
  const [mode, setMode] = useState('login');
  const [v, setV] = useState({ name: '', email: '', password: '', confirm: '' });
  const [err, setErr] = useState({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [socialMessage, setSocialMessage] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirm: false });
  const [focus, setFocus] = useState(null);
  const [touched, setTouched] = useState({});
  const [peeking, setPeeking] = useState(false);
  const set = (k) => (e) => {
    setV((p) => ({ ...p, [k]: e.target.value }));
    setServerErr('');
  };
  const field = (k) => ({
    onFocus: () => setFocus(k),
    onBlur: () => { setFocus((f) => (f === k ? null : f)); setTouched((t) => ({ ...t, [k]: true })); },
  });

  // Нууц үг бичиж байх үед муур заримдаа нэг нүдээ нээж шагайна
  const covering = focus === 'password' || focus === 'confirm';
  const timer = useRef(null);
  useEffect(() => {
    if (!covering) return undefined;
    let on = false;
    const tick = () => {
      on = !on;
      setPeeking(on);
      timer.current = setTimeout(tick, on ? PEEK_MS : COVER_MS);
    };
    timer.current = setTimeout(tick, COVER_MS - 600);
    return () => { clearTimeout(timer.current); setPeeking(false); };
  }, [covering]);

  const r = useMemo(
    () => reaction({ mode, focus, v, err, serverErr, touched, peeking }),
    [mode, focus, v, err, serverErr, touched, peeking],
  );

  // Бичиж байгаа талбарын дагуу харц зүүнээс баруун тийш хөдөлнө
  const gaze = useMemo(() => {
    if (focus === 'name' || focus === 'email') {
      const len = v[focus].length;
      return { x: clamp(len / 6 - 3, -3, 3), y: 2.5 };
    }
    return { x: 0, y: 0 };
  }, [focus, v]);

  if (user) return <Navigate to="/" replace />;

  const switchTo = (m) => {
    if (m === mode) return;
    setMode(m); setErr({}); setServerErr(''); setSocialMessage(''); setVisiblePasswords({ password: false, confirm: false }); setTouched({}); setFocus(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    const er = validateAuth(v, mode);
    setErr(er);
    setServerErr('');
    if (Object.keys(er).length) return;
    setBusy(true);
    await new Promise((res) => setTimeout(res, 120));
    const res = mode === 'login' ? actions.login(v.email, v.password) : actions.signup(v);
    setBusy(false);
    if (res.error) {
      if (res.field) setErr({ [res.field]: res.error });
      else setServerErr(res.error);
      return;
    }
    nav('/', { replace: true });
  };

  const isLogin = mode === 'login';

  return (
    <main className="auth-stage" data-testid="page-authenticate">
      <div className={'auth-card ' + (isLogin ? 'is-login' : 'is-signup')}>
        {/* Цэнхэр самбар: нэвтрэх үед зүүн, бүртгүүлэх үед баруун талд гулсана */}
        <section className="auth-panel" aria-label="Timely">
          <div className="auth-logo"><span className="mark light">T</span> Timely</div>
          <div className="auth-bubble-wrap" aria-hidden="true">
            <p key={r.text} className={'auth-bubble ' + r.emotion} data-testid="cat-bubble">{r.text}</p>
          </div>
          <div className="auth-cat" data-emotion={r.emotion} data-testid="cat">
            <Avatar items={CAT} emotion={r.emotion} size={230} animate gaze={gaze} />
          </div>
          <div className="auth-switch">
            <h2>{isLogin ? 'Сайн байна уу!' : 'Тавтай морил!'}</h2>
            <p>{isLogin ? 'Шинэ хэрэглэгч үү?' : 'Аль хэдийн бүртгэлтэй юу?'}</p>
            <button
              type="button"
              className="auth-ghost"
              data-testid={isLogin ? 'auth-mode-signup' : 'auth-mode-login'}
              onClick={() => switchTo(isLogin ? 'signup' : 'login')}
            >
              {isLogin ? 'Бүртгүүлэх' : 'Нэвтрэх'}
            </button>
          </div>
        </section>

        <section className="auth-form">
          <form onSubmit={submit} noValidate data-testid="auth-form" key={mode} className="auth-form-inner">
            <h1>{isLogin ? 'Нэвтрэх' : 'Бүртгүүлэх'}</h1>
            <ErrorBanner>{serverErr}</ErrorBanner>
            {!isLogin && (
              <Field label="Нэр" name="name" error={err.name}>
                <div className="auth-input">
                  <Input name="name" value={v.name} onChange={set('name')} error={err.name} autoComplete="name" {...field('name')} />
                  <Icon><IconUser /></Icon>
                </div>
              </Field>
            )}
            <Field label="Имэйл" name="email" error={err.email}>
              <div className="auth-input">
                <Input name="email" type="email" value={v.email} onChange={set('email')} error={err.email} autoComplete="email" {...field('email')} />
                <Icon><IconMail /></Icon>
              </div>
            </Field>
            <Field label="Нууц үг" name="password" error={err.password}>
              <div className="auth-input">
                <Input name="password" className="auth-password" type={visiblePasswords.password ? 'text' : 'password'} value={v.password} onChange={set('password')} error={err.password} autoComplete={isLogin ? 'current-password' : 'new-password'} {...field('password')} />
                <Icon><IconLock /></Icon>
                <button
                  type="button"
                  className="auth-password-toggle"
                  aria-label={visiblePasswords.password ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
                  aria-pressed={visiblePasswords.password}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setVisiblePasswords((shown) => ({ ...shown, password: !shown.password }))}
                >
                  <IconEye visible={visiblePasswords.password} />
                </button>
              </div>
            </Field>
            {!isLogin && (
              <Field label="Нууц үг давтах" name="confirm" error={err.confirm}>
                <div className="auth-input">
                  <Input name="confirm" className="auth-password" type={visiblePasswords.confirm ? 'text' : 'password'} value={v.confirm} onChange={set('confirm')} error={err.confirm} autoComplete="new-password" {...field('confirm')} />
                  <Icon><IconLock /></Icon>
                  <button
                    type="button"
                    className="auth-password-toggle"
                    aria-label={visiblePasswords.confirm ? 'Нууц үг нуух' : 'Нууц үг харуулах'}
                    aria-pressed={visiblePasswords.confirm}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setVisiblePasswords((shown) => ({ ...shown, confirm: !shown.confirm }))}
                  >
                    <IconEye visible={visiblePasswords.confirm} />
                  </button>
                </div>
              </Field>
            )}
            <button type="submit" className="auth-submit" disabled={busy} data-testid="submit">
              {busy ? 'Түр хүлээнэ үү…' : isLogin ? 'Нэвтрэх' : 'Бүртгүүлэх'}
            </button>
            <div className="auth-social" aria-label="Social нэвтрэлт">
              <p className="auth-social-divider"><span>эсвэл social хаягаар</span></p>
              <div className="auth-social-grid">
                {SOCIAL_PROVIDERS.map(({ name, Icon, className }) => (
                  <button
                    key={name}
                    type="button"
                    className="auth-social-button"
                    onClick={() =>
                      setSocialMessage(
                        `${name} нэвтрэлт backend холбогдоогүй тул зөвхөн демо товч.`
                      )
                    }
                  >
                    <span
                      className={`auth-social-mark ${className}`}
                      aria-hidden="true"
                    >
                      <Icon />
                    </span>
                  
                    <span>{name}</span>
                  </button>
                ))}
              </div>
              {socialMessage && <p className="auth-social-message" role="status">{socialMessage}</p>}
            </div>
            <p className="muted sm auth-demo">Демо: bolormaa@must.edu.mn / Secret123 (оюутан) · admin@must.edu.mn / Admin1234 (админ)</p>
          </form>
        </section>
      </div>
    </main>
  );
}
