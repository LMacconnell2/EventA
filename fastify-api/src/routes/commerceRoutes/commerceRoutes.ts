// src/routes/commerceRoutes/commerceRoutes.ts

import type { FastifyInstance } from "fastify";

import { db } from "../../database/db.js";

import { authenticate } from "../../auth/authenticate.js";
import {
  authorizeAny,
} from "../../auth/authorize.js";
import {
  optionalAuthenticate,
} from "../../auth/optionalAuthenticate.js";

import {
  paymentGateways,
} from "../../lib/paymentGateways.js";

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
  PaymentProviderParams,
} from "../../types/commerceTypes.js";

const canViewOrders = authorizeAny([
  "orders.view",
]);

const canEditOrders = authorizeAny([
  "orders.edit",
]);

const canRefundOrders = authorizeAny([
  "orders.refund",
]);

const canViewAttendees = authorizeAny([
  "attendees.view",
  "events.manage",
]);

const canEditAttendees = authorizeAny([
  "attendees.edit",
  "events.manage",
]);

const canCheckInAttendees = authorizeAny([
  "attendees.checkin",
  "events.manage",
]);

export default async function commerceRoutes(
  app: FastifyInstance,
) {
  const orderService = new OrderService(db);

  const paymentService = new PaymentService(
    db,
    paymentGateways,
  );

  const refundService = new RefundService(
    db,
    paymentGateways,
  );

  const attendeeService = new AttendeeService(db);

  const checkinService = new CheckinService(db);

  const publicCheckoutService =
    new PublicCheckoutService(
      db,
      paymentGateways,
    );

  const controllers = createCommerceControllers({
    orders: orderService,
    payments: paymentService,
    refunds: refundService,
    attendees: attendeeService,
    checkins: checkinService,
    publicCheckout: publicCheckoutService,
  });

  /*
   * Orders
   */

  app.get<{
    Querystring: OrderListQuery;
  }>(
    "/api/orders",
    {
      preHandler: [
        authenticate,
        canViewOrders,
      ],
    },
    controllers.listOrders,
  );

  app.get<{
    Params: IdParams;
  }>(
    "/api/orders/:orderId",
    {
      preHandler: [
        authenticate,
        canViewOrders,
      ],
    },
    controllers.getOrder,
  );

  app.patch<{
    Params: IdParams;
    Body: UpdateOrderStatusBody;
  }>(
    "/api/orders/:orderId/status",
    {
      preHandler: [
        authenticate,
        canEditOrders,
      ],
    },
    controllers.updateOrderStatus,
  );

  app.get<{
    Params: IdParams;
    Querystring: OrderListQuery;
  }>(
    "/api/events/:eventId/orders",
    {
      preHandler: [
        authenticate,
        canViewOrders,
      ],
    },
    controllers.listEventOrders,
  );

  /*
   * Payments
   */

  app.get<{
    Querystring: PaymentListQuery;
  }>(
    "/api/payments",
    {
      preHandler: [
        authenticate,
        canViewOrders,
      ],
    },
    controllers.listPayments,
  );

  app.get<{
    Params: IdParams;
  }>(
    "/api/payments/:paymentId",
    {
      preHandler: [
        authenticate,
        canViewOrders,
      ],
    },
    controllers.getPayment,
  );

  app.get<{
    Params: IdParams;
    Querystring: PaymentListQuery;
  }>(
    "/api/events/:eventId/payments",
    {
      preHandler: [
        authenticate,
        canViewOrders,
      ],
    },
    controllers.listEventPayments,
  );

  /*
   * Payment webhooks
   *
   * This route must not use authenticate.
   * Provider signature verification happens in
   * the payment gateway adapter.
   */

  app.post<{
    Params: PaymentProviderParams;
  }>(
    "/api/payments/webhooks/:provider",
    {
      config: {
        rawBody: true,
      },
    },
    controllers.paymentWebhook,
  );

  /*
   * Refunds
   */

  app.get<{
    Querystring: RefundListQuery;
  }>(
    "/api/refunds",
    {
      preHandler: [
        authenticate,
        canViewOrders,
      ],
    },
    controllers.listRefunds,
  );

  app.get<{
    Params: IdParams;
  }>(
    "/api/refunds/:refundId",
    {
      preHandler: [
        authenticate,
        canViewOrders,
      ],
    },
    controllers.getRefund,
  );

  app.post<{
    Params: IdParams;
    Body: CreateRefundBody;
  }>(
    "/api/payments/:paymentId/refunds",
    {
      preHandler: [
        authenticate,
        canRefundOrders,
      ],
    },
    controllers.createRefund,
  );

  app.get<{
    Params: IdParams;
    Querystring: RefundListQuery;
  }>(
    "/api/events/:eventId/refunds",
    {
      preHandler: [
        authenticate,
        canViewOrders,
      ],
    },
    controllers.listEventRefunds,
  );

  /*
   * Attendees
   */

  app.get<{
    Querystring: AttendeeListQuery;
  }>(
    "/api/attendees",
    {
      preHandler: [
        authenticate,
        canViewAttendees,
      ],
    },
    controllers.listAttendees,
  );

  app.get<{
    Params: IdParams;
  }>(
    "/api/attendees/:attendeeId",
    {
      preHandler: [
        authenticate,
        canViewAttendees,
      ],
    },
    controllers.getAttendee,
  );

  app.patch<{
    Params: IdParams;
    Body: UpdateAttendeeBody;
  }>(
    "/api/attendees/:attendeeId",
    {
      preHandler: [
        authenticate,
        canEditAttendees,
      ],
    },
    controllers.updateAttendee,
  );

  // THIS IS A DUPLICATE ROUTE FOR LISTING EVENT ATTENDEES, BUT IT'S COMMENTED OUT.
  // THE ROUTE IS ALSO DEFINED IN attendeeRoutes.ts, WHICH IS THE PREFERRED LOCATION.
  // KEEPING THIS COMMENTED OUT FOR REFERENCE, BUT IT SHOULD NOT BE USED.
  // app.get<{
  //   Params: IdParams;
  //   Querystring: AttendeeListQuery;
  // }>(
  //   "/api/events/:eventId/attendees",
  //   {
  //     preHandler: [
  //       authenticate,
  //       canViewAttendees,
  //     ],
  //   },
  //   controllers.listEventAttendees,
  // );

  /*
   * Check-ins
   */

  app.get<{
    Params: IdParams;
    Querystring: EventCheckinListQuery;
  }>(
    "/api/events/:eventId/checkins",
    {
      preHandler: [
        authenticate,
        canViewAttendees,
      ],
    },
    controllers.listEventCheckins,
  );

  app.post<{
    Params: IdParams;
    Body: CreateCheckinBody;
  }>(
    "/api/events/:eventId/checkins",
    {
      preHandler: [
        authenticate,
        canCheckInAttendees,
      ],
    },
    controllers.createCheckin,
  );

  app.delete<{
    Params: IdParams;
  }>(
    "/api/events/:eventId/checkins/:checkinId",
    {
      preHandler: [
        authenticate,
        canCheckInAttendees,
      ],
    },
    controllers.deleteCheckin,
  );

  /*
   * Public checkout
   *
   * optionalAuthenticate should populate appUser
   * when a valid session exists, but must not return
   * 401 when there is no session.
   */

  app.post<{
    Params: IdParams;
    Body: CreateCheckoutBody;
  }>(
    "/api/public/events/:eventId/checkout",
    {
      preHandler: [
        optionalAuthenticate,
      ],
    },
    controllers.createCheckout,
  );

  app.post<{
    Params: IdParams;
    Body: CreatePublicOrderBody;
  }>(
    "/api/public/events/:eventId/orders",
    {
      preHandler: [
        optionalAuthenticate,
      ],
    },
    controllers.createPublicOrder,
  );

  app.get<{
    Params: IdParams;
    Querystring: ConfirmationQuery;
  }>(
    "/api/public/events/:eventId/orders/:orderReference/confirmation",
    {
      preHandler: [
        optionalAuthenticate,
      ],
    },
    controllers.getPublicConfirmation,
  );

  app.post<{
    Params: IdParams;
  }>(
    "/api/public/events/:eventId/checkout/:checkoutToken/release",
    controllers.releaseCheckout,
  );
}
