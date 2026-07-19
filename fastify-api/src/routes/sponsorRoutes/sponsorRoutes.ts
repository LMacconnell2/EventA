import { FastifyPluginAsync } from "fastify";
import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";
import {
  createSponsorController,
  deleteSponsorController,
  getSponsorsController,
  updateSponsorController,
} from "../../controllers/sponsorController.js";
import {
  createSponsorBodySchema,
  sponsorIdParamsSchema,
  sponsorListQuerySchema,
  updateSponsorBodySchema,
} from "../../schemas/sponsorSchemas.js";
import type {
  CreateSponsorInput,
  SponsorListQuery,
  UpdateSponsorInput,
} from "../../services/sponsorService.js";

type SponsorIdParams = {
  sponsorId: number;
};

const sponsorRoutes: FastifyPluginAsync =
  async (app) => {
    app.get<{
      Querystring: SponsorListQuery;
    }>(
      "/api/sponsors",
      {
        schema: {
          querystring: sponsorListQuerySchema,
        },
        preHandler: [
          authenticate,
          authorize("sponsors.view"),
        ],
      },
      getSponsorsController,
    );

    app.post<{
      Body: CreateSponsorInput;
    }>(
      "/api/sponsors",
      {
        schema: {
          body: createSponsorBodySchema,
        },
        preHandler: [
          authenticate,
          authorize("sponsors.edit"),
        ],
      },
      createSponsorController,
    );

    app.put<{
      Params: SponsorIdParams;
      Body: UpdateSponsorInput;
    }>(
      "/api/sponsors/:sponsorId",
      {
        schema: {
          params: sponsorIdParamsSchema,
          body: updateSponsorBodySchema,
        },
        preHandler: [
          authenticate,
          authorize("sponsors.edit"),
        ],
      },
      updateSponsorController,
    );

    app.delete<{
      Params: SponsorIdParams;
    }>(
      "/api/sponsors/:sponsorId",
      {
        schema: {
          params: sponsorIdParamsSchema,
        },
        preHandler: [
          authenticate,
          authorize("sponsors.edit"),
        ],
      },
      deleteSponsorController,
    );
  };

export default sponsorRoutes;