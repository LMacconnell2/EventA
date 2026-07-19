import type {
  PaymentGateway,
  PaymentGatewayRegistry,
} from "./paymentGateway.js";

import { stripe } from "./stripe.js";
import { StripePaymentGateway } from
  "./stripePaymentGateway.js";

class DefaultPaymentGatewayRegistry
  implements PaymentGatewayRegistry
{
  private readonly gateways = new Map<
    string,
    PaymentGateway
  >();

  register(gateway: PaymentGateway): void {
    this.gateways.set(
      gateway.providerName.toLowerCase(),
      gateway,
    );
  }

  get(
    providerName: string,
  ): PaymentGateway | undefined {
    return this.gateways.get(
      providerName.toLowerCase(),
    );
  }
}

const registry =
  new DefaultPaymentGatewayRegistry();

const webhookSecret =
  process.env.STRIPE_WEBHOOK_SECRET;

if (!webhookSecret) {
  throw new Error(
    "STRIPE_WEBHOOK_SECRET is not configured.",
  );
}

registry.register(
  new StripePaymentGateway(
    stripe,
    webhookSecret,
  ),
);

export const paymentGateways = registry;