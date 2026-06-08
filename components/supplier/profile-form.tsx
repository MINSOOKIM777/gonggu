"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveSupplierProfile } from "@/app/actions/supplier-profile";
import type { Supplier } from "@/types/db";

type Props = {
  initial: Supplier | null;
};

export function SupplierProfileForm({ initial }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await saveSupplierProfile(formData);
      if (result.ok) setSuccess(true);
      else setError(result.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-700">사업자 정보</h2>

        <div className="space-y-1.5">
          <Label htmlFor="business_name">상호 *</Label>
          <Input
            id="business_name"
            name="business_name"
            defaultValue={initial?.business_name ?? ""}
            placeholder="사업체명"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="business_number">사업자등록번호</Label>
          <Input
            id="business_number"
            name="business_number"
            defaultValue={initial?.business_number ?? ""}
            placeholder="000-00-00000"
            maxLength={20}
          />
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-zinc-700">정산 계좌</h2>
        <p className="text-xs text-zinc-400">공동구매 판매 대금이 지급될 계좌 정보를 입력해 주세요.</p>

        <div className="space-y-1.5">
          <Label htmlFor="settlement_bank">은행명</Label>
          <Input
            id="settlement_bank"
            name="settlement_bank"
            defaultValue={initial?.settlement_bank ?? ""}
            placeholder="예: 국민은행"
            maxLength={50}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="settlement_account">계좌번호</Label>
          <Input
            id="settlement_account"
            name="settlement_account"
            defaultValue={initial?.settlement_account ?? ""}
            placeholder="숫자만 입력"
            maxLength={30}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">저장되었습니다.</p>}

      <Button type="submit" disabled={isPending}>
        {isPending ? "저장 중..." : "저장"}
      </Button>
    </form>
  );
}
