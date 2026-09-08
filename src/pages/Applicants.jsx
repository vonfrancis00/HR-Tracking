import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Search, Trash2, Users, CalendarDays, CheckCheck, BriefcaseBusiness, ChevronLeft, ChevronRight, RefreshCw, SlidersHorizontal, X } from "lucide-react";
import { useLocation } from "react-router-dom";
import { createApplicant, deleteApplicant, getApplicants, updateApplicant } from "../services/api";
import ApplicantModal from "../components/ApplicantModal";
import StatusBadge from "../components/StatusBadge";

const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2";
const control = `rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-600 ${focus}`;
const panel = "rounded-2xl border border-slate-200/80 bg-white shadow-sm";
const dateValue = (value) => Date.parse(value) || 0;
function formatDate(value) {
  const date = new Date(`${(value || "").slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? "Not provided" : date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export default function Applicants() {
  const location = useLocation();
  const [applicants, setApplicants] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const mutationPending = useRef(false);
  const [modal, setModal] = useState({ open: false, applicant: null });

  async function load() {
    setLoading(true);
    setLoadError("");
    try { setApplicants(await getApplicants()); }
    catch { setLoadError("Applicant records could not be loaded. Please try again."); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => {
    if (location.pathname === "/applicants/new") setModal({ open: true, applicant: null });
  }, [location.pathname]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const records = applicants.filter((item) => {
      const matchesSearch = [item.applicantName, item.email, item.positionAppliedFor, item.contactNumber, item.source].join(" ").toLowerCase().includes(query);
      return matchesSearch && (!status || item.status === status) && (!source || (item.source?.trim() || "Unspecified") === source);
    });
    return records.sort((a, b) => {
      if (sort === "name") return (a.applicantName || "").localeCompare(b.applicantName || "");
      if (sort === "applied") return dateValue(b.dateApplied) - dateValue(a.dateApplied);
      const difference = dateValue(b.createdAt || b.dateApplied) - dateValue(a.createdAt || a.dateApplied);
      return sort === "oldest" ? -difference : difference;
    });
  }, [applicants, search, status, source, sort]);
  const statuses = [...new Set(applicants.map((item) => item.status).filter(Boolean))].sort();
  const sources = [...new Set(applicants.map((item) => item.source?.trim() || "Unspecified"))].sort();
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const offset = (currentPage - 1) * pageSize;
  const visible = filtered.slice(offset, offset + pageSize);
  const filterCount = Number(!!status) + Number(!!source);
  const hasFilters = !!(search || status || source);
  const metrics = [
    ["Total applicants", applicants.length, "Records in your workspace", Users, "bg-indigo-50 text-indigo-600"],
    ["Positions applied for", new Set(applicants.map((item) => item.positionAppliedFor?.trim()).filter(Boolean)).size, "Distinct roles across applicants", BriefcaseBusiness, "bg-blue-50 text-blue-600"],
    ["Awaiting interview", applicants.filter((item) => ["For Initial Interview", "For Final Interview"].includes(item.status)).length, "Initial and final interview stages", CalendarDays, "bg-amber-50 text-amber-600"],
    ["Ready for onboarding", applicants.filter((item) => item.status === "Ready for Onboarding").length, "Applicants at the onboarding stage", CheckCheck, "bg-emerald-50 text-emerald-600"],
  ];
  function openModal(applicant = null) {
    setActionError(""); setNotice(""); setModal({ open: true, applicant });
  }
  function resetFilters() { setSearch(""); setStatus(""); setSource(""); setPage(1); }
  async function save(data) {
    if (mutationPending.current) return;
    mutationPending.current = true; setBusy(true); setActionError("");
    try {
      if (modal.applicant) await updateApplicant(modal.applicant.id, data);
      else await createApplicant(data);
      setNotice(modal.applicant ? "Applicant updated successfully." : "Applicant added successfully.");
      setModal({ open: false, applicant: null });
      await load();
    } catch { setActionError("Could not save the applicant. Please try again."); }
    finally { mutationPending.current = false; setBusy(false); }
  }
  async function remove(item) {
    if (mutationPending.current || !window.confirm(`Delete ${item.applicantName}? This permanently removes their recruitment record.`)) return;
    mutationPending.current = true; setBusy(true); setActionError(""); setNotice("");
    try { await deleteApplicant(item.id); setNotice("Applicant deleted successfully."); await load(); }
    catch { setActionError("Could not delete the applicant. Please try again."); }
    finally { mutationPending.current = false; setBusy(false); }
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-6">
      <header className="flex flex-col justify-between gap-5 pt-1 sm:flex-row sm:items-center">
        <div><p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-indigo-600">Recruitment workspace</p><h1 className="text-3xl font-bold tracking-tight text-slate-950">Applicants</h1><p className="mt-2 text-sm text-slate-500">Your talent directory. Find candidates, review progress, and keep every record up to date.</p></div>
        <div className="flex shrink-0 items-center gap-2"><button aria-label="Refresh applicants" disabled={loading || busy} onClick={load} className={`rounded-xl border border-slate-200 bg-white p-3 text-slate-500 hover:bg-slate-100 disabled:opacity-50 ${focus}`}><RefreshCw size={17} className={loading ? "animate-spin motion-reduce:animate-none" : ""} /></button><button disabled={busy} onClick={() => openModal()} className={`inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50 ${focus}`}><Plus size={18} /> Add applicant</button></div>
      </header>
      {loadError && <div role="alert" className="flex flex-wrap justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{loadError}<button onClick={load} className={`font-semibold underline ${focus}`}>Try again</button></div>}
      {notice && <div role="status" className="flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{notice}<button aria-label="Dismiss notification" onClick={() => setNotice("")} className={`rounded p-1 ${focus}`}><X size={16} /></button></div>}
      <section aria-label="Applicant overview" aria-busy={loading} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(([label, value, detail, Icon, color]) => <div key={label} className={`${panel} p-5`}><div className="flex items-center justify-between gap-2"><p className="text-sm font-medium text-slate-500">{label}</p><span className={`rounded-xl p-2.5 ${color}`}><Icon size={19} /></span></div><p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 tabular-nums">{loading || loadError ? "—" : value.toLocaleString()}</p><p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p></div>)}</section>
      <section className={`${panel} overflow-hidden`} aria-busy={loading}>
        <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:px-6"><div className="flex items-center gap-3"><h2 className="font-semibold text-slate-900">Applicant directory</h2><span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600">{loading || loadError ? "—" : filtered.length}</span></div><p className="text-xs text-slate-500">All records · All time</p></div>
        <div className="space-y-3 border-t border-slate-100 px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="relative min-w-0 flex-1"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input aria-label="Search applicants" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name, email, role or phone…" className={`w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm placeholder:text-slate-400 ${focus}`} /></div>
            <label className="flex items-center gap-2 text-xs text-slate-500">Sort by<select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} className={`${control} flex-1 md:flex-none`}><option value="newest">Recently added</option><option value="oldest">Oldest added</option><option value="applied">Application date</option><option value="name">Name: A to Z</option></select></label>
          </div>
          <div className="flex flex-wrap items-center gap-2"><span className="mr-1 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500"><SlidersHorizontal size={14} /> Filters{filterCount > 0 && ` (${filterCount})`}</span><select aria-label="Filter by status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className={`${control} max-w-full`}><option value="">All statuses</option>{statuses.map((value) => <option key={value}>{value}</option>)}</select><select aria-label="Filter by source" value={source} onChange={(event) => { setSource(event.target.value); setPage(1); }} className={`${control} max-w-full`}><option value="">All sources</option>{sources.map((value) => <option key={value}>{value}</option>)}</select>{hasFilters && <button onClick={resetFilters} className={`inline-flex items-center gap-1 rounded-lg px-2 py-2 text-xs font-medium text-indigo-600 hover:bg-indigo-50 ${focus}`}><X size={13} /> Clear filters</button>}</div>
        </div>
        <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="border-y border-slate-100 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-500"><tr>{["Applicant", "Position", "Date applied", "Source", "Status", "Actions"].map((label) => <th scope="col" key={label} className={`px-5 py-3 font-semibold ${label === "Actions" ? "text-right" : ""}`}>{label}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">{!loading && !loadError && visible.map((item) => <tr key={item.id} className="transition hover:bg-slate-50/70">
            <td className="px-5 py-4"><div className="flex items-center gap-3"><span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-600">{(item.applicantName || "?").trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("")}</span><div><button disabled={busy} onClick={() => openModal(item)} className={`rounded text-left font-semibold text-slate-800 hover:text-indigo-600 ${focus}`}>{item.applicantName || "Unnamed applicant"}</button><p className="mt-0.5 text-xs text-slate-500">{item.email || "No email provided"}</p>{item.contactNumber && <p className="mt-1 text-[11px] text-slate-400">{item.contactNumber}</p>}</div></div></td>
            <td className="max-w-56 px-5 py-4 text-slate-600">{item.positionAppliedFor || "Not specified"}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(item.dateApplied)}</td><td className="px-5 py-4"><span className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600">{item.source?.trim() || "Unspecified"}</span></td><td className="px-5 py-4"><StatusBadge status={item.status || "Unspecified"} /></td>
            <td className="px-5 py-4"><div className="flex justify-end gap-1"><button disabled={busy} aria-label={`Edit ${item.applicantName}`} title="Edit applicant" onClick={() => openModal(item)} className={`rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50 ${focus}`}><Pencil size={16} /></button><button disabled={busy} aria-label={`Delete ${item.applicantName}`} title="Delete applicant" onClick={() => remove(item)} className={`rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 ${focus}`}><Trash2 size={16} /></button></div></td>
          </tr>)}
          {(loading || loadError || !visible.length) && <tr><td colSpan={6} className="px-6 py-16 text-center"><span className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-slate-100"><Users size={24} className="text-slate-400" /></span><p role="status" className="font-semibold text-slate-700">{loading ? "Loading applicants…" : loadError ? "Applicant records are unavailable" : hasFilters ? "No matching applicants" : "Build your talent directory"}</p>{!loading && !loadError && <><p className="mt-2 text-xs text-slate-500">{hasFilters ? "Try a different search or clear your filters." : "Add your first applicant to start tracking recruitment progress."}</p><button onClick={hasFilters ? resetFilters : () => openModal()} className={`mt-4 rounded-lg bg-indigo-50 px-4 py-2 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 ${focus}`}>{hasFilters ? "Clear filters" : "Add applicant"}</button></>}</td></tr>}
          </tbody>
        </table></div>
        <footer className="flex flex-col justify-between gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:px-6"><span aria-live="polite">{loading ? "Loading records…" : loadError ? "Data unavailable" : `Showing ${filtered.length ? offset + 1 : 0}–${Math.min(offset + pageSize, filtered.length)} of ${filtered.length} applicants`}</span><div className="flex flex-wrap items-center gap-3"><label className="flex items-center gap-2">Rows<select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} className="rounded-md border border-slate-200 bg-white p-1.5 focus-visible:outline-indigo-500">{[10, 25, 50].map((size) => <option key={size}>{size}</option>)}</select></label><div className="flex items-center gap-2"><button aria-label="Previous page" disabled={currentPage === 1 || loading || !!loadError} onClick={() => setPage(currentPage - 1)} className={`rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 ${focus}`}><ChevronLeft size={15} /></button><span className="tabular-nums">{currentPage} / {pageCount}</span><button aria-label="Next page" disabled={currentPage === pageCount || loading || !!loadError} onClick={() => setPage(currentPage + 1)} className={`rounded-lg border border-slate-200 p-2 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-35 ${focus}`}><ChevronRight size={15} /></button></div></div></footer>
      </section>
      {actionError && <div role="alert" className="fixed bottom-5 left-1/2 z-[100] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 shadow-lg">{actionError}<button aria-label="Dismiss error" onClick={() => setActionError("")} className={`rounded p-1 ${focus}`}><X size={16} /></button></div>}
      <ApplicantModal open={modal.open} applicant={modal.applicant} onClose={() => { if (!busy) { setModal({ open: false, applicant: null }); setActionError(""); } }} onSave={save} />
    </div>
  );
}
