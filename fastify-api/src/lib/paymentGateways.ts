import type {
  PaymentGateway,
  PaymentGatewayRegistry,
} from "./paymentGateway.js";

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

export const paymentGateways =
  new DefaultPaymentGatewayRegistry();