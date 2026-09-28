import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserPlus, CalendarDays, RefreshCw, ArrowUpRight, CheckCheck, Layers3 } from "lucide-react";
import { createApplicant, getApplicants } from "../services/api";
import ApplicantModal from "../components/ApplicantModal";

const stages = [
  ["New Applicant", "New applicants"], ["For Screening", "Screening"],
  ["For Initial Interview", "Initial interview"], ["For Recommendation", "Recommendation"],
  ["Recommended for Final Interview", "Final interview referral"], ["For Final Interview", "Final interview"],
  ["Passed for Hiring", "Passed for hiring"], ["For Employment Processing", "Employment processing"],
  ["For Background Checking", "Background checking"], ["Ready for Onboarding", "Ready for onboarding"],
];
const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-500 focus-visible:ring-offset-2";
const panel = "surface-panel";
export default function Dashboard() {
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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
  const { counts, sources } = useMemo(() => {
    const counts = {};
    const sourceCounts = {};
    applicants.forEach((item) => {
      counts[item.status] = (counts[item.status] || 0) + 1;
      const source = item.source?.trim() || "Unspecified";
      sourceCounts[source] = (sourceCounts[source] || 0) + 1;
    });
    return { counts, sources: Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]) };
  }, [applicants]);
  const total = applicants.length;
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
    <div className="dashboard-page workspace-page mx-auto max-w-[1600px] space-y-6 pb-6">
      <header className="page-heading flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-brand-blue-600">YOUR HIRING WORKSPACE</p>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight text-slate-950">A little clarity. A lot of potential.</h1>
          <p className="mt-2 text-sm text-slate-500">Here?s where your recruitment journey stands today.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button aria-label="Refresh dashboard" disabled={loading} onClick={load} className={`rounded-xl border border-slate-200 bg-white p-3 text-slate-500 hover:bg-slate-100 disabled:opacity-50 ${focus}`}><RefreshCw size={17} className={loading ? "animate-spin motion-reduce:animate-none" : ""} /></button>
          <button onClick={() => { setSaveError(""); setModalOpen(true); }} className={`primary-button inline-flex items-center gap-2 rounded-xl bg-brand-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-blue-700 ${focus}`}><UserPlus size={17} /> Add applicant</button>
        </div>
      </header>
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}<button onClick={load} className={`font-semibold underline ${focus}`}>Try again</button></div>}
      <section aria-label="Recruitment metrics" aria-busy={loading} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, detail, Icon, color]) => <div key={label} className={`${panel} metric-card p-5 sm:p-6`}>
          <div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`rounded-xl p-2.5 ${color}`}><Icon size={19} /></span></div>
          <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 tabular-nums">{loading || error ? "—" : value.toLocaleString()}</p>
          <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
        </div>)}
      </section>
      <div className="dashboard-insights grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className={`${panel} overflow-hidden`} aria-busy={loading}>
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5 sm:px-6">
            <div><h2 className="font-semibold text-slate-900">Recruitment pipeline</h2><p className="mt-1 text-xs text-slate-500">Applicants across each recruitment stage.</p></div>
            <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">All time</span>
          </div>
          <div className="pipeline-list p-3 sm:px-4">{stages.map(([key, label], index) => <div key={key} className="pipeline-stage">
            <span className="stage-label text-xs sm:text-sm"><span className="stage-index text-[10px] tabular-nums">{String(index + 1).padStart(2, "0")}</span>{label}</span>
            <span className="pipeline-visual"><span className={`pipeline-bar ${index === stages.length - 1 ? "final" : "primary"}`} style={{ width: `${percentage(counts[key] || 0)}%` }} /></span>
            <span className="pipeline-count text-sm font-semibold tabular-nums">{loading || error ? "—" : counts[key] || 0}</span>
          </div>)}</div>
          <p className="border-t border-slate-100 px-6 py-3 text-[11px] leading-5 text-slate-500">Current stage distribution · Bars show each stage’s share of all applicants.</p>
        </section>
        <div className="dashboard-aside">
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
        <section className="dashboard-next-step">
          <span className="dashboard-note-label"><CheckCheck size={16} aria-hidden="true" /> THE NEXT CHAPTER</span>
          <h2>From potential<br />to part of the team.</h2>
          <p>{loading ? "Checking your onboarding pipeline?" : error ? "Refresh your data to see onboarding progress." : `${counts["Ready for Onboarding"] || 0} applicants ready for onboarding. Keep their next steps moving forward.`}</p>
          <button onClick={() => navigate("/applicants")} className={focus}>Open applicant workspace <ArrowUpRight size={16} /></button>
        </section>
        </div>
      </div>
      {saveError && <div role="alert" className="fixed bottom-5 left-1/2 z-[100] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg">{saveError}</div>}
      <ApplicantModal open={modalOpen} applicant={null} onClose={() => { setModalOpen(false); setSaveError(""); }} onSave={save} />
    </div>
  );
}
