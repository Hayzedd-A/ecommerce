import { PaymentProvider } from "./types";
import { MonnifyProvider } from "./monnify.provider";

export class PaymentManager {
  private static instance: PaymentManager;
  private providers: Map<string, PaymentProvider> = new Map();
  private defaultProviderName: string = "monnify";

  private constructor() {
    // Register Monnify
    const monnify = new MonnifyProvider();
    this.providers.set(monnify.name, monnify);

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
   * Get list of registered provider names
   */
  public getRegisteredProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Export singleton instance of PaymentManager
export const paymentManager = PaymentManager.getInstance();
export type { PaymentProvider, PaymentInitResult, PaymentVerifyResult, WebhookVerifyResult } from "./types";
