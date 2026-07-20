import type { FastifyReply, FastifyRequest } from "fastify";
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
} from "../types/userTypes.js";
import { UserServiceError } from "../errors/userError.js";
import { betterAuthUserService } from "../services//user/better-auth-userService.js";
import { profilePhotoService } from "../services/user/profilePhotoService.js";
import { userService } from "../services/user/userService.js";

function currentUserId(request: FastifyRequest): number {
  if (!request.appUser) {
    throw new UserServiceError(401, "Authentication required.");
  }

  return request.appUser.userId;
}

async function handle<T>(
  reply: FastifyReply,
  action: () => Promise<T>,
  successCode = 200,
): Promise<FastifyReply> {
  try {
    return reply.code(successCode).send(await action());
  } catch (error) {
    if (error instanceof UserServiceError) {
      return reply.code(error.statusCode).send({
        message: error.message,
        code: error.code,
      });
    }

    requestLog(reply, error);
    return reply.code(500).send({ message: "Internal server error." });
  }
}

function requestLog(reply: FastifyReply, error: unknown): void {
  reply.log.error({ err: error }, "Users API request failed");
}

export const userController = {
  getMyProfile(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => ({
      user: await userService.getProfile(currentUserId(request)),
    }));
  },

  updateMyProfile(
    request: FastifyRequest<{ Body: UserProfilePatchBody }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => {
      const result = await userService.updateOwnProfile(
        currentUserId(request),
        request.body,
      );

      if (request.body.email && result.emailChangePending) {
        await betterAuthUserService.requestEmailChange(
          request,
          request.body.email.trim().toLowerCase(),
        );
      }

      return {
        message: result.emailChangePending
          ? "Profile updated. Verify the new email address to complete the email change."
          : "Profile updated successfully.",
        ...result,
        pendingEmail: result.emailChangePending ? request.body.email : undefined,
      };
    });
  },

  deleteMe(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => ({
      success: true,
      message: "Your account has been deleted.",
      redirectTo: "/login",
      ...(await userService.softDelete(
        currentUserId(request),
        currentUserId(request),
      )),
    }));
  },

  changePassword(
    request: FastifyRequest<{ Body: ChangePasswordBody }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => {
      await betterAuthUserService.changePassword(request, {
        currentPassword: request.body.currentPassword,
        newPassword: request.body.newPassword,
        revokeOtherSessions: request.body.revokeOtherSessions ?? true,
      });

      return {
        success: true,
        message: "Password changed successfully.",
        otherSessionsRevoked: request.body.revokeOtherSessions ?? true,
      };
    });
  },

  uploadMyProfilePhoto(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => {
      const file = await request.file();
      if (!file) {
        throw new UserServiceError(400, "A photo file is required.");
      }

      const userId = currentUserId(request);
      const photoUrl = await profilePhotoService.save(userId, file);
      const user = await userService.setProfilePhoto(userId, photoUrl, userId);

      return {
        message: "Profile photo updated successfully.",
        profilePhoto: user.profilePhoto,
      };
    });
  },

  removeMyProfilePhoto(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => {
      const userId = currentUserId(request);
      await userService.removeProfilePhoto(userId, userId);
      return {
        success: true,
        message: "Profile photo removed successfully.",
        profilePhoto: null,
      };
    });
  },

  list(
    request: FastifyRequest<{ Querystring: UserListQuery }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, () => userService.list(request.query));
  },

  create(
    request: FastifyRequest<{ Body: CreateUserBody }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(
      reply,
      async () => ({
        message: "User created successfully.",
        user: await userService.create(
          request.body,
          currentUserId(request),
        ),
      }),
      201,
    );
  },

  getById(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => ({
      user: await userService.getProfile(request.params.id, true),
    }));
  },

  updateById(
    request: FastifyRequest<{
      Params: UserIdParams;
      Body: AdminUserPatchBody;
    }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => ({
      message: "User updated successfully.",
      user: await userService.updateAdmin(
        request.params.id,
        request.body,
        currentUserId(request),
      ),
    }));
  },

  deleteById(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => {
      if (request.params.id === currentUserId(request)) {
        throw new UserServiceError(
          400,
          "Use DELETE /api/users/me to delete your own account.",
        );
      }

      return {
        success: true,
        message: "User deleted successfully.",
        ...(await userService.softDelete(
          request.params.id,
          currentUserId(request),
        )),
      };
    });
  },

  uploadProfilePhoto(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => {
      const file = await request.file();
      if (!file) {
        throw new UserServiceError(400, "A photo file is required.");
      }

      const photoUrl = await profilePhotoService.save(
        request.params.id,
        file,
      );
      const user = await userService.setProfilePhoto(
        request.params.id,
        photoUrl,
        currentUserId(request),
      );

      return {
        message: "User profile photo updated successfully.",
        userId: request.params.id,
        profilePhoto: user.profilePhoto,
      };
    });
  },

  removeProfilePhoto(
    request: FastifyRequest<{ Params: UserIdParams }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => {
      await userService.removeProfilePhoto(
        request.params.id,
        currentUserId(request),
      );
      return {
        success: true,
        message: "User profile photo removed successfully.",
        userId: request.params.id,
        profilePhoto: null,
      };
    });
  },

  bulkStatus(
    request: FastifyRequest<{ Body: BulkStatusBody }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => ({
      message: "Bulk status update completed.",
      ...(await userService.bulkStatus(
        request.body.userIds,
        request.body.statusId,
        currentUserId(request),
      )),
    }));
  },

  bulkRoles(
    request: FastifyRequest<{ Body: BulkRolesBody }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => ({
      message: "Bulk role update completed.",
      ...(await userService.bulkRoles(
        request.body,
        currentUserId(request),
      )),
    }));
  },

  bulkDelete(
    request: FastifyRequest<{ Body: BulkDeleteBody }>,
    reply: FastifyReply,
  ): Promise<FastifyReply> {
    return handle(reply, async () => ({
      message: "Bulk delete completed.",
      ...(await userService.bulkDelete(
        request.body.userIds,
        currentUserId(request),
      )),
    }));
  },
};