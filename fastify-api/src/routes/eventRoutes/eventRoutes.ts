import type { FastifyInstance } from "fastify";
import { authenticate } from "../../auth/authenticate.js";
import { authorizeAny } from "../../auth/authorize.js";
import { eventController } from "../../controllers/eventController.js";
import {
  attachSponsorBodySchema,
  createAssignmentBodySchema,
  createEventBodySchema,
  createImageBodySchema,
  eventAssignmentParamsSchema,
  eventIdParamsSchema,
  eventImageParamsSchema,
  eventListQuerySchema,
  eventSponsorParamsSchema,
  replaceCategoriesBodySchema,
  replaceTagsBodySchema,
  updateAssignmentBodySchema,
  updateEventBodySchema,
  updateImageBodySchema,
  updateStatusBodySchema,
  updateVenueBodySchema,
} from "../../schemas/eventSchemas.js";

const canView = authorizeAny(["events.view", "events.manage"]);
const canCreate = authorizeAny(["events.create", "events.manage"]);
const canEdit = authorizeAny(["events.edit", "events.manage"]);
const canDelete = authorizeAny(["events.delete", "events.manage"]);

export default async function eventRoutes(app: FastifyInstance) {
  app.get(
    "/",
    {
      preHandler: [authenticate, canView],
      schema: { querystring: eventListQuerySchema },
    },
    eventController.list,
  );

  app.post(
    "/",
    {
      preHandler: [authenticate, canCreate],
      schema: { body: createEventBodySchema },
    },
    eventController.create,
  );

  app.get(
    "/:eventId",
    {
      preHandler: [authenticate, canView],
      schema: { params: eventIdParamsSchema },
    },
    eventController.getById,
  );

  app.patch(
    "/:eventId",
    {
      preHandler: [authenticate, canEdit],
      schema: {
        params: eventIdParamsSchema,
        body: updateEventBodySchema,
      },
    },
    eventController.update,
  );

  app.delete(
    "/:eventId",
    {
      preHandler: [authenticate, canDelete],
      schema: { params: eventIdParamsSchema },
    },
    eventController.remove,
  );

  app.patch(
    "/:eventId/status",
    {
      preHandler: [authenticate, canEdit],
      schema: {
        params: eventIdParamsSchema,
        body: updateStatusBodySchema,
      },
    },
    eventController.updateStatus,
  );

  app.get(
    "/:eventId/status-history",
    {
      preHandler: [authenticate, canView],
      schema: { params: eventIdParamsSchema },
    },
    eventController.getStatusHistory,
  );

  app.get(
    "/:eventId/venue",
    {
      preHandler: [authenticate, canView],
      schema: { params: eventIdParamsSchema },
    },
    eventController.getVenue,
  );

  app.patch(
    "/:eventId/venue",
    {
      preHandler: [authenticate, canEdit],
      schema: {
        params: eventIdParamsSchema,
        body: updateVenueBodySchema,
      },
    },
    eventController.updateVenue,
  );

  app.get(
    "/:eventId/categories",
    {
      preHandler: [authenticate, canView],
      schema: { params: eventIdParamsSchema },
    },
    eventController.getCategories,
  );

  app.put(
    "/:eventId/categories",
    {
      preHandler: [authenticate, canEdit],
      schema: {
        params: eventIdParamsSchema,
        body: replaceCategoriesBodySchema,
      },
    },
    eventController.replaceCategories,
  );

  app.get(
    "/:eventId/tags",
    {
      preHandler: [authenticate, canView],
      schema: { params: eventIdParamsSchema },
    },
    eventController.getTags,
  );

  app.put(
    "/:eventId/tags",
    {
      preHandler: [authenticate, canEdit],
      schema: {
        params: eventIdParamsSchema,
        body: replaceTagsBodySchema,
      },
    },
    eventController.replaceTags,
  );

  app.get(
    "/:eventId/images",
    {
      preHandler: [authenticate, canView],
      schema: { params: eventIdParamsSchema },
    },
    eventController.getImages,
  );

  app.post(
    "/:eventId/images",
    {
      preHandler: [authenticate, canEdit],
      schema: {
        params: eventIdParamsSchema,
        body: createImageBodySchema,
      },
    },
    eventController.createImage,
  );

  app.patch(
    "/:eventId/images/:imageId",
    {
      preHandler: [authenticate, canEdit],
      schema: {
        params: eventImageParamsSchema,
        body: updateImageBodySchema,
      },
    },
    eventController.updateImage,
  );

  app.delete(
    "/:eventId/images/:imageId",
    {
      preHandler: [authenticate, canEdit],
      schema: { params: eventImageParamsSchema },
    },
    eventController.deleteImage,
  );

  app.get(
    "/:eventId/assignments",
    {
      preHandler: [authenticate, canView],
      schema: { params: eventIdParamsSchema },
    },
    eventController.getAssignments,
  );

  app.post(
    "/:eventId/assignments",
    {
      preHandler: [authenticate, canEdit],
      schema: {
        params: eventIdParamsSchema,
        body: createAssignmentBodySchema,
      },
    },
    eventController.createAssignment,
  );

  app.patch(
    "/:eventId/assignments/:assignmentId",
    {
      preHandler: [authenticate, canEdit],
      schema: {
        params: eventAssignmentParamsSchema,
        body: updateAssignmentBodySchema,
      },
    },
    eventController.updateAssignment,
  );

  app.delete(
    "/:eventId/assignments/:assignmentId",
    {
      preHandler: [authenticate, canEdit],
      schema: { params: eventAssignmentParamsSchema },
    },
    eventController.deleteAssignment,
  );

  // app.get(
  //   "/:eventId/sponsors",
  //   {
  //     preHandler: [authenticate, canView],
  //     schema: { params: eventIdParamsSchema },
  //   },
  //   eventController.getSponsors,
  // );

  // app.post(
  //   "/:eventId/sponsors",
  //   {
  //     preHandler: [authenticate, canEdit],
  //     schema: {
  //       params: eventIdParamsSchema,
  //       body: attachSponsorBodySchema,
  //     },
  //   },
  //   eventController.attachSponsor,
  // );

  // app.delete(
  //   "/:eventId/sponsors/:sponsorId",
  //   {
  //     preHandler: [authenticate, canEdit],
  //     schema: { params: eventSponsorParamsSchema },
  //   },
  //   eventController.detachSponsor,
  // );
}
