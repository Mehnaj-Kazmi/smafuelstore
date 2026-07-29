import DashboardClient from "./DashboardClient";

/** Server shell; the dashboard reads live orders so it is interactive. */
export default function AdminDashboard() {
  return <DashboardClient />;
}
