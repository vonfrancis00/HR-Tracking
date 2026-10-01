import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Applicants from "./pages/Applicants";
import Reports from "./pages/Reports";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import { isSuperAdmin } from "./services/permissions";
import { restoreSession, logout } from "./services/api";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  function handleLogout() {
    logout().catch(() => {});
    setUser(null);
  }

  useEffect(() => {
    window.localStorage.removeItem("applicant-tracker-user");
    restoreSession().then(setUser).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-center" role="status">Loading your workspace...</div>;

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/applicants" element={<Applicants />} />
        <Route path="/applicants/new" element={<Applicants />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={isSuperAdmin(user) ? <Settings user={user} /> : <Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
