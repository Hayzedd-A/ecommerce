/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PaymentInitResult {
  success: boolean;
  paymentReference: string;
  checkoutUrl?: string;
  gatewayResponse?: any;
  message?: string;
}

export interface PaymentVerifyResult {
  success: boolean;
  status: "paid" | "failed" | "pending" | "reversed" | "expired";
  amount: number;
  reference: string;
  gatewayResponse?: any;
  message?: string;
}

export interface WebhookVerifyResult {
  isValid: boolean;
  reference?: string;
  status?: "paid" | "failed" | "pending";
  amount?: number;
  gatewayResponse?: any;
}

export interface PaymentProvider {
  name: string;
  initializePayment(params: {
    amount: number;
    customerEmail: string;
    customerName: string;
    paymentReference: string;
    callbackUrl: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentInitResult>;

  verifyPayment(reference: string): Promise<PaymentVerifyResult>;

  verifyWebhook(headers: Record<string, any>, rawBody: string): Promise<WebhookVerifyResult>;

  requeryTransaction(reference: string): Promise<PaymentVerifyResult>;
}
