import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './useAuth.jsx';

export default function LandingPage() {
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();

  return (
    <main className="landing-shell">
      <nav className="landing-nav">
        <span className="landing-nav-brand">CowmunityCare</span>
        <div className="landing-nav-actions">
          {isLoggedIn ? (
            <>
              <Link to="/settings">My Profile</Link>
              <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Log out</a>
            </>
          ) : (
            <>
              <Link to="/login">Log in</Link>
              <Link to="/signup">Sign up</Link>
            </>
          )}
        </div>
      </nav>

      <section className="landing-hero">
        <p className="landing-eyebrow">Accessible Community Intake</p>
        <h1>CowmunityCare,<br />in your language.</h1>
        <p>
          CowmunityCare connects you with healthcare, housing, hunger, and here to help.
          Use voice, sign, or text in any language and get help faster.
        </p>
        <div className="landing-ctas">
          {isLoggedIn ? (
            <button className="btn-primary" onClick={() => navigate('/patient')}>
              Start intake, {user?.profile?.name || user?.email?.split('@')[0]}
            </button>
          ) : (
            <button className="btn-primary" onClick={() => navigate('/signup')}>
              Create free account
            </button>
          )}
          <button className="btn-ghost" onClick={() => navigate('/patient')}>
            Continue without account
          </button>
        </div>
        {isLoggedIn && (
          <p style={{ marginTop: 12, fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
            <Link to="/settings" style={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>View or edit your profile →</Link>
          </p>
        )}
      </section>

      <div className="landing-languages">
        <p className="landing-languages-label">Supported languages</p>
        <div className="landing-languages-chips">
          {['🇺🇸 English', '🇮🇳 हिन्दी', '🇨🇳 中文', '🇪🇸 Español'].map((lang) => (
            <span key={lang} className="lang-chip lang-chip-primary">{lang}</span>
          ))}
          <span className="lang-chip lang-chip-more">+ 70 more languages</span>
        </div>
      </div>

      <div className="landing-features">
        <div className="landing-feature">
          <h3>Any language, any modality</h3>
          <p>Speak, sign with camera, or type. CowmunityCare detects your language and routes you to the right service.</p>
        </div>
        <div className="landing-feature">
          <h3>Your profile, pre-loaded</h3>
          <p>Save your name, insurance, blood type, and emergency contacts once. The AI remembers it so you never repeat yourself.</p>
        </div>
        <div className="landing-feature">
          <h3>Live staff dashboard</h3>
          <p>Structured intake cards reach staff in real time with urgency flags, next steps, and status tracking.</p>
        </div>
        <Link to="/navigate" className="landing-feature" style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <h3>Find a place you can reach</h3>
          <p>Map a route to a park, a clinic, or a coffee shop. We pick wheelchair friendly paths, transit, or a rideshare based on your mobility.</p>
        </Link>
      </div>
    </main>
  );
}
