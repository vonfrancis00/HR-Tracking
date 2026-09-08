const statusStyles = {
  "New Applicant": "bg-slate-100 text-slate-700",
  "For Screening": "bg-blue-100 text-blue-700",
  "For Initial Interview": "bg-indigo-100 text-indigo-700",
  "For Recommendation": "bg-violet-100 text-violet-700",
  "Recommended for Final Interview": "bg-purple-100 text-purple-700",
  "For Final Interview": "bg-amber-100 text-amber-700",
  "Passed for Hiring": "bg-emerald-100 text-emerald-700",
  "For Employment Processing": "bg-orange-100 text-orange-700",
  "For Background Checking": "bg-cyan-100 text-cyan-700",
  "Ready for Onboarding": "bg-green-100 text-green-700",
  "Not Qualified": "bg-red-100 text-red-700",
  "Not Recommended": "bg-red-100 text-red-700",
  "Not Selected": "bg-red-100 text-red-700",
  "Applicant Withdrew": "bg-slate-200 text-slate-700",
  "No Show": "bg-rose-100 text-rose-700",
  "Requirements Incomplete": "bg-yellow-100 text-yellow-700",
  "Talent Pool": "bg-teal-100 text-teal-700",
};

export default function StatusBadge({ status }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || "bg-slate-100 text-slate-700"}`}>
      {status}
    </span>
  );
}