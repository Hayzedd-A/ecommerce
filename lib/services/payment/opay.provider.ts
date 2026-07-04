/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import crypto from "crypto";
import {
  PaymentProvider,
  PaymentInitResult,
  PaymentVerifyResult,
  WebhookVerifyResult,
} from "./types";

/**
 * Recursively sorts object keys alphabetically. OPay requires the request
 * body to be sorted this way before it is stringified and HMAC-signed for
 * any endpoint other than cashier/create (which is authenticated with the
 * public key directly).
 */
function sortObject(value: any): any {
  if (Array.isArray(value)) return value.map(sortObject);
  if (value && typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((acc: Record<string, any>, key) => {
        acc[key] = sortObject(value[key]);
        return acc;
      }, {});
  }
  return value;
}

export class OpayProvider implements PaymentProvider {
  name = "opay";
  private publicKey: string = "";
  private secretKey: string = "";
  private merchantId: string = "";
  private baseUrl: string = "https://sandboxapi.opaycheckout.com";

  constructor() {
    // Credentials will be set via setConfig
  }

  setConfig(config: {
    publicKey: string;
    secretKey: string;
    merchantId: string;
    baseUrl?: string;
  }): void {
    this.publicKey = config.publicKey || "";
    this.secretKey = config.secretKey || "";
    this.merchantId = config.merchantId || "";
    this.baseUrl = config.baseUrl || "https://sandboxapi.opaycheckout.com";
  }

  private assertConfigured(): void {
    if (!this.publicKey || !this.secretKey || !this.merchantId) {
      throw new Error("OPay credentials are not configured.");
    }
  }

  /** HMAC-SHA512 of the alphabetically-sorted JSON body, signed with the secret key. */
  private signBody(body: Record<string, any>): string {
    const sorted = JSON.stringify(sortObject(body));
    return crypto.createHmac("sha512", this.secretKey).update(sorted).digest("hex");
  }

  async initializePayment(params: {
    amount: number;
    customerEmail: string;
    customerName: string;
    paymentReference: string;
    callbackUrl: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentInitResult> {
    try {
      this.assertConfigured();

      const amountInKobo = Math.round(params.amount * 100); // OPay expects amount in the smallest currency unit

      const payload = {
        country: "NG",
        reference: params.paymentReference,
        amount: {
          total: amountInKobo,
          currency: "NGN",
        },
        returnUrl: params.callbackUrl,
        callbackUrl: params.callbackUrl,
        cancelUrl: params.callbackUrl,
        userInfo: {
          userEmail: params.customerEmail,
          userName: params.customerName,
        },
        productList: [
          {
            productId: params.paymentReference,
            name: params.description || "Order payment",
            description: params.description || "Order payment",
            price: amountInKobo,
            quantity: 1,
          },
        ],
      };

      const response = await axios.post(
        `${this.baseUrl}/api/v1/international/cashier/create`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
            MerchantId: this.merchantId,
            "Content-Type": "application/json",
          },
        },
      );

      const body = response.data;
      if (body?.code === "00000" && body?.data?.cashierUrl) {
        return {
          success: true,
          paymentReference: params.paymentReference,
          checkoutUrl: body.data.cashierUrl,
          gatewayResponse: body.data,
        };
      }

      return {
        success: false,
        paymentReference: params.paymentReference,
        message: body?.message || "Initialization failed",
      };
    } catch (error: any) {
      console.error("OPay init error:", error?.response?.data || error.message);
      return {
        success: false,
        paymentReference: params.paymentReference,
        message: error.message,
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    try {
      this.assertConfigured();

      const payload = { reference, country: "NG" };
      const signature = this.signBody(payload);

      const response = await axios.post(
        `${this.baseUrl}/api/v1/international/cashier/status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${signature}`,
            MerchantId: this.merchantId,
            "Content-Type": "application/json",
          },
        },
      );

      const body = response.data;
      if (body?.code === "00000" && body?.data) {
        const tr = body.data;
        let status: PaymentVerifyResult["status"] = "pending";

        if (tr.status === "SUCCESS") {
          status = "paid";
        } else if (tr.status === "FAIL") {
          status = "failed";
        } else if (tr.status === "CLOSE") {
          status = "expired";
        }

        return {
          success: tr.status === "SUCCESS",
          status,
          amount: (tr.amount?.total ?? 0) / 100,
          reference: tr.reference,
          gatewayResponse: tr,
        };
      }

      return {
        success: false,
        status: "pending",
        amount: 0,
        reference,
        message: body?.message || "Verification query failed",
      };
    } catch (error: any) {
      console.error("OPay verify error:", error?.response?.data || error.message);
      return {
        success: false,
        status: "failed",
        amount: 0,
        reference,
        message: error.message,
      };
    }
  }

  async verifyWebhook(
    _headers: Record<string, any>,
    rawBody: string,
  ): Promise<WebhookVerifyResult> {
    try {
      const body = JSON.parse(rawBody);
      const payload = body?.payload;
      const receivedSignature = body?.sha512;
      if (!payload || !receivedSignature) {
        return { isValid: false };
      }

      const refunded = payload.refunded ?? payload.Refunded;

      // Fixed field order/format required by OPay's callback signature spec.
      const signString =
        `{Amount:"${payload.amount ?? payload.Amount}",` +
        `Currency:"${payload.currency ?? payload.Currency}",` +
        `Reference:"${payload.reference ?? payload.Reference}",` +
        `Refunded:${refunded ? "t" : "f"},` +
        `Status:"${payload.status ?? payload.Status}",` +
        `Timestamp:"${payload.timestamp ?? payload.Timestamp}",` +
        `Token:"${payload.token ?? payload.Token}",` +
        `TransactionID:"${payload.transactionId ?? payload.TransactionID}"}`;

      const computedSignature = crypto
        .createHmac("sha3-512", this.secretKey)
        .update(signString)
        .digest("hex");

      if (
        computedSignature.toLowerCase() !==
        String(receivedSignature).toLowerCase()
      ) {
        return { isValid: false };
      }

      const rawStatus = String(
        payload.status ?? payload.Status ?? "",
      ).toUpperCase();
      let status: "paid" | "failed" | "pending" = "pending";
      if (rawStatus === "SUCCESS") {
        status = "paid";
      } else if (rawStatus === "FAIL" || rawStatus === "CLOSE") {
        status = "failed";
      }

      const amount = Number(payload.amount ?? payload.Amount ?? 0);

      return {
        isValid: true,
        reference: payload.reference ?? payload.Reference,
        status,
        amount: amount / 100,
        gatewayResponse: body,
      };
    } catch (error) {
      console.error("OPay webhook verification error:", error);
      return { isValid: false };
    }
  }

  async requeryTransaction(reference: string): Promise<PaymentVerifyResult> {
    return this.verifyPayment(reference);
  }
}
