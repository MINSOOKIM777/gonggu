export function formatKRW(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
