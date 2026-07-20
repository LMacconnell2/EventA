import type {
  FastifyReply,
  FastifyRequest,
} from "fastify";
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
  EventIdParams,
  CheckinIdParams,
} from "../types/commerceTypes.js";
import {
  CommerceError,
  parsePositiveInteger,
} from "../lib/commerce.js";
import type { OrderService } from "../services/commerce/orderService.js";
import type { PaymentService } from "../services/commerce/paymentService.js";
import type { RefundService } from "../services/commerce/refundService.js";
import type { AttendeeService } from "../services/commerce/attendeeService.js";
import type { CheckinService } from "../services/commerce/checkinService.js";
import type { PublicCheckoutService } from "../services/commerce/publicCheckoutService.js";

export function sendCommerceError(
  error: unknown,
  reply: FastifyReply,
) {
  if (error instanceof CommerceError) {
    return reply.code(error.statusCode).send({
      message: error.message,
      code: error.code,
    });
  }

  reply.log.error(error);

  return reply.code(500).send({
    message: "An unexpected commerce error occurred.",
  });
}

export function createCommerceControllers(services: {
  orders: OrderService;
  payments: PaymentService;
  refunds: RefundService;
  attendees: AttendeeService;
  checkins: CheckinService;
  publicCheckout: PublicCheckoutService;
}) {
  return {
    listOrders: async (
      request: FastifyRequest<{
        Querystring: OrderListQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.orders.listOrders(request.query),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    getOrder: async (
      request: FastifyRequest<{
        Params: IdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const orderId = parsePositiveInteger(
          request.params.orderId,
          "orderId",
        );
        return reply.send(
          await services.orders.getOrder(orderId),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    updateOrderStatus: async (
      request: FastifyRequest<{
        Params: IdParams;
        Body: UpdateOrderStatusBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const orderId = parsePositiveInteger(
          request.params.orderId,
          "orderId",
        );
        const actor = request.appUser?.userId;

        if (!actor) {
          throw new CommerceError(
            401,
            "Authentication required.",
          );
        }

        return reply.send({
          data: await services.orders.updateStatus(
            orderId,
            request.body.payment_status,
            actor,
          ),
        });
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    listEventOrders: async (
      request: FastifyRequest<{
        Params: IdParams;
        Querystring: OrderListQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const eventId = parsePositiveInteger(
          request.params.eventId,
          "eventId",
        );
        return reply.send(
          await services.orders.listOrders(
            request.query,
            eventId,
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    listPayments: async (
      request: FastifyRequest<{
        Querystring: PaymentListQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.payments.listPayments(
            request.query,
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    getPayment: async (
      request: FastifyRequest<{
        Params: IdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.payments.getPayment(
            parsePositiveInteger(
              request.params.paymentId,
              "paymentId",
            ),
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    listEventPayments: async (
      request: FastifyRequest<{
        Params: IdParams;
        Querystring: PaymentListQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.payments.listPayments(
            request.query,
            parsePositiveInteger(
              request.params.eventId,
              "eventId",
            ),
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    paymentWebhook: async (
      request: FastifyRequest<{
        Params: PaymentProviderParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        if (!request.rawBody) {
          throw new CommerceError(
            400,
            "Raw webhook body is unavailable.",
            "WEBHOOK_RAW_BODY_MISSING",
          );
        }
        const rawBody = Buffer.isBuffer(request.rawBody)
              ? request.rawBody
              : Buffer.from(request.rawBody);

        return reply.send(
          await services.payments.processWebhook(
            request.params.provider,
            request.headers,
            rawBody,
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    listRefunds: async (
      request: FastifyRequest<{
        Querystring: RefundListQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.refunds.listRefunds(
            request.query,
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    getRefund: async (
      request: FastifyRequest<{
        Params: IdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.refunds.getRefund(
            parsePositiveInteger(
              request.params.refundId,
              "refundId",
            ),
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    createRefund: async (
      request: FastifyRequest<{
        Params: IdParams;
        Body: CreateRefundBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const actor = request.appUser?.userId;

        if (!actor) {
          throw new CommerceError(
            401,
            "Authentication required.",
          );
        }

        return reply.code(201).send({
          data: await services.refunds.createRefund({
            paymentId: parsePositiveInteger(
              request.params.paymentId,
              "paymentId",
            ),
            amount: request.body.amount,
            reason: request.body.reason,
            actorUserId: actor,
          }),
        });
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    listEventRefunds: async (
      request: FastifyRequest<{
        Params: IdParams;
        Querystring: RefundListQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.refunds.listRefunds(
            request.query,
            parsePositiveInteger(
              request.params.eventId,
              "eventId",
            ),
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    listAttendees: async (
      request: FastifyRequest<{
        Querystring: AttendeeListQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.attendees.listAttendees(
            request.query,
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    getAttendee: async (
      request: FastifyRequest<{
        Params: IdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.attendees.getAttendee(
            parsePositiveInteger(
              request.params.attendeeId,
              "attendeeId",
            ),
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    updateAttendee: async (
      request: FastifyRequest<{
        Params: IdParams;
        Body: UpdateAttendeeBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const actor = request.appUser?.userId;

        if (!actor) {
          throw new CommerceError(
            401,
            "Authentication required.",
          );
        }

        return reply.send({
          data:
            await services.attendees.updateAttendee(
              parsePositiveInteger(
                request.params.attendeeId,
                "attendeeId",
              ),
              request.body,
              actor,
            ),
        });
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    listEventAttendees: async (
      request: FastifyRequest<{
        Params: IdParams;
        Querystring: AttendeeListQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.attendees.listAttendees(
            request.query,
            parsePositiveInteger(
              request.params.eventId,
              "eventId",
            ),
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    listEventCheckins: async (
      request: FastifyRequest<{
        Params: IdParams;
        Querystring: EventCheckinListQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.checkins.listEventCheckins(
            parsePositiveInteger(
              request.params.eventId,
              "eventId",
            ),
            request.query,
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    createCheckin: async (
      request: FastifyRequest<{
        Params: EventIdParams;
        Body: CreateCheckinBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const actor = request.appUser?.userId;

        if (!actor) {
          throw new CommerceError(
            401,
            "Authentication required.",
          );
        }

        const checkin =
          await services.checkins.createCheckin(
            parsePositiveInteger(
              request.params.eventId,
              "eventId",
            ),
            request.body,
            actor,
          );

        return reply.code(201).send({
          data: checkin,
        });
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    deleteCheckin: async (
      request: FastifyRequest<{
        Params: CheckinIdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const actor = request.appUser?.userId;

        if (!actor) {
          throw new CommerceError(
            401,
            "Authentication required.",
          );
        }

        await services.checkins.deleteCheckin(
          parsePositiveInteger(
            request.params.eventId,
            "eventId",
          ),
          parsePositiveInteger(
            request.params.checkinId,
            "checkinId",
          ),
          actor,
        );

        return reply.code(204).send();
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    createCheckout: async (
      request: FastifyRequest<{
        Params: IdParams;
        Body: CreateCheckoutBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.code(201).send(
          await services.publicCheckout.createCheckout(
            parsePositiveInteger(
              request.params.eventId,
              "eventId",
            ),
            request.body,
            request.appUser?.userId,
          ),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    createPublicOrder: async (
      request: FastifyRequest<{
        Params: IdParams;
        Body: CreatePublicOrderBody;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        const result =
          await services.publicCheckout.createOrder({
            eventId: parsePositiveInteger(
              request.params.eventId,
              "eventId",
            ),
            body: request.body,
            idempotencyKey:
              typeof request.headers[
                "idempotency-key"
              ] === "string"
                ? request.headers["idempotency-key"]
                : undefined,
            buyerUserId: request.appUser?.userId,
          });

        return reply
          .code(result.statusCode)
          .send(result.body);
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    getPublicConfirmation: async (
      request: FastifyRequest<{
        Params: IdParams;
        Querystring: ConfirmationQuery;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        return reply.send(
          await services.publicCheckout.getConfirmation({
            eventId: parsePositiveInteger(
              request.params.eventId,
              "eventId",
            ),
            orderReference: String(
              request.params.orderReference,
            ),
            token: request.query.token,
            buyerUserId: request.appUser?.userId,
          }),
        );
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },

    releaseCheckout: async (
      request: FastifyRequest<{
        Params: IdParams;
      }>,
      reply: FastifyReply,
    ) => {
      try {
        await services.publicCheckout.releaseCheckout(
          parsePositiveInteger(
            request.params.eventId,
            "eventId",
          ),
          String(request.params.checkoutToken),
        );

        return reply.code(204).send();
      } catch (error) {
        return sendCommerceError(error, reply);
      }
    },
  };
}
