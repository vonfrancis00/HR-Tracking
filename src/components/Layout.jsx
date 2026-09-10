import { useState } from "react";
import { Menu, ChevronRight, CalendarDays, LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout({ children, user, onLogout }) {
  const location = useLocation();
  const pageName = location.pathname === "/" ? "Overview" : "Applicants";
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell min-h-screen">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      {mobileOpen && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-slate-900/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-brand-blue-100 bg-white/95 px-4 backdrop-blur md:px-8">
          <button aria-label="Open navigation" aria-expanded={mobileOpen} className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu size={21} />
          </button>

          <div className="hidden items-center gap-2 text-sm text-slate-500 md:flex">
            <span className="text-slate-400">Workspace</span><ChevronRight size={14} /><span className="font-semibold text-slate-800">{pageName}</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden items-center gap-2 pr-2 text-xs text-slate-500 xl:flex"><CalendarDays size={15} />{new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</div>
            <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-blue-50 ring-4 ring-white text-sm font-bold text-brand-blue-900">
                {(user?.fullName || user?.email || "HR").slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-slate-800">{user?.fullName || "Demo User"}</div>
                <div className="text-xs text-slate-500">{user?.role || "Super Admin"}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-red-600"
            >
              <LogOut size={14} />
              <span className="hover:text-white hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        <main className="p-4 md:p-8 xl:px-10">{children}</main>
      </div>
    </div>
  );
}