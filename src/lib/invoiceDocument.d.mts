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
  amount: number;
}
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
}
export function paymentNote(inv: Pick<ApiInvoice, 'paidVia' | 'promoCode' | 'total'>): string;
export function toInvoiceMission(inv: ApiInvoice): InvoiceDocumentMission;
