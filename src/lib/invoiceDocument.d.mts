export interface ApiInvoice {
  invoiceId: string;
  missionId: string;
  missionStatement: string;
  goalType: string | null;
  respondentCount: number;
  date: string;
  status: string;
  paidVia: 'stripe' | 'promo' | 'admin' | 'unrecorded';
  promoCode: string | null;
  itemised: boolean;
  lines: { base: number; targetingSurcharge: number; extraQuestionsCost: number; discount: number };
  total: number;
  /** Refunded in Stripe; absent on responses from before refunds were recorded. */
  refunded?: number;
  net?: number;
  amount: number;
}
export type InvoiceStatus = 'paid' | 'partially_refunded' | 'refunded';
export interface InvoiceDocumentMission {
  id: string;
  title: string;
  total_price_usd: number;
  base_cost_usd: number;
  targeting_surcharge_usd: number;
  extra_questions_cost_usd: number;
  discount_usd: number;
  promo_code: string | null;
  respondent_count: number;
  paid_at: string;
  goal_type: string;
  payment_note: string;
  refunded_usd: number;
  net_usd: number;
  status: InvoiceStatus;
  badge: 'PAID' | 'REFUNDED' | 'PART REFUNDED';
  total_label: 'TOTAL PAID' | 'NET PAID';
}
export function refundFigures(inv: Pick<ApiInvoice, 'total' | 'amount' | 'refunded' | 'net'>): { total: number; refunded: number; net: number; status: InvoiceStatus };
export function statusLabel(status: InvoiceStatus): { text: string; badge: InvoiceDocumentMission['badge']; tone: 'paid' | 'partial' | 'refunded' };
export function paymentNote(inv: Pick<ApiInvoice, 'paidVia' | 'promoCode' | 'total'> & Partial<Pick<ApiInvoice, 'amount' | 'refunded' | 'net'>>): string;
export function toInvoiceMission(inv: ApiInvoice): InvoiceDocumentMission;
