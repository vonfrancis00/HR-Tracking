import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, CalendarDays, ArrowRight, Search, RefreshCw, ArrowUpRight, CheckCheck, Layers3 } from "lucide-react";
import { createApplicant, getApplicants } from "../services/api";
import ApplicantModal from "../components/ApplicantModal";
import StatusBadge from "../components/StatusBadge";

const stages = [
  ["New Applicant", "New applicants"], ["For Screening", "Screening"],
  ["For Initial Interview", "Initial interview"], ["For Recommendation", "Recommendation"],
  ["Recommended for Final Interview", "Final interview referral"], ["For Final Interview", "Final interview"],
  ["Passed for Hiring", "Passed for hiring"], ["For Employment Processing", "Employment processing"],
  ["For Background Checking", "Background checking"], ["Ready for Onboarding", "Ready for onboarding"],
];
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2";
const panel = "surface-panel";
function formatDate(value) {
  const date = new Date(`${(value || "").slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Not provided" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saveError, setSaveError] = useState("");
  async function load() {
    setLoading(true);
    setError("");
    try { setApplicants(await getApplicants()); }
    catch { setError("Applicant data could not be loaded. Please try again."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  const { counts, sources, filtered } = useMemo(() => {
    const counts = {};
    const sourceCounts = {};
    applicants.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
      const source = item.source?.trim() || "Unspecified";
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    const query = search.trim().toLowerCase();
    const filtered = applicants.filter((item) => (!status || item.status === status) &&
      [item.applicantName, item.positionAppliedFor, item.email].join(" ").toLowerCase().includes(query));
    filtered.sort((a, b) => (Date.parse(b.createdAt || b.dateApplied) || 0) - (Date.parse(a.createdAt || a.dateApplied) || 0));
    return { counts, sources: Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]), filtered };
  }, [applicants, search, status]);
  const total = applicants.length;
  const recent = filtered.slice(0, 5);
  const percentage = (count) => total ? Math.round(count / total * 100) : 0;
  const active = stages.slice(0, -1).reduce((sum, [key]) => sum + (counts[key] || 0), 0);
  const metrics = [
    ["Total applicants", total, "All records in your workspace", Users, "bg-brand-blue-50 text-brand-blue-600"],
    ["Active pipeline", active, "Across application and hiring stages", Layers3, "bg-brand-blue-50 text-brand-blue-600"],
    ["Awaiting interview", (counts["For Initial Interview"] || 0) + (counts["For Final Interview"] || 0), "Initial and final interview stages", CalendarDays, "bg-brand-yellow-100 text-brand-yellow-700"],
    ["Ready for onboarding", counts["Ready for Onboarding"] || 0, "Applicants at the onboarding stage", CheckCheck, "bg-brand-green-50 text-brand-green-700"],
  ];
  async function save(data) {
    setSaveError("");
    try { await createApplicant(data); setModalOpen(false); await load(); }
    catch { setSaveError("Could not save the applicant. Please try again."); }
  }
  return (
    <div className="workspace-page mx-auto max-w-[1600px] space-y-6 pb-6">
      <header className="page-heading flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue-600">Recruitment workspace</p>
          <h1 className="text-3xl font-bold tracking-tight text-slate-950">Dashboard overview</h1>
          <p className="mt-2 text-sm text-slate-500">A clear view of your talent pipeline, from first contact to onboarding.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button aria-label="Refresh dashboard" disabled={loading} onClick={load} className={`rounded-xl border border-slate-200 bg-white p-3 text-slate-500 hover:bg-slate-100 disabled:opacity-50 ${focus}`}><RefreshCw size={17} className={loading ? "animate-spin motion-reduce:animate-none" : ""} /></button>
          <button onClick={() => { setSaveError(""); setModalOpen(true); }} className={`primary-button inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-700 ${focus}`}><UserPlus size={17} /> Add applicant</button>
        </div>
      </header>
      <section className="overview-banner" aria-label="Recruitment summary">
        <div className="relative z-10 max-w-lg">
          <p className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-100"><span className="h-1.5 w-1.5 rounded-full bg-brand-green-500" /> People & possibilities</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Your next great hire starts here.</h2>
          <p className="mt-3 max-w-md text-sm leading-6 text-blue-100">A connected view of your recruitment journey. Turn promising applicants into your next team members.</p>
          <button onClick={() => navigate("/applicants")} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-brand-yellow-500 px-4 py-2.5 text-xs font-bold text-brand-blue-900 hover:bg-brand-yellow-100">Explore applicants <ArrowUpRight size={15} /></button>
        </div>
        <div className="banner-summary relative z-10">
          <div className="mb-4 flex items-center justify-between gap-6"><span className="text-xs text-blue-100">Ready for their next chapter</span><CheckCheck size={19} className="text-brand-green-500" /></div>
          <p className="text-5xl font-semibold tracking-tight text-white tabular-nums">{loading || error ? "?" : counts["Ready for Onboarding"] || 0}</p>
          <p className="mt-2 text-xs text-blue-100">applicants ready for onboarding</p>
          <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-brand-green-500" style={{ width: `${percentage(counts["Ready for Onboarding"] || 0)}%` }} /></div>
        </div>
      </section>
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={load} className={`font-semibold underline ${focus}`}>Try again</button></div>}
      <section aria-label="Recruitment metrics" aria-busy={loading} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, detail, Icon, color]) => <div key={label} className={`${panel} metric-card p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`rounded-xl p-2.5 ${color}`}><Icon size={19} /></span></div>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 tabular-nums">{loading || error ? "—" : value.toLocaleString()}</p>
          <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
        </div>)}
      </section>
      <div className="grid items-start gap-6 xl:grid-cols-[1.65fr_1fr]">
        <section className={`${panel} overflow-hidden`} aria-busy={loading}>
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5 sm:px-6">
            <div><h2 className="font-semibold text-slate-900">Recruitment pipeline</h2><p className="mt-1 text-xs text-slate-500">Select a stage to filter the applicants below.</p></div>
            <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">All time</span>
          </div>
          <div className="space-y-1 p-3 sm:px-4">{stages.map(([key, label], index) => <button key={key} disabled={loading || !!error} aria-pressed={status === key} onClick={() => setStatus(status === key ? "" : key)} className={`grid w-full grid-cols-[minmax(0,1fr)_60px_28px] items-center gap-3 rounded-lg px-3 py-2.5 text-left transition sm:grid-cols-[minmax(0,1fr)_120px_30px] ${status === key ? "bg-brand-blue-50 text-brand-blue-700" : "text-slate-600 hover:bg-slate-50"} ${focus}`}>
            <span className="flex items-center gap-3 text-xs sm:text-sm"><span className="text-[10px] text-slate-400 tabular-nums">{String(index + 1).padStart(2, "0")}</span>{label}</span>
            <span className="h-1.5 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full rounded-full ${index === stages.length - 1 ? "bg-brand-green-500" : "bg-brand-blue-500"}`} style={{ width: `${percentage(counts[key] || 0)}%` }} /></span>
            <span className="text-right text-sm font-semibold tabular-nums">{loading || error ? "—" : counts[key] || 0}</span>
          </button>)}</div>
          <p className="border-t border-slate-100 px-6 py-3 text-[11px] leading-5 text-slate-500">Current stage distribution · Bars show each stage’s share of all applicants.</p>
        </section>
        <section className={`${panel} overflow-hidden`} aria-busy={loading}>
          <div className="border-b border-slate-100 p-5 sm:px-6"><h2 className="font-semibold text-slate-900">Applicant sources</h2><p className="mt-1 text-xs text-slate-500">Understand where your candidates come from.</p></div>
          <div className="p-6">
            <div className="mb-6 flex items-end gap-2"><span className="text-4xl font-semibold tracking-tight text-slate-950">{loading || error ? "—" : sources.length}</span><span className="pb-1 text-sm text-slate-500">recorded sources</span></div>
            {loading || error ? <p role="status" className="py-6 text-sm text-slate-500">{loading ? "Loading source data…" : "Source data is unavailable."}</p> : sources.length ? <div className="max-h-72 space-y-5 overflow-y-auto pr-1">{sources.map(([source, count]) => <div key={source}>
              <div className="mb-2 flex justify-between gap-3 text-sm"><span className="truncate font-medium text-slate-700">{source}</span><span className="shrink-0 text-slate-500 tabular-nums"><span className="font-semibold text-slate-900">{count}</span><span className="ml-2 text-xs">{percentage(count)}%</span></span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-blue-500" style={{ width: `${percentage(count)}%` }} /></div>
            </div>)}</div> : <p className="py-6 text-sm text-slate-500">Add your first applicant to see source insights.</p>}
          </div>
          <div className="mx-5 mb-5 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-700">Better data, better decisions</p><p className="mt-1 text-xs leading-5 text-slate-500">Record the source on each applicant profile to build a clearer picture of your recruitment channels.</p></div>
        </section>
      </div>
      <section className={`${panel} overflow-hidden`} aria-busy={loading}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-6"><div><h2 className="font-semibold text-slate-900">Recent applicants</h2><p className="mt-1 text-xs text-slate-500">Your latest records, ordered by date added.</p></div><button onClick={() => navigate("/applicants")} className={`inline-flex items-center gap-2 rounded-lg px-2 py-1 text-xs font-semibold text-brand-blue-600 hover:bg-brand-blue-50 ${focus}`}>View all applicants <ArrowUpRight size={16} /></button></div>
        <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 px-5 py-3 sm:px-6">
          <div className="relative min-w-0 flex-1 sm:max-w-sm"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Search recent applicants" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, role or email…" className={`w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-xs ${focus}`} /></div>
          <select aria-label="Filter applicants by status" value={status} onChange={(event) => setStatus(event.target.value)} className={`max-w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs text-slate-600 ${focus}`}><option value="">All statuses</option>{[...new Set([...stages.map(([key]) => key), ...applicants.map((item) => item.status).filter(Boolean)])].map((key) => <option key={key}>{key}</option>)}</select>
          {(search || status) && <button onClick={() => { setSearch(""); setStatus(""); }} className={`rounded px-2 py-1 text-xs text-brand-blue-600 ${focus}`}>Clear filters</button>}
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-y border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500"><tr>{["Applicant", "Position", "Date applied", "Status"].map((label) => <th key={label} scope="col" className="px-6 py-3 font-semibold">{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{!loading && !error && recent.map((item) => <tr key={item.id} className="transition hover:bg-slate-50/70">
            <td className="px-6 py-4"><div className="flex items-center gap-3"><span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-blue-50 text-xs font-bold text-brand-blue-600">{(item.applicantName || "?").trim().split(/\s+/).slice(0, 2).map((name) => name[0]).join("")}</span><div><p className="font-semibold text-slate-800">{item.applicantName || "Unnamed applicant"}</p><p className="mt-0.5 text-xs text-slate-500">{item.email || "No email provided"}</p></div></div></td>
            <td className="px-6 py-4 text-slate-600">{item.positionAppliedFor || "Not specified"}</td><td className="whitespace-nowrap px-6 py-4 text-xs text-slate-500">{formatDate(item.dateApplied)}</td><td className="px-6 py-4"><StatusBadge status={item.status || "Unspecified"} /></td>
          </tr>)}
          {(loading || error || !recent.length) && <tr><td colSpan={4} className="px-6 py-12 text-center"><Users size={26} className="mx-auto mb-3 text-slate-300" /><p role="status" className="text-sm font-medium text-slate-600">{loading ? "Loading applicants…" : error ? "Applicant records are unavailable." : total ? "No applicants match your filters." : "Your talent pipeline starts here."}</p>{!loading && !error && !total && <p className="mt-1 text-xs text-slate-500">Use Add applicant to create your first record.</p>}</td></tr>}
          </tbody>
        </table></div>
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 text-xs text-slate-500"><span>{loading ? "Loading records…" : error ? "Data unavailable" : `Showing ${recent.length} of ${filtered.length} applicants`}</span><button onClick={() => navigate("/applicants")} className={`inline-flex items-center gap-1 rounded p-1 font-medium text-slate-600 hover:text-brand-blue-600 ${focus}`}>Manage records <ArrowRight size={14} /></button></div>
      </section>
      {saveError && <div role="alert" className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg">{saveError}</div>}
      <ApplicantModal open={modalOpen} applicant={null} onClose={() => { setModalOpen(false); setSaveError(""); }} onSave={save} />
    </div>
  );
}
