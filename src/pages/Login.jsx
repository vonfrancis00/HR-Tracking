import { useState } from "react";
import { LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(116,143,255,0.18),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(23,54,223,0.12),_transparent_28%),linear-gradient(180deg,_#edf3ff_0%,_#f4f7ff_100%)] px-4 py-10">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-brand-blue-100 bg-white/80 shadow-[0_30px_80px_-40px_rgba(16,33,107,0.45)] backdrop-blur-sm">
        <div className="grid min-h-[760px] lg:grid-cols-[1.15fr_0.85fr]">
          <div className="relative overflow-hidden bg-gradient-to-br from-brand-blue-900 via-brand-blue-800 to-brand-blue-600 p-8 text-white md:p-12">
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center gap-3">
                <div className="grid h-16 w-16 place-items-center overflow-hidden shadow-lg">
                  <img src="/rbm.png" alt="Rural Bank of Medina logo" className="h-full w-full object-cover" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-blue-100">
                    HR Recruitment System
                  </p>
                  <p className="text-sm text-blue-100">Rural Bank of Medina, Inc</p>
                </div>
              </div>

              <div className="mt-14 max-w-md">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-100">
                  <Sparkles size={14} />
                  Demo access ready
                </div>

                <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
                  Welcome back to your hiring workspace.
                </h1>

                <p className="mt-5 max-w-sm text-base leading-7 text-blue-100/90">
                  Manage applicants, review stages, and keep every hiring decision visible in one place.
                </p>
              </div>

              <div className="mt-auto grid gap-4 pt-10 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md">
                  <div className="mb-3 flex items-center gap-2 text-brand-yellow-500">
                    <ShieldCheck size={18} />
                    <span className="text-xs font-bold uppercase tracking-[0.18em]">Role</span>
                  </div>
                  <p className="text-xl font-semibold">Super Admin</p>
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-md">
                  <div className="mb-3 flex items-center gap-2 text-brand-yellow-500">
                    <LockKeyhole size={18} />
                    <span className="text-xs font-bold uppercase tracking-[0.18em]">Demo login</span>
                  </div>
                  <p className="text-sm text-blue-100/90">
                    {DEMO_ACCOUNT.email}<br />
                    {DEMO_ACCOUNT.password}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center bg-slate-50 p-6 md:p-12">
            <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_18px_36px_-24px_rgba(16,33,107,0.35)]">
              <div className="mb-8">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-brand-blue-600">
                  Secure sign in
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                  Login
                </h2>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="email">
                    Work email
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue-100"
                    placeholder="superadmin@demo.local"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue-100"
                    placeholder="Enter password"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_24px_-16px_rgba(23,54,223,0.7)] transition hover:bg-brand-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {busy ? "Signing in..." : "Sign in"}
                </button>
              </form>

              <div className="mt-6 rounded-xl bg-brand-blue-50 p-3 text-xs leading-6 text-brand-blue-800">
                <p className="font-semibold uppercase tracking-[0.16em]">Demo credentials</p>
                <p className="mt-1">
                  Email: <span className="font-semibold">superadmin@demo.local</span>
                </p>
                <p>
                  Password: <span className="font-semibold">demo1234</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
