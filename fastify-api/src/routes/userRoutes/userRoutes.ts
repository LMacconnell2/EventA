import type {
  FastifyInstance,
  FastifyPluginAsync,
  FastifyReply,
  FastifyRequest,
} from "fastify";

import { authenticate } from "../../auth/authenticate.js";
import { authorize } from "../../auth/authorize.js";
import { userController } from "../../controllers/userController.js";

import type {
  AdminUserPatchBody,
  BulkDeleteBody,
  BulkRolesBody,
  BulkStatusBody,
  ChangePasswordBody,
  CreateUserBody,
  UserIdParams,
  UserListQuery,
  UserProfilePatchBody,
} from "../../types/userTypes.js";

const idParamsSchema = {
  type: "object",
  additionalProperties: false,
  required: ["id"],
  properties: {
    id: {
      type: "integer",
      minimum: 1,
    },
  },
} as const;

const profilePatchProperties = {
  username: {
    type: "string",
    minLength: 3,
    maxLength: 100,
  },

  email: {
    type: "string",
    format: "email",
    maxLength: 255,
  },

  contactEmail: {
    anyOf: [
      {
        type: "string",
        format: "email",
        maxLength: 255,
      },
      {
        type: "null",
      },
    ],
  },

  position: {
    anyOf: [
      {
        type: "string",
        maxLength: 100,
      },
      {
        type: "null",
      },
    ],
  },

  bio: {
    anyOf: [
      {
        type: "string",
      },
      {
        type: "null",
      },
    ],
  },

  phone: {
    anyOf: [
      {
        type: "string",
        maxLength: 30,
      },
      {
        type: "null",
      },
    ],
  },

  address: {
    anyOf: [
      {
        type: "string",
        maxLength: 255,
      },
      {
        type: "null",
      },
    ],
  },

  city: {
    anyOf: [
      {
        type: "string",
        maxLength: 100,
      },
      {
        type: "null",
      },
    ],
  },

  state: {
    anyOf: [
      {
        type: "string",
        maxLength: 100,
      },
      {
        type: "null",
      },
    ],
  },

  country: {
    anyOf: [
      {
        type: "string",
        maxLength: 100,
      },
      {
        type: "null",
      },
    ],
  },

  zip: {
    anyOf: [
      {
        type: "string",
        maxLength: 20,
      },
      {
        type: "null",
      },
    ],
  },

  fname: {
    type: "string",
    minLength: 1,
    maxLength: 100,
  },

  lname: {
    type: "string",
    minLength: 1,
    maxLength: 100,
  },
} as const;

const profilePatchBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: profilePatchProperties,
} as const;

const adminPatchBodySchema = {
  type: "object",
  additionalProperties: false,
  minProperties: 1,
  properties: {
    ...profilePatchProperties,

    statusId: {
      type: "integer",
      minimum: 1,
    },

    roleIds: {
      type: "array",
      minItems: 1,
      uniqueItems: true,
      items: {
        type: "integer",
        minimum: 1,
      },
    },
  },
} as const;

const userRoutes: FastifyPluginAsync = async (
  app: FastifyInstance,
): Promise<void> => {
  /*
   * Current authenticated user
   */

  // GET /api/users/me
  app.get(
    "/me",
    {
      preHandler: [authenticate],
    },
    async (
      request: FastifyRequest,
      reply: FastifyReply,
    ): Promise<FastifyReply> => {
      const user = request.appUser;

      if (!user) {
        return reply.code(401).send({
          message: "Authentication required.",
        });
      }

      return reply.send({
        user: {
          id: user.userId,
          authId: user.authId,
          username: user.username,
          name: `${user.fname} ${user.lname}`.trim(),
          email: user.email,
          image: null,
          fname: user.fname,
          lname: user.lname,
          roles: user.roles,
          permissions: user.permissions,
        },
      });
    },
  );

  // GET /api/users/me/profile
  app.get(
    "/me/profile",
    {
      preHandler: [authenticate],
    },
    userController.getMyProfile,
  );

  // PATCH /api/users/me/profile
  app.patch<{ Body: UserProfilePatchBody }>(
    "/me/profile",
    {
      preHandler: [authenticate],
      schema: {
        body: profilePatchBodySchema,
      },
    },
    userController.updateMyProfile,
  );

  // DELETE /api/users/me
  app.delete(
    "/me",
    {
      preHandler: [authenticate],
    },
    userController.deleteMe,
  );

  // POST /api/users/me/change-password
  app.post<{ Body: ChangePasswordBody }>(
    "/me/change-password",
    {
      preHandler: [authenticate],
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: {
              type: "string",
              minLength: 1,
            },

            newPassword: {
              type: "string",
              minLength: 8,
              maxLength: 128,
            },

            revokeOtherSessions: {
              type: "boolean",
              default: true,
            },
          },
        },
      },
    },
    userController.changePassword,
  );

  // POST /api/users/me/profile-photo
  app.post(
    "/me/profile-photo",
    {
      preHandler: [authenticate],
    },
    userController.uploadMyProfilePhoto,
  );

  // DELETE /api/users/me/profile-photo
  app.delete(
    "/me/profile-photo",
    {
      preHandler: [authenticate],
    },
    userController.removeMyProfilePhoto,
  );

  /*
   * Bulk actions
   *
   * These static routes must be registered before the dynamic /:id routes.
   */

  // POST /api/users/bulk/status
  app.post<{ Body: BulkStatusBody }>(
    "/bulk/status",
    {
      preHandler: [
        authenticate,
        authorize("users.edit_status"),
      ],
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["userIds", "statusId"],
          properties: {
            userIds: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "integer",
                minimum: 1,
              },
            },

            statusId: {
              type: "integer",
              minimum: 1,
            },
          },
        },
      },
    },
    userController.bulkStatus,
  );

  // POST /api/users/bulk/roles
  app.post<{ Body: BulkRolesBody }>(
    "/bulk/roles",
    {
      preHandler: [
        authenticate,
        authorize("users.assign_roles"),
      ],
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["userIds", "roleIds", "mode"],
          properties: {
            userIds: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "integer",
                minimum: 1,
              },
            },

            roleIds: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "integer",
                minimum: 1,
              },
            },

            mode: {
              type: "string",
              enum: ["replace", "add", "remove"],
            },
          },
        },
      },
    },
    userController.bulkRoles,
  );

  // POST /api/users/bulk/delete
  app.post<{ Body: BulkDeleteBody }>(
    "/bulk/delete",
    {
      preHandler: [
        authenticate,
        authorize("users.delete"),
      ],
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: ["userIds"],
          properties: {
            userIds: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "integer",
                minimum: 1,
              },
            },
          },
        },
      },
    },
    userController.bulkDelete,
  );

  /*
   * Administrative user management
   */

  // GET /api/users
  app.get<{ Querystring: UserListQuery }>(
    "/",
    {
      preHandler: [
        authenticate,
        authorize("users.view"),
      ],
      schema: {
        querystring: {
          type: "object",
          additionalProperties: false,
          properties: {
            q: {
              type: "string",
              maxLength: 255,
            },

            role_ids: {
              type: "string",
            },

            status_ids: {
              type: "string",
            },

            date_joined_start: {
              type: "string",
              format: "date",
            },

            date_joined_end: {
              type: "string",
              format: "date",
            },

            last_login_start: {
              type: "string",
              format: "date",
            },

            last_login_end: {
              type: "string",
              format: "date",
            },

            include_deleted: {
              type: "boolean",
              default: false,
            },

            limit: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 25,
            },

            offset: {
              type: "integer",
              minimum: 0,
              default: 0,
            },

            sort: {
              type: "string",
              enum: [
                "username",
                "fname",
                "lname",
                "email",
                "created_at",
                "updated_at",
                "last_login",
              ],
              default: "created_at",
            },

            order: {
              type: "string",
              enum: ["asc", "desc"],
              default: "desc",
            },
          },
        },
      },
    },
    userController.list,
  );

  // POST /api/users
  app.post<{ Body: CreateUserBody }>(
    "/",
    {
      preHandler: [
        authenticate,
        authorize("users.create"),
      ],
      schema: {
        body: {
          type: "object",
          additionalProperties: false,
          required: [
            "username",
            "email",
            "fname",
            "lname",
            "statusId",
            "roleIds",
            "temporaryPassword",
          ],
          properties: {
            username: {
              type: "string",
              minLength: 3,
              maxLength: 100,
            },

            email: {
              type: "string",
              format: "email",
              maxLength: 255,
            },

            fname: {
              type: "string",
              minLength: 1,
              maxLength: 100,
            },

            lname: {
              type: "string",
              minLength: 1,
              maxLength: 100,
            },

            statusId: {
              type: "integer",
              minimum: 1,
            },

            roleIds: {
              type: "array",
              minItems: 1,
              uniqueItems: true,
              items: {
                type: "integer",
                minimum: 1,
              },
            },

            temporaryPassword: {
              type: "string",
              minLength: 8,
              maxLength: 128,
            },
          },
        },
      },
    },
    userController.create,
  );

  /*
   * Dynamic user routes
   */

  // GET /api/users/:id
  app.get<{ Params: UserIdParams }>(
    "/:id",
    {
      preHandler: [
        authenticate,
        authorize("users.view"),
      ],
      schema: {
        params: idParamsSchema,
      },
    },
    userController.getById,
  );

  // PATCH /api/users/:id
  app.patch<{ Params: UserIdParams; Body: AdminUserPatchBody }>(
    "/:id",
    {
      preHandler: [
        authenticate,
        authorize("users.edit"),
      ],
      schema: {
        params: idParamsSchema,
        body: adminPatchBodySchema,
      },
    },
    userController.updateById,
  );

  // DELETE /api/users/:id
  app.delete<{ Params: UserIdParams }>(
    "/:id",
    {
      preHandler: [
        authenticate,
        authorize("users.delete"),
      ],
      schema: {
        params: idParamsSchema,
      },
    },
    userController.deleteById,
  );

  // POST /api/users/:id/profile-photo
  app.post<{ Params: UserIdParams }>(
    "/:id/profile-photo",
    {
      preHandler: [
        authenticate,
        authorize("users.edit"),
      ],
      schema: {
        params: idParamsSchema,
      },
    },
    userController.uploadProfilePhoto,
  );

  // DELETE /api/users/:id/profile-photo
  app.delete<{ Params: UserIdParams }>(
    "/:id/profile-photo",
    {
      preHandler: [
        authenticate,
        authorize("users.edit"),
      ],
      schema: {
        params: idParamsSchema,
      },
    },
    userController.removeProfilePhoto,
  );
};

export default userRoutes;