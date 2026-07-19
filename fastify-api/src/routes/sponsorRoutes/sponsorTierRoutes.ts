import { FastifyPluginAsync } from "fastify";
import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";
import {
  createSponsorTierController,
  deleteSponsorTierController,
  getSponsorTiersController,
  updateSponsorTierController,
} from "../../controllers/sponsorTierController.js";
import {
  createSponsorTierBodySchema,
  sponsorTierIdParamsSchema,
  sponsorTierListQuerySchema,
  updateSponsorTierBodySchema,
} from "../../schemas/sponsorTierSchemas.js";
import type {
  CreateSponsorTierInput,
  SponsorTierListQuery,
  UpdateSponsorTierInput,
} from "../../services/sponsorTierService.js";

type TierIdParams = {
  tierId: number;
};

const sponsorTierRoutes: FastifyPluginAsync =
  async (app) => {
    app.get<{
      Querystring: SponsorTierListQuery;
    }>(
      "/api/sponsor-tiers",
      {
        schema: {
          querystring:
            sponsorTierListQuerySchema,
        },
        preHandler: [
          authenticate,
          authorize("events.view"),
        ],
      },
      getSponsorTiersController,
    );

    app.post<{
      Body: CreateSponsorTierInput;
    }>(
      "/api/sponsor-tiers",
      {
        schema: {
          body: createSponsorTierBodySchema,
        },
        preHandler: [
          authenticate,
          authorize("settings.edit"),
        ],
      },
      createSponsorTierController,
    );

    app.put<{
      Params: TierIdParams;
      Body: UpdateSponsorTierInput;
    }>(
      "/api/sponsor-tiers/:tierId",
      {
        schema: {
          params: sponsorTierIdParamsSchema,
          body: updateSponsorTierBodySchema,
        },
        preHandler: [
          authenticate,
          authorize("settings.edit"),
        ],
      },
      updateSponsorTierController,
    );

    app.delete<{
      Params: TierIdParams;
    }>(
      "/api/sponsor-tiers/:tierId",
      {
        schema: {
          params: sponsorTierIdParamsSchema,
        },
        preHandler: [
          authenticate,
          authorize("settings.edit"),
        ],
      },
      deleteSponsorTierController,
    );
  };

export default sponsorTierRoutes;