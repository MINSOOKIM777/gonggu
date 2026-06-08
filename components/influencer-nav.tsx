"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Search, ClipboardList, Users, ShoppingBag, Wallet, UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/influencer", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/influencer/profile", label: "채널 정보", icon: UserCircle },
  { href: "/influencer/products", label: "상품 둘러보기", icon: Search },
  { href: "/influencer/applications", label: "판매 신청 내역", icon: ClipboardList },
  { href: "/influencer/group-buys", label: "공동구매", icon: Users },
  { href: "/influencer/orders", label: "주문", icon: ShoppingBag },
  { href: "/influencer/settlements", label: "정산", icon: Wallet },
];

export function InfluencerNav() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-white border-r border-zinc-200">
      <div className="px-6 py-5 border-b border-zinc-200">
        <p className="text-sm font-semibold text-zinc-900">인플루언서센터</p>
      </div>
      <nav className="flex flex-col gap-1 p-3">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-zinc-100 font-medium text-zinc-900"
                  : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
