/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import crypto from "crypto";
import {
  PaymentProvider,
  PaymentInitResult,
  PaymentVerifyResult,
  WebhookVerifyResult,
} from "./types";

export class PaystackProvider implements PaymentProvider {
  name = "paystack";
  private secretKey: string = "";
  private publicKey: string = "";
  private baseUrl: string = "https://api.paystack.co";

  constructor() {
    // Credentials will be set via setConfig
  }

  setConfig(config: { secretKey: string; publicKey: string }): void {
    this.secretKey = config.secretKey || "";
    this.publicKey = config.publicKey || "";
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
      if (!this.secretKey) {
        throw new Error("Paystack secret key is not configured.");
      }

      const payload = {
        amount: Math.round(params.amount * 100), // Paystack expects amount in kobo
        email: params.customerEmail,
        reference: params.paymentReference,
        callback_url: params.callbackUrl,
        metadata: {
          ...(params.metadata || {}),
          full_name: params.customerName,
          description: params.description,
        },
      };

      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
          },
        },
      );

      const body = response.data;
      if (body?.status) {
        return {
          success: true,
          paymentReference: params.paymentReference,
          checkoutUrl: body.data.authorization_url,
          gatewayResponse: body.data,
        };
      }

      return {
        success: false,
        paymentReference: params.paymentReference,
        message: body?.message || "Initialization failed",
      };
    } catch (error: any) {
      console.error(
        "Paystack init error:",
        error?.response?.data || error.message,
      );
      return {
        success: false,
        paymentReference: params.paymentReference,
        message: error.message,
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResult> {
    try {
      if (!this.secretKey) {
        throw new Error("Paystack secret key is not configured.");
      }

      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
          },
        },
      );

      const body = response.data;
      if (body?.status && body?.data) {
        const tr = body.data;
        let status: PaymentVerifyResult["status"] = "pending";

        if (tr.status === "success") {
          status = "paid";
        } else if (tr.status === "failed") {
          status = "failed";
        } else if (tr.status === "reversed") {
          status = "reversed";
        }

        return {
          success: tr.status === "success",
          status,
          amount: tr.amount / 100, // Convert back from kobo
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
      console.error(
        "Paystack verify error:",
        error?.response?.data || error.message,
      );
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
    headers: Record<string, any>,
    rawBody: string,
  ): Promise<WebhookVerifyResult> {
    try {
      const signature = headers["x-paystack-signature"];
      if (!signature) {
        return { isValid: false };
      }

      const computedSignature = crypto
        .createHmac("sha512", this.secretKey)
        .update(rawBody)
        .digest("hex");

      const isValid = computedSignature === signature;
      if (!isValid) {
        return { isValid: false };
      }

      const body = JSON.parse(rawBody);
      const data = body.data || {};

      let status: "paid" | "failed" | "pending" = "pending";
      if (body.event === "charge.success") {
        status = "paid";
      } else if (body.event === "charge.failed") {
        status = "failed";
      }

      return {
        isValid: true,
        reference: data.reference,
        status,
        amount: data.amount / 100,
        gatewayResponse: body,
      };
    } catch (error) {
      console.error("Paystack webhook verification error:", error);
      return { isValid: false };
    }
  }

  async requeryTransaction(reference: string): Promise<PaymentVerifyResult> {
    return this.verifyPayment(reference);
  }
}
