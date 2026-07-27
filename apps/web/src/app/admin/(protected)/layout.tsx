import { AdminGate } from "../../../components/admin/AdminGate";
import { AdminShell } from "../../../components/admin/AdminShell";

export default function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <AdminShell>{children}</AdminShell>
    </AdminGate>
  );
}
