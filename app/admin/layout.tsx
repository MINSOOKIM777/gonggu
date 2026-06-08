import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin-nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="mx-auto flex max-w-7xl">
      <AdminNav />
      <main className="flex-1 min-w-0 px-6 py-6">{children}</main>
    </div>
  );
}
