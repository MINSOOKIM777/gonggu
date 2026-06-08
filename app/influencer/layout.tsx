import { requireInfluencer } from "@/lib/auth";
import { InfluencerNav } from "@/components/influencer-nav";

export default async function InfluencerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireInfluencer();

  return (
    <div className="mx-auto flex max-w-7xl min-h-screen">
      <InfluencerNav />
      <main className="flex-1 min-w-0 px-6 py-6">{children}</main>
    </div>
  );
}
