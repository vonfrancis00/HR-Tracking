import { useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import "./Login.css";
import { getUsers } from "../services/api";

const DEMO_ACCOUNT = {
  email: "superadmin@demo.local",
  password: "demo1234",
};

export default function Login({ onLogin }) {
  const [email, setEmail] = useState(DEMO_ACCOUNT.email);
  const [password, setPassword] = useState(DEMO_ACCOUNT.password);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const normalizedPassword = password.trim();

      if (
        normalizedEmail === DEMO_ACCOUNT.email &&
        normalizedPassword === DEMO_ACCOUNT.password
      ) {
        const users = (await getUsers().catch(() => [])) || [];
        const matchedUser =
          users.find(
            (user) =>
              String(user.email || "").trim().toLowerCase() === normalizedEmail
          ) || {
            userId: "USR-demo-super-admin",
            fullName: "Demo Super Admin",
            email: DEMO_ACCOUNT.email,
            role: "Super Admin",
            department: "Administration",
            status: "Active",
          };

        onLogin({
          ...matchedUser,
          fullName: matchedUser.fullName || "Demo Super Admin",
          email: matchedUser.email || DEMO_ACCOUNT.email,
          role: matchedUser.role || "Super Admin",
          department: matchedUser.department || "Administration",
          status: matchedUser.status || "Active",
        });

        return;
      }

      setError(
        "Invalid demo credentials. Use superadmin@demo.local and demo1234."
      );
    } catch {
      setError("Unable to load the demo account. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <div className="login-brand">
          <img src="/rbm.png" alt="Rural Bank of Medina logo" />
          <div>
            <p>Rural Bank of Medina</p>
            <span>HUMAN RESOURCES</span>
          </div>
        </div>
        <span className="login-workspace-label"><span /> Recruitment workspace</span>
      </header>

      <main className="login-main">
        <div className="login-intro">
          <p className="login-eyebrow">PEOPLE. POTENTIAL. POSSIBILITY.</p>
          <h1>Great teams start here.</h1>
          <p>A thoughtful space for every step of your hiring journey.</p>
        </div>

        <section className="login-card" aria-labelledby="login-heading">
          <div className="login-card-heading">
            <span className="login-key-icon"><LockKeyhole size={22} strokeWidth={1.7} aria-hidden="true" /></span>
            <h2 id="login-heading">Welcome back</h2>
            <p>Sign in to your recruitment workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} aria-busy={busy}>
            <div className="login-field">
              <label htmlFor="email">Work email</label>
              <div className="login-input-wrap">
                <Mail size={18} aria-hidden="true" />
                <input id="email" type="email" autoComplete="username" required
                  value={email} onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com" spellCheck={false} autoCapitalize="none"
                  aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined} />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrap">
                <LockKeyhole size={18} aria-hidden="true" />
                <input id="password" type={showPassword ? "text" : "password"}
                  autoComplete="current-password" required value={password}
                  onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password"
                  aria-invalid={Boolean(error)} aria-describedby={error ? "login-error" : undefined} />
                <button className="login-password-toggle" type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p id="login-error" className="login-error" role="alert">{error}</p>}

            <button type="submit" disabled={busy} className="login-submit">
              {busy ? <><LoaderCircle className="login-spinner" size={18} aria-hidden="true" /> Signing in?</> : <>Sign in <ArrowRight size={18} aria-hidden="true" /></>}
            </button>
          </form>

          <details className="login-demo">
            <summary><span className="login-demo-badge">DEMO</span> Explore the workspace</summary>
            <div className="login-demo-content">
              <p>Your demo account is already filled in.</p>
              <dl>
                <div><dt>Email</dt><dd>{DEMO_ACCOUNT.email}</dd></div>
                <div><dt>Password</dt><dd>{DEMO_ACCOUNT.password}</dd></div>
              </dl>
            </div>
          </details>
        </section>
        <p className="login-access-note">Need access? Contact your HR administrator.</p>
      </main>

      <footer className="login-footer">
        <span>? {new Date().getFullYear()} Rural Bank of Medina, Inc.</span>
        <span>Made for people. Built for progress.</span>
      </footer>
    </div>
  );
}
