export default function StatCard({ label, value, icon: Icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p>
        </div>
        <div className="rounded-xl bg-slate-100 p-2.5 text-slate-700 group-hover:bg-brand-blue-600 group-hover:text-white">
          <Icon size={19} />
        </div>
      </div>
    </button>
  );
}