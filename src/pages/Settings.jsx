import { useCallback, useEffect, useRef, useState } from "react";
import { isSuperAdmin } from "../services/permissions";
import { Eye, EyeOff, LoaderCircle, Plus, RefreshCw, Users, X } from "lucide-react";
import { getUsers, isConnected, registerUser } from "../services/api";

const emptyForm = { fullName: "", email: "", role: "HR", department: "", status: "Active", password: "", confirmPassword: "" };
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-brand-blue-500 focus:outline-none focus:ring-2 focus:ring-brand-blue-100";

function PasswordField({ name, label, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return <div className="text-sm font-medium">
    <label htmlFor={name}>{label}</label>
    <div className="relative">
      <input id={name} name={name} type={visible ? "text" : "password"} autoComplete="new-password" required minLength={12} maxLength={128} value={value} onChange={onChange} className={`${inputClass} pr-12`} />
      <button type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)} className="absolute right-2 top-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
    </div>
    {name === "password" && <span className="mt-1 block text-xs font-normal text-slate-500">At least 12 characters.</span>}
  </div>;
}

function PasswordCell({ password, name }) {
  const [visible, setVisible] = useState(false);
  if (!password) return <span className="text-xs text-slate-500" title="Existing passwords cannot be retrieved. Only passwords entered during this Settings visit can be shown.">Not retrievable</span>;
  return <div className="flex items-center gap-2">
    <span className={visible ? "font-mono" : "tracking-widest"}>{visible ? password : "\u2022".repeat(8)}</span>
    <button type="button" aria-label={`${visible ? "Hide" : "Show"} password for ${name}`} aria-pressed={visible} onClick={() => setVisible(!visible)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button>
  </div>;
}

function RegisterUserModal({ onClose, onSaved }) {
  const dialog = useRef(null);
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  function change(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (!form.fullName.trim()) { setError("Enter the user's full name."); return; }
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    setBusy(true);
    try { onSaved(await registerUser(form), form.password); }
    catch (err) { setError(err.message || "Unable to register user. Please try again."); }
    finally { setBusy(false); }
  }
  return (
    <dialog ref={dialog} aria-labelledby="register-title" onCancel={(event) => { event.preventDefault(); if (!busy) onClose(); }}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-xl overflow-y-auto rounded-2xl border-0 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/50">
      <div className="flex items-start justify-between border-b border-slate-100 p-6">
        <div><h2 id="register-title" className="text-xl font-bold">Register user</h2><p className="mt-1 text-sm text-slate-500">Create an account for your team.</p></div>
        <button type="button" aria-label="Close registration" disabled={busy} onClick={onClose} className="rounded-lg p-2 hover:bg-slate-100"><X size={20} /></button>
      </div>
      <form onSubmit={submit} className="p-6" aria-busy={busy}>
        <fieldset disabled={busy} className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium sm:col-span-2">Full name<input autoFocus name="fullName" autoComplete="name" required maxLength={150} value={form.fullName} onChange={change} className={inputClass} /></label>
          <label className="text-sm font-medium sm:col-span-2">Email<input name="email" type="email" autoComplete="off" required maxLength={254} value={form.email} onChange={change} className={inputClass} /></label>
          <label className="text-sm font-medium">Role<select name="role" value={form.role} onChange={change} className={inputClass}>{["Super Admin", "Admin", "HR", "Viewer"].map((role) => <option key={role}>{role}</option>)}</select></label>
          <label className="text-sm font-medium">Status<select name="status" value={form.status} onChange={change} className={inputClass}><option>Active</option><option>Inactive</option></select></label>
          <label className="text-sm font-medium sm:col-span-2">Department<input name="department" maxLength={150} value={form.department} onChange={change} className={inputClass} placeholder="e.g. Human Resources" /></label>
          <PasswordField name="password" label="Password" value={form.password} onChange={change} />
          <PasswordField name="confirmPassword" label="Confirm password" value={form.confirmPassword} onChange={change} />
        </fieldset>
        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button type="button" disabled={busy} onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold">Cancel</button>
          <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy && <LoaderCircle size={16} className="animate-spin" />}{busy ? "Registering..." : "Register user"}</button>
        </div>
      </form>
    </dialog>
  );
}

export default function Settings({ user }) {
  const [users, setUsers] = useState([]);
  // Kept only in this mounted page; never persisted or fetched from the API.
  const [newPasswords, setNewPasswords] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const isAdmin = isSuperAdmin(user);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setUsers(await getUsers()); }
    catch (err) { setError(err.message || "Unable to load users."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { if (isConnected && isAdmin) load(); else setLoading(false); }, [isAdmin, load]);
  return (
    <div className="space-y-6">
      <div className="page-heading"><p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Workspace</p><h1 className="mt-2 font-bold">Settings</h1><p className="mt-2 text-sm text-slate-500">Manage your team's access to the recruitment workspace.</p></div>
      {!isAdmin ? <div className="surface-panel p-6 text-sm text-slate-600">Only Super Admin accounts can manage users.</div> : <section className="surface-panel overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-6">
          <div className="flex items-center gap-3"><span className="rounded-xl bg-brand-blue-50 p-3 text-brand-blue-900"><Users size={22} /></span><div><h2 className="font-bold text-slate-800">User management</h2><p className="mt-1 text-sm text-slate-500">{users.length} registered {users.length === 1 ? "user" : "users"}</p></div></div>
          <div className="flex gap-2"><button aria-label="Refresh users" onClick={load} disabled={loading || !isConnected} className="rounded-xl border border-slate-200 p-3 disabled:opacity-50"><RefreshCw size={18} /></button><button disabled={!isConnected || loading || Boolean(error)} onClick={() => { setMessage(""); setOpen(true); }} className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><Plus size={18} />Register user</button></div>
        </div>
        <p className="px-6 pt-4 text-xs text-slate-500">New passwords can be shown until you leave or reload Settings. Existing passwords cannot be retrieved.</p>
        {!isConnected && <p className="m-6 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Connect Google Sheets to register users. User registration is unavailable in demo mode.</p>}
        {message && <p role="status" className="mx-6 mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800">{message}</p>}
        {error && <p role="alert" className="m-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        {loading ? <p role="status" className="p-10 text-center text-sm text-slate-500">Loading users...</p> : !error && <div className="overflow-x-auto"><table className="w-full whitespace-nowrap text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{["Full name", "Email", "Password", "Role", "Department", "Status"].map((title) => <th key={title} className="px-6 py-4 font-semibold">{title}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{users.map((item) => <tr key={item.userId} className="text-slate-600"><td className="px-6 py-4 font-semibold text-slate-800">{item.fullName}</td><td className="px-6 py-4">{item.email}</td><td className="px-6 py-4"><PasswordCell password={newPasswords[item.userId]} name={item.fullName} /></td><td className="px-6 py-4">{item.role}</td><td className="px-6 py-4">{item.department || "—"}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${item.status === "Active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>{item.status}</span></td></tr>)}</tbody></table>{users.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No registered users yet.</p>}</div>}
      </section>}
      {open && <RegisterUserModal onClose={() => setOpen(false)} onSaved={(created, password) => { setNewPasswords((current) => ({ ...current, [created.userId]: password })); setUsers((current) => [...current, created]); setOpen(false); setMessage(`${created.fullName} was registered successfully.${created.status === "Active" ? " They can now sign in with their email and password." : " Their account is inactive."}`); }} />}
    </div>
  );
}
