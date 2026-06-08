"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type TabKey = "detail" | "shipping";

export function ProductTabs({ description }: { description: string | null }) {
  const [active, setActive] = useState<TabKey>("detail");

  return (
    <div>
      <div className="border-b border-zinc-200 flex">
        <TabButton
          active={active === "detail"}
          onClick={() => setActive("detail")}
        >
          상품상세
        </TabButton>
        <TabButton
          active={active === "shipping"}
          onClick={() => setActive("shipping")}
        >
          배송/교환/반품 안내
        </TabButton>
      </div>

      {active === "detail" ? (
        <div className="max-w-2xl mx-auto py-8 whitespace-pre-wrap text-sm text-zinc-800 leading-6">
          {description?.trim() || "상품 설명이 없습니다."}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto py-8 text-sm text-zinc-800 leading-7 space-y-6">
          <section>
            <h3 className="font-bold text-zinc-900 mb-2">배송 안내</h3>
            <ul className="list-disc pl-5 space-y-1 text-zinc-700">
              <li>모든 상품은 무료배송으로 제공됩니다.</li>
              <li>오후 2시 이전 결제 완료 시 당일 출고됩니다.</li>
              <li>도서산간 지역은 배송이 1~2일 추가 소요될 수 있습니다.</li>
              <li>주문 후 평균 2~3일 이내 수령 가능합니다.</li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-zinc-900 mb-2">교환 및 반품 안내</h3>
            <ul className="list-disc pl-5 space-y-1 text-zinc-700">
              <li>상품 수령 후 7일 이내 교환·반품 신청이 가능합니다.</li>
              <li>
                단순 변심에 의한 교환·반품의 경우 왕복 배송비가 부과됩니다.
              </li>
              <li>
                상품 불량 또는 오배송 시 배송비는 판매자가 부담합니다.
              </li>
              <li>
                개봉 후 사용하셨거나 상품 가치가 훼손된 경우 교환·반품이
                제한됩니다.
              </li>
            </ul>
          </section>

          <section>
            <h3 className="font-bold text-zinc-900 mb-2">유의사항</h3>
            <p className="text-zinc-700">
              상품 상세 정보와 실제 상품이 다를 경우 즉시 고객센터로 문의해
              주세요. 신속히 처리해 드리겠습니다.
            </p>
          </section>
        </div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-6 py-3 text-sm font-medium -mb-px border-b-2 transition-colors",
        active
          ? "border-zinc-900 text-zinc-900"
          : "border-transparent text-zinc-500 hover:text-zinc-700",
      )}
    >
      {children}
    </button>
  );
}
