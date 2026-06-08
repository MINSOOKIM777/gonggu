# UI 디자인 토큰 & 컴포넌트 가이드

## 컬러 (쿠팡 톤)
- Primary (브랜드 빨강): `#ee2e24` → Tailwind 변수 `--color-brand`
- Primary hover: `#d2261d`
- Background: 흰색
- Foreground: zinc-900
- Muted: zinc-500
- Border: zinc-200
- Success(가격 강조용 빨강 강한 톤): `#cf1421`
- Discount/sale 텍스트: `#cf1421`

## globals.css (Tailwind v4 변수)
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #18181b;
  --muted: #71717a;
  --muted-foreground: #71717a;
  --border: #e4e4e7;
  --input: #e4e4e7;
  --brand: #ee2e24;
  --brand-foreground: #ffffff;
  --brand-hover: #d2261d;
  --price: #cf1421;
  --ring: #ee2e24;
  --radius: 0.5rem;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-brand: var(--brand);
  --color-brand-foreground: var(--brand-foreground);
  --color-brand-hover: var(--brand-hover);
  --color-price: var(--price);
  --color-ring: var(--ring);
  --font-sans: var(--font-geist-sans);
}

@layer base {
  * { border-color: var(--border); }
  body { background: var(--background); color: var(--foreground); font-family: var(--font-sans), system-ui, -apple-system, sans-serif; }
}
```

## 컴포넌트 (수동 작성 — shadcn 스타일)

`components/ui/` 하위에 다음을 작성. Radix 의존 없이 단순 HTML + Tailwind + cva.

### button.tsx
- variants: `default`(brand 빨강), `outline`, `ghost`, `secondary`(zinc-900), `destructive`
- sizes: `sm`, `md`, `lg`, `icon`

```tsx
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--brand)] text-[var(--brand-foreground)] hover:bg-[var(--brand-hover)]",
        secondary: "bg-zinc-900 text-white hover:bg-zinc-800",
        outline: "border border-[var(--border)] bg-transparent hover:bg-zinc-50",
        ghost: "hover:bg-zinc-100",
        destructive: "bg-red-600 text-white hover:bg-red-700",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
export { buttonVariants };
```

### input.tsx / textarea.tsx / label.tsx / select.tsx
표준 HTML 위에 Tailwind 클래스만. 외부 의존성 없음.

### card.tsx
`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter` — 단순 div 래퍼들.

### badge.tsx
`default`(zinc), `brand`(빨강), `outline` variant.

## Header 레이아웃
```
┌──────────────────────────────────────────────────────────────────┐
│ [로고 빨강]  [────── 검색바 ──────]   [장바구니]  [로그인/이름]   │
└──────────────────────────────────────────────────────────────────┘
│ [홈] [카테고리▼] [판매자센터]                                     │
└──────────────────────────────────────────────────────────────────┘
```
- 흰 배경, 하단 1px border-zinc-200.
- 로고는 텍스트 "마켓" + 빨강.
- 검색바는 둥근 사각형 + 빨강 검색 버튼.

## 상품 카드
- 정사각형 이미지(aspect-square, object-cover, zinc-100 fallback).
- 상품명 2줄 말줄임.
- 가격: 굵게, 큰 폰트, 빨강은 할인가일 때만.

## 가격 표기
- `formatKRW(15000) → "15,000원"` (lib/format.ts).
