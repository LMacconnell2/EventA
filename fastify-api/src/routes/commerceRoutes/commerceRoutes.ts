import type {
  FastifyInstance,
  FastifyPluginAsync,
  preHandlerHookHandler,
} from "fastify";
import type { Pool } from "pg";

import type {
  PaymentGatewayRegistry,
} from "../../lib/paymentGateway.js";

import { OrderService } from "../../services/commerce/orderService.js";
import { PaymentService } from "../../services/commerce/paymentService.js";
import { RefundService } from "../../services/commerce/refundService.js";
import { AttendeeService } from "../../services/commerce/attendeeService.js";
import { CheckinService } from "../../services/commerce/checkinService.js";
import { PublicCheckoutService } from "../../services/commerce/publicCheckoutService.js";

import {
  createCommerceControllers,
} from "../../controllers/commerceControllers.js";

import type {
  AttendeeListQuery,
  ConfirmationQuery,
  CreateCheckinBody,
  CreateCheckoutBody,
  CreatePublicOrderBody,
  CreateRefundBody,
  EventCheckinListQuery,
  IdParams,
  OrderListQuery,
  PaymentListQuery,
  RefundListQuery,
  UpdateAttendeeBody,
  UpdateOrderStatusBody,
} from "../../types/commerceTypes.js";

export type CommerceRoutesOptions = {
  pool: Pool;

  authenticate: preHandlerHookHandler;

  authorize: (
    permission: string,
  ) => preHandlerHookHandler;

  authorizeAny?: (
    permissions: string[],
  ) => preHandlerHookHandler;

  paymentGateways: PaymentGatewayRegistry;

  optionalAuthenticate?: preHandlerHookHandler;
};

const commerceRoutes: FastifyPluginAsync<
  CommerceRoutesOptions
> = async (
  app: FastifyInstance,
  options: CommerceRoutesOptions,
) => {
  const controllers = createCommerceControllers({
    orders: new OrderService(options.pool),

    payments: new PaymentService(
      options.pool,
      options.paymentGateways,
    ),

    refunds: new RefundService(
      options.pool,
      options.paymentGateways,
    ),

    attendees: new AttendeeService(options.pool),

    checkins: new CheckinService(options.pool),

    publicCheckout: new PublicCheckoutService(
      options.pool,
      options.paymentGateways,
    ),
  });

  const secured = (permission: string) => ({
    preHandler: [
      options.authenticate,
      options.authorize(permission),
    ],
  });

  app.get<{
    Querystring: OrderListQuery;
  }>(
    "/api/orders",
    secured("orders.view"),
    controllers.listOrders,
  );

  app.get<{
    Params: IdParams;
  }>(
    "/api/orders/:orderId",
    secured("orders.view"),
    controllers.getOrder,
  );

  app.patch<{
    Params: IdParams;
    Body: UpdateOrderStatusBody;
  }>(
    "/api/orders/:orderId/status",
    secured("orders.edit"),
    controllers.updateOrderStatus,
  );

  app.get<{
    Params: IdParams;
    Querystring: OrderListQuery;
  }>(
    "/api/events/:eventId/orders",
    secured("orders.view"),
    controllers.listEventOrders,
  );

  app.get<{
    Querystring: PaymentListQuery;
  }>(
    "/api/payments",
    secured("orders.view"),
    controllers.listPayments,
  );

  app.get<{
    Params: IdParams;
  }>(
    "/api/payments/:paymentId",
    secured("orders.view"),
    controllers.getPayment,
  );

  app.get<{
    Params: IdParams;
    Querystring: PaymentListQuery;
  }>(
    "/api/events/:eventId/payments",
    secured("orders.view"),
    controllers.listEventPayments,
  );

  app.post<{
    Params: IdParams;
  }>(
    "/api/payments/webhooks/:provider",
    controllers.paymentWebhook,
  );

  app.get<{
    Querystring: RefundListQuery;
  }>(
    "/api/refunds",
    secured("orders.view"),
    controllers.listRefunds,
  );

  app.get<{
    Params: IdParams;
  }>(
    "/api/refunds/:refundId",
    secured("orders.view"),
    controllers.getRefund,
  );

  app.post<{
    Params: IdParams;
    Body: CreateRefundBody;
  }>(
    "/api/payments/:paymentId/refunds",
    secured("orders.refund"),
    controllers.createRefund,
  );

  app.get<{
    Params: IdParams;
    Querystring: RefundListQuery;
  }>(
    "/api/events/:eventId/refunds",
    secured("orders.view"),
    controllers.listEventRefunds,
  );

  app.get<{
    Querystring: AttendeeListQuery;
  }>(
    "/api/attendees",
    secured("attendees.view"),
    controllers.listAttendees,
  );

  app.get<{
    Params: IdParams;
  }>(
    "/api/attendees/:attendeeId",
    secured("attendees.view"),
    controllers.getAttendee,
  );

  app.patch<{
    Params: IdParams;
    Body: UpdateAttendeeBody;
  }>(
    "/api/attendees/:attendeeId",
    secured("attendees.edit"),
    controllers.updateAttendee,
  );

  app.get<{
    Params: IdParams;
    Querystring: AttendeeListQuery;
  }>(
    "/api/events/:eventId/attendees",
    secured("attendees.view"),
    controllers.listEventAttendees,
  );

  app.get<{
    Params: IdParams;
    Querystring: EventCheckinListQuery;
  }>(
    "/api/events/:eventId/checkins",
    secured("attendees.view"),
    controllers.listEventCheckins,
  );

  app.post<{
    Params: IdParams;
    Body: CreateCheckinBody;
  }>(
    "/api/events/:eventId/checkins",
    {
      preHandler: options.authorizeAny
        ? [
            options.authenticate,
            options.authorizeAny([
              "attendees.checkin",
              "events.manage",
            ]),
          ]
        : [
            options.authenticate,
            options.authorize(
              "attendees.checkin",
            ),
          ],
    },
    controllers.createCheckin,
  );

  app.delete<{
    Params: IdParams;
  }>(
    "/api/events/:eventId/checkins/:checkinId",
    {
      preHandler: options.authorizeAny
        ? [
            options.authenticate,
            options.authorizeAny([
              "attendees.checkin",
              "events.manage",
            ]),
          ]
        : [
            options.authenticate,
            options.authorize(
              "attendees.checkin",
            ),
          ],
    },
    controllers.deleteCheckin,
  );

  const optionalAuth = options.optionalAuthenticate
    ? {
        preHandler: [
          options.optionalAuthenticate,
        ],
      }
    : {};

  app.post<{
    Params: IdParams;
    Body: CreateCheckoutBody;
  }>(
    "/api/public/events/:eventId/checkout",
    optionalAuth,
    controllers.createCheckout,
  );

  app.post<{
    Params: IdParams;
    Body: CreatePublicOrderBody;
  }>(
    "/api/public/events/:eventId/orders",
    optionalAuth,
    controllers.createPublicOrder,
  );

  app.get<{
    Params: IdParams;
    Querystring: ConfirmationQuery;
  }>(
    "/api/public/events/:eventId/orders/:orderReference/confirmation",
    optionalAuth,
    controllers.getPublicConfirmation,
  );

  app.post<{
    Params: IdParams;
  }>(
    "/api/public/events/:eventId/checkout/:checkoutToken/release",
    controllers.releaseCheckout,
  );
};

export default commerceRoutes;
