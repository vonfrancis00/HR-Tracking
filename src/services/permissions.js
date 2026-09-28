export function isSuperAdmin(user) {
  return String(user?.role || "").trim().toLowerCase() === "super admin";
}
