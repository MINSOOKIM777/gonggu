import { requireSupplier } from "@/lib/auth";
import { SupplierNav } from "@/components/supplier-nav";

export default async function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSupplier();

  return (
    <div className="mx-auto flex max-w-7xl min-h-screen">
      <SupplierNav />
      <main className="flex-1 min-w-0 px-6 py-6">{children}</main>
    </div>
  );
}
