import { useEffect, useMemo, useState } from "react";
import { Download, RefreshCw } from "lucide-react";
import { getApplicants } from "../services/api";
import { createPdfReport, createExcelReport, saveReport } from "../services/reportExports";

const applicantCount = (count) => `${count.toLocaleString()} ${count === 1 ? "applicant" : "applicants"}`;
const clean = (value) => String(value ?? "").trim();

function groupBy(applicants, field) {
  const counts = new Map();
  applicants.forEach((applicant) => {
    const label = clean(applicant[field]) || "Unspecified";
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function buildReport(applicants) {
  if (!applicants.length) return [];
  const stages = groupBy(applicants, "status");
  const sources = groupBy(applicants, "source");
  const positions = groupBy(applicants, "positionAppliedFor");
  const countStatus = (status) => applicants.filter((item) => item.status === status).length;
  const missingContact = applicants.filter((item) => !clean(item.email) && !clean(item.contactNumber)).length;
  const missingSource = applicants.filter((item) => !clean(item.source)).length;
  const missingPosition = applicants.filter((item) => !clean(item.positionAppliedFor)).length;

  return [
    {
      title: "Recruitment overview",
      text: `The workspace currently contains ${applicantCount(applicants.length)}. Of these, ${applicantCount(countStatus("For Initial Interview") + countStatus("For Final Interview"))} ${countStatus("For Initial Interview") + countStatus("For Final Interview") === 1 ? "is" : "are"} at an initial or final interview stage, and ${applicantCount(countStatus("Ready for Onboarding"))} ${countStatus("Ready for Onboarding") === 1 ? "is" : "are"} ready for onboarding. This report covers all available records and describes their current status; it does not measure historical stage changes or completed hires.`,
    },
    {
      title: "Hiring stages",
      text: stages.map(([stage, count]) => `The “${stage}” stage currently contains ${applicantCount(count)}.`).join(" "),
    },
    {
      title: "Applicant sources",
      text: sources.map(([source, count]) => source === "Unspecified"
        ? `The source is unspecified for ${applicantCount(count)}.`
        : `The recorded source for ${applicantCount(count)} is “${source}”, representing ${(count / applicants.length * 100).toFixed(1)}% of all applicants.`).join(" "),
    },
    {
      title: "Positions applied for",
      text: positions.map(([position, count]) => position === "Unspecified"
        ? `The position is unspecified for ${applicantCount(count)}.`
        : `The “${position}” position has ${applicantCount(count)}.`).join(" "),
    },
    {
      title: "Records needing attention",
      text: missingContact || missingSource || missingPosition
        ? `${applicantCount(missingContact)} ${missingContact === 1 ? "has" : "have"} neither an email address nor a contact number. A source is missing from ${missingSource.toLocaleString()} ${missingSource === 1 ? "record" : "records"}, and a position is missing from ${missingPosition.toLocaleString()} ${missingPosition === 1 ? "record" : "records"}. Review these details in the Applicants page to improve follow-up and reporting. The same record may be included in more than one of these counts.`
        : "Every applicant record includes a source, a position, and at least one contact method. These checks confirm that details are present, but do not verify their accuracy.",
    },
  ];
}

export default function Reports() {
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState(null);
  const [exporting, setExporting] = useState("");
  const [exportError, setExportError] = useState("");
  const sections = useMemo(() => buildReport(applicants), [applicants]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setApplicants(await getApplicants());
      setUpdatedAt(new Date());
    } catch {
      setError("The report could not be loaded. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function download(format) {
    if (loading || error || exporting || !sections.length) return;
    setExporting(format);
    setExportError("");
    try {
      const blob = await (format === "pdf" ? createPdfReport : createExcelReport)(sections, updatedAt);
      saveReport(blob, `recruitment-report.${format === "pdf" ? "pdf" : "xlsx"}`);
    } catch {
      setExportError("The download could not be created. Please try again.");
    } finally {
      setExporting("");
    }
  }

  return (
    <div className="workspace-page mx-auto max-w-5xl space-y-6 pb-6">
      <header className="page-heading flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
        <div>
          <p className="mb-2 text-xs uppercase tracking-widest">Your recruitment story</p>
          <h1>Reports</h1>
          <p className="mt-2 text-sm text-slate-500">A written summary of your applicants and hiring progress.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 disabled:opacity-50">
            <RefreshCw size={16} aria-hidden="true" className={loading ? "animate-spin motion-reduce:animate-none" : ""} /> Refresh
          </button>
          {["pdf", "excel"].map((format) => <button key={format} type="button" onClick={() => download(format)} disabled={loading || !!error || !!exporting || !sections.length} className="primary-button inline-flex items-center gap-2 px-4 py-3 text-white disabled:opacity-50">
            <Download size={16} aria-hidden="true" /> Download {format === "pdf" ? "PDF" : "Excel"}
          </button>)}
        </div>
      </header>
      {exporting && <p role="status" className="text-sm text-slate-500">Preparing your {exporting === "pdf" ? "PDF" : "Excel"} download…</p>}
      {exportError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{exportError}</p>}
      <div aria-busy={loading}>
        {loading ? <p role="status" className="surface-panel p-6 text-sm text-slate-500">Preparing your report…</p>
          : error ? <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">{error} <button type="button" onClick={load} className="font-semibold underline">Try again</button></div>
          : !sections.length ? <p role="status" className="surface-panel p-6 text-sm text-slate-500">There are no applicant records to report on yet. Add an applicant in the Applicants page, then refresh this report.</p>
          : <article aria-label="Recruitment report" className="surface-panel space-y-8 p-6 sm:p-10">
            <p className="text-xs leading-6 text-slate-500">This report includes all available applicant records. Last updated {updatedAt.toLocaleString()}.</p>
            {sections.map(({ title, text }) => <section key={title}>
              <h2>{title}</h2>
              <p className="mt-3 whitespace-pre-line break-words text-sm leading-7 text-slate-600">{text}</p>
            </section>)}
          </article>}
      </div>
    </div>
  );
}
