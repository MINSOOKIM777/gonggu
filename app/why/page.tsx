import Link from "next/link";
import { Button } from "@/components/ui/button";

const reasons = [
  {
    icon: "💰",
    title: "더 저렴하게 살 수 있어요",
    desc: "혼자 사면 정가지만, 여럿이 함께 사면 단가가 내려갑니다. 목표 수량이 모일수록 더 큰 할인 혜택을 받을 수 있어요.",
  },
  {
    icon: "✅",
    title: "인플루언서가 직접 검증한 상품",
    desc: "광고가 아닙니다. 인플루언서가 직접 써보고 팔로워들에게 추천하는 상품만 공구이음에 올라옵니다.",
  },
  {
    icon: "🤝",
    title: "믿을 수 있는 거래",
    desc: "공구이음이 공급사와 인플루언서를 모두 검증합니다. 가품, 불량품, 먹튀 걱정 없이 안전하게 구매할 수 있어요.",
  },
  {
    icon: "⚡",
    title: "한정 기회, 특별한 혜택",
    desc: "공동구매는 기간이 정해져 있어요. 그 기간에만 누릴 수 있는 특별한 가격과 혜택을 놓치지 마세요.",
  },
];

const steps = [
  { step: "01", title: "마음에 드는 공구 발견", desc: "내가 팔로우하는 인플루언서의 공동구매를 확인하세요." },
  { step: "02", title: "함께 참여", desc: "목표 수량이 채워질수록 더 좋은 조건으로 구매할 수 있어요." },
  { step: "03", title: "공구 성공 & 배송", desc: "목표 달성 시 공구가 확정되고, 상품이 배송됩니다." },
];

const comparisons = [
  { label: "가격", general: "정가 또는 소량 할인", groupbuy: "단체 구매로 최대 할인" },
  { label: "신뢰도", general: "후기만으로 판단", groupbuy: "인플루언서 직접 검증" },
  { label: "안전성", general: "판매자 신뢰에 의존", groupbuy: "플랫폼이 공급사 검증" },
  { label: "소통", general: "일방적 구매", groupbuy: "인플루언서와 함께하는 구매" },
];

export default function WhyPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-red-50 to-white border-b border-zinc-200">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <p className="text-sm font-medium text-[var(--brand)] mb-3">공동구매란?</p>
          <h1 className="text-3xl md:text-5xl font-bold text-zinc-900 leading-tight">
            혼자 사는 것보다<br />
            <span className="text-[var(--brand)]">함께 사면 더 이득</span>인 이유
          </h1>
          <p className="mt-5 text-zinc-500 text-base max-w-xl mx-auto leading-relaxed">
            공동구매는 단순히 싸게 사는 것이 아닙니다. 믿을 수 있는 사람과 함께, 검증된 상품을, 더 좋은 조건으로 구매하는 스마트한 방법이에요.
          </p>
          <div className="mt-8">
            <Link href="/group-buys">
              <Button size="lg">지금 공동구매 둘러보기</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 이유 4가지 */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-12">공동구매를 해야 하는 이유</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {reasons.map((r) => (
              <div key={r.title} className="rounded-2xl border border-zinc-200 p-8 hover:border-[var(--brand)] hover:shadow-sm transition-all">
                <div className="text-4xl mb-4">{r.icon}</div>
                <h3 className="text-lg font-bold text-zinc-900 mb-2">{r.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 일반 구매 vs 공동구매 */}
      <section className="py-20 bg-zinc-50 border-y border-zinc-200">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-10">일반 구매 vs 공동구매</h2>
          <div className="rounded-2xl overflow-hidden border border-zinc-200 bg-white">
            <div className="grid grid-cols-3 bg-zinc-100 text-sm font-semibold text-zinc-600">
              <div className="px-6 py-4">항목</div>
              <div className="px-6 py-4 text-center">일반 구매</div>
              <div className="px-6 py-4 text-center text-[var(--brand)]">공구이음 공동구매</div>
            </div>
            {comparisons.map((c, i) => (
              <div key={c.label} className={`grid grid-cols-3 text-sm ${i % 2 === 1 ? "bg-zinc-50" : ""}`}>
                <div className="px-6 py-4 font-medium text-zinc-700">{c.label}</div>
                <div className="px-6 py-4 text-center text-zinc-500">{c.general}</div>
                <div className="px-6 py-4 text-center font-medium text-zinc-800">{c.groupbuy}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 진행 방식 */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl font-bold text-zinc-900 text-center mb-12">공동구매, 이렇게 진행돼요</h2>
          <div className="flex flex-col md:flex-row gap-6">
            {steps.map((s, i) => (
              <div key={s.step} className="flex-1 text-center relative">
                <div className="w-14 h-14 rounded-full bg-red-50 text-[var(--brand)] font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {s.step}
                </div>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+2rem)] right-0 h-px bg-zinc-200" />
                )}
                <h3 className="font-bold text-zinc-900 mb-2">{s.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-red-50 to-white border-t border-zinc-200">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-zinc-900 mb-3">지금 바로 시작해보세요</h2>
          <p className="text-zinc-500 text-sm mb-8 leading-relaxed">
            진행 중인 공동구매에 참여하거나, 인플루언서로 직접 공구를 열어보세요.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/group-buys">
              <Button size="lg">공동구매 참여하기</Button>
            </Link>
            <Link href="/signup?role=influencer">
              <Button size="lg" variant="outline">인플루언서로 시작하기</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
