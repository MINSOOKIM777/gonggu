"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

import { createClient } from "@/lib/supabase/client";
import { signupSupplierProfile } from "@/app/actions/auth";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

type Role = "customer" | "supplier" | "influencer";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [role, setRole] = React.useState<Role>("customer");

  // supplier fields
  const [businessName, setBusinessName] = React.useState("");
  const [businessNumber, setBusinessNumber] = React.useState("");
  const [settlementBank, setSettlementBank] = React.useState("");
  const [settlementAccount, setSettlementAccount] = React.useState("");

  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < 6) { setError("비밀번호는 최소 6자 이상이어야 합니다."); return; }
    if (role === "supplier" && !businessName.trim()) { setError("상호를 입력해주세요."); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { role, name, phone: phone || null } },
      });

      if (signUpError) { setError(signUpError.message); return; }

      if (data.user && !data.session) {
        setInfo(
          role === "supplier"
            ? "이메일 인증 후 로그인해 주세요. 로그인 후 [내 정보]에서 사업자 정보를 등록할 수 있습니다."
            : "이메일 인증 후 로그인해 주세요."
        );
        return;
      }

      if (role === "supplier") {
        const result = await signupSupplierProfile({
          business_name: businessName,
          business_number: businessNumber || null,
          settlement_bank: settlementBank || null,
          settlement_account: settlementAccount || null,
        });
        if (!result.ok) { setError(result.error); return; }
      }

      router.refresh();
      if (role === "supplier") router.push("/supplier");
      else if (role === "influencer") router.push("/influencer");
      else router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "회원가입 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  if (info) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>회원가입 완료</CardTitle>
          <CardDescription>{info}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/login"><Button className="w-full">로그인 페이지로</Button></Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>회원가입</CardTitle>
        <CardDescription>공구이음에 오신 것을 환영합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3 mb-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setGoogleLoading(true);
              const supabase = createClient();
              const siteUrl = window.location.origin;
              const nextPath = role === "influencer" ? "/influencer" : role === "supplier" ? "/supplier" : "/";
              supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                  redirectTo: `${siteUrl}/api/auth/callback?next=${encodeURIComponent(nextPath)}${role !== "customer" ? `&role=${role}` : ""}`,
                },
              });
            }}
            disabled={googleLoading}
            className="w-full flex items-center gap-2"
          >
            <GoogleIcon />
            {googleLoading ? "이동 중..." : "Google로 계속하기"}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-zinc-400">또는 이메일로 가입</span>
            </div>
          </div>
        </div>

        <form className="flex flex-col gap-4" onSubmit={onSubmit}>

          {/* 회원 유형 — 인플루언서/공급자만 선택, 기본은 구매자 */}
          <div className="flex flex-col gap-2">
            <Label>회원 유형</Label>
            <div className="grid grid-cols-1 gap-2">
              {([
                { r: "influencer" as Role, label: "인플루언서", desc: "내 채널로 공동구매를 진행하고 싶어요" },
                { r: "supplier" as Role, label: "공급자", desc: "상품을 올리고 인플루언서에게 판매를 맡기고 싶어요" },
              ]).map(({ r, label, desc }) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    role === r ? "border-[var(--brand)] bg-red-50" : "border-zinc-200 hover:bg-zinc-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={role === r}
                    onChange={() => setRole(r)}
                    className="accent-[var(--brand)]"
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{label}</p>
                    <p className="text-xs text-zinc-500">{desc}</p>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              공동구매 참여만 하실 분은 유형을 선택하지 않아도 됩니다.
            </p>
          </div>

          <Separator />

          <div className="flex flex-col gap-2">
            <Label htmlFor="name">이름</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input id="password" type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="text-xs text-zinc-500">최소 6자 이상</p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">전화번호</Label>
            <Input id="phone" type="tel" placeholder="선택 입력" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          {role === "supplier" && (
            <>
              <Separator className="my-1" />
              <p className="text-sm font-semibold">공급자 정보</p>
              <div className="flex flex-col gap-2">
                <Label htmlFor="business_name">상호 *</Label>
                <Input id="business_name" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="business_number">사업자번호</Label>
                <Input id="business_number" placeholder="선택 입력" value={businessNumber} onChange={(e) => setBusinessNumber(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="settlement_bank">정산은행</Label>
                <Input id="settlement_bank" placeholder="선택 입력" value={settlementBank} onChange={(e) => setSettlementBank(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="settlement_account">정산계좌</Label>
                <Input id="settlement_account" placeholder="선택 입력" value={settlementAccount} onChange={(e) => setSettlementAccount(e.target.value)} />
              </div>
            </>
          )}

          {role === "influencer" && (
            <>
              <Separator className="my-1" />
              <p className="text-xs text-zinc-500 bg-zinc-50 rounded-md p-3">
                가입 후 <strong>채널 정보</strong> 메뉴에서 인스타그램, 유튜브 등 채널 링크와 핸들을 등록하고, 원하는 상품에 판매 신청을 할 수 있어요.
              </p>
            </>
          )}

          {error && <p className="text-sm text-[var(--brand)]" role="alert">{error}</p>}

          <Button type="submit" disabled={loading} className="mt-2">
            {loading ? "가입 중..." : "회원가입"}
          </Button>

          <p className="text-sm text-center text-zinc-600 mt-2">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="text-[var(--brand)] font-medium hover:underline">로그인</Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
