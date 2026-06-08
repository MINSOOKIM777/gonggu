"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Store,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "대시보드", icon: LayoutDashboard, exact: true },
  { href: "/admin/orders", label: "주문", icon: ShoppingBag },
  { href: "/admin/users", label: "사용자", icon: Users },
  { href: "/admin/sellers", label: "판매자", icon: Store },
  { href: "/admin/settlements", label: "정산", icon: Wallet },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 bg-zinc-50 border-r border-zinc-200">
      <div className="px-6 py-5 border-b border-zinc-200">
        <p className="text-sm font-semibold text-zinc-900">관리자</p>
        <p className="mt-0.5 text-xs text-zinc-500">Marketplace Admin</p>
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
                  ? "bg-white font-medium text-zinc-900 shadow-sm border border-zinc-200"
                  : "text-zinc-600 hover:bg-white hover:text-zinc-900",
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
