import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import type { MultipartFile } from "@fastify/multipart";
import { UserServiceError } from "../../errors/userError.js";

const ALLOWED_MIME_TYPES = new Map<string, string>([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
]);

const PROFILE_PHOTO_DIRECTORY = resolve(
  process.cwd(),
  "uploads",
  "profile-photos",
);

export class ProfilePhotoService {
  async save(userId: number, file: MultipartFile): Promise<string> {
    const extension = ALLOWED_MIME_TYPES.get(file.mimetype);

    if (!extension) {
      throw new UserServiceError(
        400,
        "Profile photos must be JPEG, PNG, or WebP images.",
        "INVALID_PROFILE_PHOTO_TYPE",
      );
    }

    await mkdir(PROFILE_PHOTO_DIRECTORY, { recursive: true });

    const filename = `user-${userId}-${Date.now()}${extension}`;
    const absolutePath = join(PROFILE_PHOTO_DIRECTORY, filename);

    await pipeline(file.file, createWriteStream(absolutePath));

    if (file.file.truncated) {
      await unlink(absolutePath).catch(() => undefined);
      throw new UserServiceError(
        413,
        "The profile photo exceeds the configured upload limit.",
        "PROFILE_PHOTO_TOO_LARGE",
      );
    }

    return `/uploads/profile-photos/${filename}`;
  }

  async remove(photoUrl: string | null): Promise<void> {
    if (!photoUrl?.startsWith("/uploads/profile-photos/")) {
      return;
    }

    const filename = photoUrl.slice("/uploads/profile-photos/".length);

    if (!filename || extname(filename) === "") {
      return;
    }

    const absolutePath = join(PROFILE_PHOTO_DIRECTORY, filename);
    await unlink(absolutePath).catch(() => undefined);
  }
}

export const profilePhotoService = new ProfilePhotoService();