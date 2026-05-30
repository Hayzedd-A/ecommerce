/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import crypto from "crypto";
import {
  PaymentProvider,
  PaymentInitResult,
  PaymentVerifyResult,
  WebhookVerifyResult,
} from "./types";

export class MonnifyProvider implements PaymentProvider {
  name = "monnify";
  private apiKey: string;
  private secretKey: string;
  private contractCode: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MONNIFY_API_KEY || "";
    this.secretKey = process.env.MONNIFY_SECRET_KEY || "";
    this.contractCode = process.env.MONNIFY_CONTRACT_CODE || "";
    this.baseUrl =
      process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com";
  }

  /**
   * Helper to retrieve access token from Monnify
   */
  private async getAccessToken(): Promise<string> {
    if (!this.apiKey || !this.secretKey) {
      throw new Error(
        "Monnify API credentials are not configured in environment variables.",
      );
    }

    const authHeader = Buffer.from(`${this.apiKey}:${this.secretKey}`).toString(
      "base64",
    );

    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/auth/login`,
        {},
        {
          headers: {
            Authorization: `Basic ${authHeader}`,
          },
        },
      );

      if (
        response.data?.requestSuccessful &&
        response.data?.responseBody?.accessToken
      ) {
        return response.data.responseBody.accessToken;
      }
      throw new Error(
        response.data?.responseMessage || "Authentication failed",
      );
    } catch (error: any) {
      console.error(
        "Monnify auth error:",
        error?.response?.data || error.message,
      );
      throw new Error(`Monnify auth failed: ${error.message}`);
    }
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
      const token = await this.getAccessToken();
      const payload = {
        amount: params.amount,
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        paymentReference: params.paymentReference,
        paymentDescription: params.description || "Product purchase",
        currencyCode: "NGN",
        contractCode: this.contractCode,
        redirectUrl: params.callbackUrl,
        metadata: params.metadata || {},
        paymentMethods: [
          "CARD",
          "ACCOUNT_TRANSFER",
          "USSD",
          "DIRECT_DEBIT",
          "PHONE_NUMBER",
        ],
      };

      const response = await axios.post(
        `${this.baseUrl}/api/v1/merchant/transactions/init-transaction`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const body = response.data;
      if (body?.requestSuccessful) {
        return {
          success: true,
          paymentReference: params.paymentReference,
          checkoutUrl: body.responseBody.checkoutUrl,
          gatewayResponse: body.responseBody,
        };
      }

      return {
        success: false,
        paymentReference: params.paymentReference,
        message: body?.responseMessage || "Initialization failed",
      };
    } catch (error: any) {
      console.error(
        "Monnify init error:",
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
      const token = await this.getAccessToken();
      const response = await axios.get(
        `${this.baseUrl}/api/v1/merchant/transactions/query?paymentReference=${encodeURIComponent(
          reference,
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const body = response.data;
      if (body?.requestSuccessful && body?.responseBody) {
        const tr = body.responseBody;
        let status: PaymentVerifyResult["status"] = "pending";

        if (tr.paymentStatus === "PAID") {
          status = "paid";
        } else if (tr.paymentStatus === "FAILED") {
          status = "failed";
        } else if (tr.paymentStatus === "EXPIRED") {
          status = "expired";
        } else if (
          tr.paymentStatus === "OVERPAID" ||
          tr.paymentStatus === "PARTIALLY_PAID"
        ) {
          status = "paid"; // Depending on business logic, partially paid might be treated separately, but we'll accept it
        }

        return {
          success: tr.paymentStatus === "PAID",
          status,
          amount: tr.amount,
          reference: tr.paymentReference,
          gatewayResponse: tr,
        };
      }

      return {
        success: false,
        status: "pending",
        amount: 0,
        reference,
        message: body?.responseMessage || "Verification query failed",
      };
    } catch (error: any) {
      console.error(
        "Monnify verify error:",
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
      const signature = headers["monnify-signature"];
      if (!signature) {
        return { isValid: false };
      }

      // SHA512 hash computed as hex of (clientSecret + rawBody)
      const computedSignature = crypto
        .createHmac("sha512", this.secretKey)
        .update(rawBody)
        .digest("hex");

      const isValid = computedSignature === signature;
      if (!isValid) {
        return { isValid: false };
      }

      const body = JSON.parse(rawBody);
      const eventData = body.eventData || {};

      let status: "paid" | "failed" | "pending" = "pending";
      if (eventData.paymentStatus === "PAID") {
        status = "paid";
      } else if (eventData.paymentStatus === "FAILED") {
        status = "failed";
      }

      return {
        isValid: true,
        reference: eventData.paymentReference,
        status,
        amount: eventData.amount,
        gatewayResponse: body,
      };
    } catch (error) {
      console.error("Webhook signature verification error:", error);
      return { isValid: false };
    }
  }

  async requeryTransaction(reference: string): Promise<PaymentVerifyResult> {
    return this.verifyPayment(reference);
  }
}
