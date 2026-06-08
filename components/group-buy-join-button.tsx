"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { joinGroupBuy } from "@/app/actions/group-buy";
import { saveShippingAddress, deleteShippingAddress } from "@/app/actions/shipping-addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ShippingAddress } from "@/types/db";

type Props = {
  groupBuyId: string;
  joinable: boolean;
  disabledLabel?: string;
  maxPerUser: number;
  isLoggedIn: boolean;
  savedAddresses: ShippingAddress[];
};

type AddressFormState = {
  recipient_name: string;
  recipient_phone: string;
  address: string;
  address_detail: string;
};

const EMPTY_FORM: AddressFormState = {
  recipient_name: "",
  recipient_phone: "",
  address: "",
  address_detail: "",
};

const NEW_ID = "__new__";

export function GroupBuyJoinButton({
  groupBuyId,
  joinable,
  disabledLabel,
  maxPerUser,
  isLoggedIn,
  savedAddresses: initialAddresses,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [addresses, setAddresses] = useState<ShippingAddress[]>(initialAddresses);
  const [selectedId, setSelectedId] = useState<number | typeof NEW_ID>(
    initialAddresses.length > 0 ? initialAddresses[0].id : NEW_ID,
  );
  const [showAddForm, setShowAddForm] = useState(initialAddresses.length === 0);
  const [newForm, setNewForm] = useState<AddressFormState>(EMPTY_FORM);
  const [addError, setAddError] = useState<string | null>(null);
  const [addPending, startAddTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  if (!joinable) {
    return (
      <Button type="button" size="lg" className="h-12 w-full" disabled>
        {disabledLabel ?? "참여할 수 없습니다"}
      </Button>
    );
  }

  if (!isLoggedIn) {
    return (
      <Button
        type="button"
        size="lg"
        className="h-12 w-full"
        onClick={() => router.push(`/login?redirect=/group-buys/${groupBuyId}`)}
      >
        로그인 후 참여하기
      </Button>
    );
  }

  const selected = selectedId === NEW_ID ? null : addresses.find((a) => a.id === selectedId) ?? null;

  function handleAddFormChange(field: keyof AddressFormState, value: string) {
    setNewForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSaveAddress() {
    setAddError(null);
    const formData = new FormData();
    formData.set("recipient_name", newForm.recipient_name);
    formData.set("recipient_phone", newForm.recipient_phone);
    formData.set("address", newForm.address);
    formData.set("address_detail", newForm.address_detail);

    startAddTransition(async () => {
      const result = await saveShippingAddress(formData);
      if (!result.ok) {
        setAddError(result.error);
        return;
      }
      setAddresses((prev) => [...prev, result.address]);
      setSelectedId(result.address.id);
      setShowAddForm(false);
      setNewForm(EMPTY_FORM);
    });
  }

  function handleDeleteAddress(id: number) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteShippingAddress(id);
      if (result.ok) {
        const remaining = addresses.filter((a) => a.id !== id);
        setAddresses(remaining);
        if (selectedId === id) {
          setSelectedId(remaining.length > 0 ? remaining[0].id : NEW_ID);
          if (remaining.length === 0) setShowAddForm(true);
        }
      }
      setDeletingId(null);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting || pending) return;
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("group_buy_id", groupBuyId);

    if (selected) {
      formData.set("recipient_name", selected.recipient_name);
      formData.set("recipient_phone", selected.recipient_phone);
      formData.set("address", selected.address);
      formData.set("address_detail", selected.address_detail ?? "");
    } else {
      setError("배송지를 선택하거나 추가해주세요.");
      return;
    }

    setSubmitting(true);
    const result = await joinGroupBuy(formData);
    if (!result.ok) {
      setError(result.error);
      setSubmitting(false);
      return;
    }
    router.push(`/orders/${result.orderId}`);
  }

  if (!open) {
    return (
      <Button type="button" size="lg" className="h-12 w-full" onClick={() => setOpen(true)}>
        공동구매 참여하기
      </Button>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4">
      {/* 수량 */}
      <div className="space-y-1.5">
        <Label htmlFor="quantity">수량</Label>
        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={1}
          max={maxPerUser}
          step={1}
          defaultValue={1}
          required
        />
        <p className="text-[11px] text-zinc-500">1인 최대 {maxPerUser}개까지 구매 가능합니다.</p>
      </div>

      {/* 배송지 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>배송지</Label>
          <button
            type="button"
            onClick={() => {
              setShowAddForm(true);
              setSelectedId(NEW_ID);
              setAddError(null);
            }}
            className="flex items-center gap-1 rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-50"
          >
            <Plus className="h-3 w-3" />
            새 배송지
          </button>
        </div>

        {addresses.length > 0 && (
          <div className="space-y-2">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                onClick={() => {
                  setSelectedId(addr.id);
                  setShowAddForm(false);
                }}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors",
                  selectedId === addr.id
                    ? "border-[var(--brand)] bg-red-50"
                    : "border-zinc-200 hover:border-zinc-300",
                )}
              >
                <div className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2",
                  selectedId === addr.id ? "border-[var(--brand)] bg-[var(--brand)]" : "border-zinc-300",
                )}>
                  {selectedId === addr.id && <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />}
                </div>
                <div className="flex-1 min-w-0 text-sm">
                  <p className="font-medium text-zinc-900">
                    {addr.recipient_name}
                    <span className="ml-2 font-normal text-zinc-500">{addr.recipient_phone}</span>
                  </p>
                  <p className="text-zinc-600 truncate">{addr.address}</p>
                  {addr.address_detail && <p className="text-zinc-500">{addr.address_detail}</p>}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr.id); }}
                  disabled={deletingId === addr.id}
                  className="shrink-0 rounded p-1 text-zinc-400 hover:text-red-500 disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddForm && (
          <div className="rounded-lg border border-dashed border-zinc-300 p-3 space-y-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="new_recipient_name" className="text-xs">받는 사람</Label>
                <Input
                  id="new_recipient_name"
                  value={newForm.recipient_name}
                  onChange={(e) => handleAddFormChange("recipient_name", e.target.value)}
                  placeholder="홍길동"
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="new_recipient_phone" className="text-xs">연락처</Label>
                <Input
                  id="new_recipient_phone"
                  value={newForm.recipient_phone}
                  onChange={(e) => handleAddFormChange("recipient_phone", e.target.value)}
                  placeholder="010-0000-0000"
                  inputMode="tel"
                  className="h-8 text-sm"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="new_address" className="text-xs">주소</Label>
              <Input
                id="new_address"
                value={newForm.address}
                onChange={(e) => handleAddFormChange("address", e.target.value)}
                placeholder="서울특별시 강남구 ..."
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new_address_detail" className="text-xs">상세주소</Label>
              <Input
                id="new_address_detail"
                value={newForm.address_detail}
                onChange={(e) => handleAddFormChange("address_detail", e.target.value)}
                placeholder="동/호수 등 (선택)"
                className="h-8 text-sm"
              />
            </div>

            {addError && <p className="text-xs text-red-600">{addError}</p>}

            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={handleSaveAddress} disabled={addPending} className="text-xs">
                {addPending ? "저장 중..." : "배송지 저장"}
              </Button>
              {addresses.length > 0 && (
                <Button
                  type="button" size="sm" variant="ghost"
                  onClick={() => { setShowAddForm(false); setSelectedId(addresses[addresses.length - 1].id); }}
                  className="text-xs"
                >
                  취소
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button
          type="button" variant="outline" size="lg" className="h-12"
          onClick={() => setOpen(false)}
          disabled={submitting || pending}
        >
          취소
        </Button>
        <Button
          type="submit" size="lg" className="h-12 flex-1"
          disabled={submitting || pending || !selected}
        >
          {submitting ? "처리 중..." : "참여하기"}
        </Button>
      </div>
    </form>
  );
}
