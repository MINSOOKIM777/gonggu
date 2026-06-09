import Link from "next/link";
import { User, Users, Package, LayoutDashboard } from "lucide-react";
import { getProfile } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function Header() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-zinc-200">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="text-2xl font-bold text-[var(--brand)] shrink-0 tracking-tight">
          공구이음
        </Link>

        <div className="flex-1" />

        <nav className="hidden md:flex items-center gap-1">
          <Link
            href="/group-buys"
            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-zinc-700 hover:bg-zinc-100 hover:text-[var(--brand)]"
          >
            <Users className="h-4 w-4" />
            공동구매
          </Link>
        </nav>

        <div className="flex items-center gap-1 shrink-0">
          {profile ? (
            <>
              <Link
                href="/orders"
                className="flex flex-col items-center justify-center w-14 text-xs text-zinc-700 hover:text-[var(--brand)]"
              >
                <User className="h-5 w-5" />
                <span className="mt-0.5">주문내역</span>
              </Link>

              {profile.role === "supplier" && (
                <Link
                  href="/supplier"
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-[var(--brand)] border border-zinc-200"
                >
                  <Package className="h-4 w-4" />
                  공급자센터
                </Link>
              )}

              {profile.role === "influencer" && (
                <Link
                  href="/influencer"
                  className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-[var(--brand)] border border-zinc-200"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  인플루언서센터
                </Link>
              )}

              <div className="hidden md:flex items-center gap-2 ml-2 pl-3 border-l border-zinc-200">
                <span className="text-xs text-zinc-700">{profile.name}님</span>
                <form action="/logout" method="POST">
                  <Button type="submit" variant="ghost" size="sm" className="text-zinc-600 h-7 px-2">
                    로그아웃
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm text-zinc-700 hover:text-[var(--brand)] px-3 py-2">
                로그인
              </Link>
              <Link href="/signup">
                <Button size="sm">회원가입</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
