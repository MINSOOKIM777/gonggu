export const DEFAULT_COMMISSION_RATE = 0.2;

export const ORDER_STATUS_LABEL: Record<string, string> = {
  pending: "결제대기",
  paid: "결제완료",
  cancelled: "취소",
  failed: "결제실패",
};

export const SETTLEMENT_STATUS_LABEL: Record<string, string> = {
  pending: "정산대기",
  paid: "정산완료",
};

export const DELIVERY_STATUS_LABEL: Record<string, string> = {
  ready: "배송준비",
  shipped: "배송중",
  delivered: "배송완료",
  cancelled: "취소",
};

export const GROUP_BUY_STATUS_LABEL: Record<string, string> = {
  open: "모집중",
  closed: "마감",
  success: "공구 성공",
  failed: "공구 실패",
  cancelled: "취소",
};

export const APPLICATION_STATUS_LABEL: Record<string, string> = {
  pending: "검토중",
  approved: "승인됨",
  rejected: "거절됨",
};
