import { createServiceClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";
import type { Role } from "@/types/db";

type ProfileRow = {
  id: string;
  role: Role;
  name: string;
  phone: string | null;
  created_at: string;
};

const ROLE_LABEL: Record<Role, string> = {
  customer: "구매자",
  supplier: "공급자",
  influencer: "인플루언서",
};

function roleVariant(role: Role): "default" | "brand" | "outline" | "muted" {
  if (role === "supplier") return "default";
  if (role === "influencer") return "brand";
  return "muted";
}

export default async function AdminUsersPage() {
  const service = createServiceClient();
  const { data } = await service
    .from("profiles")
    .select("id, role, name, phone, created_at")
    .order("created_at", { ascending: false })
    .returns<ProfileRow[]>();

  const rows = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">사용자</h1>
        <p className="mt-1 text-sm text-zinc-500">
          가입된 모든 사용자 목록입니다. 총 {rows.length.toLocaleString("ko-KR")}명
        </p>
      </div>

      {rows.length === 0 ? (
        <EmptyState title="사용자가 없습니다" />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-left text-zinc-600">
              <tr>
                <th className="px-4 py-3 font-medium">이름</th>
                <th className="px-4 py-3 font-medium">역할</th>
                <th className="px-4 py-3 font-medium">전화번호</th>
                <th className="px-4 py-3 font-medium">가입일</th>
                <th className="px-4 py-3 font-medium">ID</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-3 text-zinc-900">{p.name}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant(p.role)}>{ROLE_LABEL[p.role]}</Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-700">{p.phone ?? "-"}</td>
                  <td className="px-4 py-3 text-zinc-700 whitespace-nowrap">
                    {formatDate(p.created_at)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">
                    {p.id.slice(0, 8)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
