import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  ArrowUpRight,
  X,
  BriefcaseBusiness
} from "lucide-react";

const links = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/applicants", label: "Applicants", icon: Users },
  { to: "/applicants/new", label: "Add Applicant", icon: UserPlus },
];

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <aside className={`app-sidebar fixed inset-y-0 left-0 z-40 w-64 border-r border-white/10 bg-brand-blue-900 text-white transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex h-20 shrink-0 items-center gap-3 border-b border-white/10 px-5">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-white text-brand-blue-900 shadow-lg">
          <BriefcaseBusiness size={19} />
        </div>
        <div>
          <div className="font-bold text-white">Applicant Tracker</div>
          <div className="text-[11px] text-white/80">HR Recruitment System</div>
        </div>
      </div>

      <button aria-label="Close navigation" onClick={onClose} className="absolute right-2 top-2 rounded-lg p-1 text-white/80 lg:hidden"><X size={16} /></button>
      <p className="px-6 pb-3 pt-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-blue-200">Workspace</p>
      <nav aria-label="Main navigation" className="space-y-2 px-3">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition focus-visible:outline-brand-yellow-500 ${
                isActive
                  ? "bg-white text-brand-blue-900 shadow-lg"
                  : "text-white/90 hover:bg-white/15 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto px-4 pb-5 pt-10">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
          <div className="mb-3 h-1 w-8 rounded-full bg-brand-yellow-500" />
          <p className="text-sm font-semibold">Great teams start here.</p>
          <p className="mt-2 text-xs leading-5 text-blue-100/80">Find the right people. Keep every step of their journey in view.</p>
          <NavLink to="/applicants/new" onClick={onClose} className="mt-4 inline-flex items-center gap-2 rounded text-xs font-semibold text-brand-yellow-500">Add an applicant <ArrowUpRight size={14} /></NavLink>
        </div>
        <div className="mt-5 flex items-center gap-2 px-2 text-[10px] tracking-wide text-blue-200"><span className="h-1.5 w-1.5 rounded-full bg-brand-green-500" /> HR Recruitment System</div>
      </div>
    </aside>
  );
}
