import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from './useAuth.jsx';
import NavigatePanel from './NavigatePanel.jsx';

export default function NavigateView() {
  const { user, isLoggedIn } = useAuth();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  return (
    <div className="nav-shell">
      <header className="nav-topbar">
        <Link className="nav-brand" to="/">CowmunityCare</Link>
        <nav className="nav-topnav">
          <Link to="/patient">Voice intake</Link>
          {isLoggedIn ? (
            <>
              <Link to="/settings">My profile</Link>
              <span className="nav-user">{user?.email}</span>
            </>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </nav>
      </header>

      <main className="nav-main">
        <NavigatePanel initialQuery={initialQuery} />
      </main>
    </div>
  );
}
