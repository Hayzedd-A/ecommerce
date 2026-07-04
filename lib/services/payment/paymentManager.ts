import { PaymentProvider } from "./types";
import { MonnifyProvider } from "./monnify.provider";
import { PaystackProvider } from "./paystack.provider";
import { OpayProvider } from "./opay.provider";
import StoreSettings from "@/lib/db/models/StoreSettings";
import getStoreSettings from "@/lib/settings.server";

export class PaymentManager {
  private static instance: PaymentManager;
  private providers: Map<string, PaymentProvider> = new Map();
  private defaultProviderName: string = "monnify";

  private constructor() {
    // Register Monnify
    const monnify = new MonnifyProvider();
    this.providers.set(monnify.name, monnify);

    // Register Paystack
    const paystack = new PaystackProvider();
    this.providers.set(paystack.name, paystack);

    // Register OPay
    const opay = new OpayProvider();
    this.providers.set(opay.name, opay);

    // Default can be set via env var or falls back to monnify
    const envProvider = process.env.PAYMENT_PROVIDER_DEFAULT;
    if (envProvider && this.providers.has(envProvider)) {
      this.defaultProviderName = envProvider;
    }
  }

  public static getInstance(): PaymentManager {
    if (!PaymentManager.instance) {
      PaymentManager.instance = new PaymentManager();
    }
    return PaymentManager.instance;
  }

  /**
   * Register a new payment provider dynamically
   */
  public registerProvider(provider: PaymentProvider): void {
    this.providers.set(provider.name, provider);
  }

  /**
   * Get payment provider by name, or return the default one
   */
  public getProvider(name?: string): PaymentProvider {
    const providerName = name || this.defaultProviderName;
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Payment provider "${providerName}" is not registered.`);
    }
    return provider;
  }

  /**
   * Get the active provider from database settings and configure it
   */
  public async getActivatedProvider(): Promise<PaymentProvider> {
    const settings = await getStoreSettings();
    const active = settings.paymentSettings?.activeProvider || "monnify";
    const provider = this.getProvider(active);

    if (active === "monnify" && settings.paymentSettings?.monnify) {
      provider.setConfig(settings.paymentSettings.monnify);
    } else if (active === "paystack" && settings.paymentSettings?.paystack) {
      provider.setConfig(settings.paymentSettings.paystack);
    } else if (active === "opay" && settings.paymentSettings?.opay) {
      provider.setConfig(settings.paymentSettings.opay);
    }

    return provider;
  }

  /**
   * Get a specific provider and configure it from database settings
   */
  public async getConfiguredProvider(name: string): Promise<PaymentProvider> {
    const settings = await getStoreSettings();
    const provider = this.getProvider(name);

    if (name === "monnify" && settings.paymentSettings?.monnify) {
      provider.setConfig(settings.paymentSettings.monnify);
    } else if (name === "paystack" && settings.paymentSettings?.paystack) {
      provider.setConfig(settings.paymentSettings.paystack);
    } else if (name === "opay" && settings.paymentSettings?.opay) {
      provider.setConfig(settings.paymentSettings.opay);
    }

    return provider;
  }

  /**
   * Get list of registered provider names
   */
  public getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Export singleton instance of PaymentManager
export const paymentManager = PaymentManager.getInstance();
export type {
  PaymentProvider,
  PaymentInitResult,
  PaymentVerifyResult,
  WebhookVerifyResult,
} from "./types";
