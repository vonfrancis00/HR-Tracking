const statusStyles = {
  "New Applicant": "bg-slate-100 text-slate-700",
  "For Screening": "bg-brand-blue-100 text-brand-blue-700",
  "For Initial Interview": "bg-brand-blue-100 text-brand-blue-700",
  "For Recommendation": "bg-brand-blue-100 text-brand-blue-700",
  "Recommended for Final Interview": "bg-brand-blue-100 text-brand-blue-700",
  "For Final Interview": "bg-brand-yellow-100 text-brand-yellow-700",
  "Passed for Hiring": "bg-brand-green-100 text-brand-green-700",
  "For Employment Processing": "bg-brand-yellow-100 text-brand-yellow-700",
  "For Background Checking": "bg-brand-blue-100 text-brand-blue-700",
  "Ready for Onboarding": "bg-brand-green-100 text-brand-green-700",
  "Not Qualified": "bg-red-100 text-red-700",
  "Not Recommended": "bg-red-100 text-red-700",
  "Not Selected": "bg-red-100 text-red-700",
  "Applicant Withdrew": "bg-slate-200 text-slate-700",
  "No Show": "bg-rose-100 text-rose-700",
  "Requirements Incomplete": "bg-brand-yellow-100 text-brand-yellow-700",
  "Talent Pool": "bg-brand-green-100 text-brand-green-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ring-current/10 ${statusStyles[status] || "bg-slate-100 text-slate-700"}`}>
      <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
}