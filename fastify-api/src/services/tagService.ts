import { db } from "../database/db.js";
import { TagServiceError } from "../errors/tagErrors.js";

import type {
  CreateTagResult,
  DeleteTagResult,
  TagRecord,
  UpdateTagBody,
  UpdateTagResult,
} from "../types/tagTypes.js";

type ExistingTagRow = {
  tag_id: number;
  tag_name: string;
  active: boolean;
  deleted_at: string | null;
};

function normalizeTagName(value: string): string {
  /*
   * Store tags without a leading #.
   * The frontend can add # when displaying them.
   */
  return value.trim().replace(/^#+/, "").trim();
}

function validateTagName(value: string): string {
  const normalizedName = normalizeTagName(value);

  if (!normalizedName) {
    throw new TagServiceError(
      400,
      "Tag name is required.",
      "TAG_NAME_REQUIRED",
    );
  }

  if (normalizedName.length > 50) {
    throw new TagServiceError(
      400,
      "Tag name cannot exceed 50 characters.",
      "TAG_NAME_TOO_LONG",
    );
  }

  return normalizedName;
}

export class TagService {
  private async findByNormalizedName(
    tagName: string,
    excludeTagId?: number,
  ): Promise<ExistingTagRow | null> {
    const values: unknown[] = [tagName];

    let excludeSql = "";

    if (excludeTagId !== undefined) {
      values.push(excludeTagId);
      excludeSql = `AND tag_id <> $${values.length}`;
    }

    const result = await db.query<ExistingTagRow>(
      `
        SELECT
          tag_id,
          tag_name,
          active,
          deleted_at
        FROM tags
        WHERE LOWER(TRIM(tag_name)) =
          LOWER(TRIM($1))
          ${excludeSql}
        LIMIT 1
      `,
      values,
    );

    return result.rows[0] ?? null;
  }

  async createTag(
    tagName: string,
    userId: number,
  ): Promise<CreateTagResult> {
    const normalizedName = validateTagName(tagName);

    const existingTag =
      await this.findByNormalizedName(normalizedName);

    if (existingTag) {
      if (existingTag.deleted_at !== null) {
        throw new TagServiceError(
          409,
          "A deleted tag with this name already exists.",
          "TAG_NAME_EXISTS_DELETED",
        );
      }

      throw new TagServiceError(
        409,
        "A tag with this name already exists.",
        "TAG_NAME_EXISTS",
      );
    }

    try {
      const result = await db.query<TagRecord>(
        `
          INSERT INTO tags (
            tag_name,
            active,
            created_by,
            updated_by
          )
          VALUES ($1, TRUE, $2, $2)
          RETURNING
            tag_id,
            tag_name,
            active,
            created_at,
            updated_at,
            created_by,
            updated_by,
            deleted_at
        `,
        [normalizedName, userId],
      );

      const tag = result.rows[0];

      if (!tag) {
        throw new TagServiceError(
          500,
          "Tag creation did not return a record.",
          "TAG_CREATE_FAILED",
        );
      }

      return {
        success: true,
        created: true,
        tag,
        message: "Tag created successfully.",
      };
    } catch (error) {
      /*
       * PostgreSQL unique-constraint violation.
       */
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new TagServiceError(
          409,
          "A tag with this name already exists.",
          "TAG_NAME_EXISTS",
        );
      }

      throw error;
    }
  }

  async updateTag(
    tagId: number,
    updates: UpdateTagBody,
    userId: number,
  ): Promise<UpdateTagResult> {
    const existingResult =
      await db.query<ExistingTagRow>(
        `
          SELECT
            tag_id,
            tag_name,
            active,
            deleted_at
          FROM tags
          WHERE tag_id = $1
          LIMIT 1
        `,
        [tagId],
      );

    const existingTag = existingResult.rows[0];

    if (!existingTag || existingTag.deleted_at !== null) {
      throw new TagServiceError(
        404,
        "Tag not found.",
        "TAG_NOT_FOUND",
      );
    }

    const values: unknown[] = [];
    const assignments: string[] = [];

    if (updates.tag_name !== undefined) {
      const normalizedName = validateTagName(
        updates.tag_name,
      );

      const duplicateTag =
        await this.findByNormalizedName(
          normalizedName,
          tagId,
        );

      if (duplicateTag) {
        throw new TagServiceError(
          409,
          "A tag with this name already exists.",
          "TAG_NAME_EXISTS",
        );
      }

      values.push(normalizedName);
      assignments.push(
        `tag_name = $${values.length}`,
      );
    }

    if (updates.active !== undefined) {
      values.push(updates.active);
      assignments.push(
        `active = $${values.length}`,
      );
    }

    if (assignments.length === 0) {
      throw new TagServiceError(
        400,
        "At least one tag field must be provided.",
        "NO_TAG_UPDATES",
      );
    }

    values.push(userId);
    assignments.push(
      `updated_by = $${values.length}`,
    );

    assignments.push("updated_at = NOW()");

    values.push(tagId);
    const tagIdIndex = values.length;

    try {
      const result = await db.query<TagRecord>(
        `
          UPDATE tags
          SET ${assignments.join(", ")}
          WHERE tag_id = $${tagIdIndex}
            AND deleted_at IS NULL
          RETURNING
            tag_id,
            tag_name,
            active,
            created_at,
            updated_at,
            created_by,
            updated_by,
            deleted_at
        `,
        values,
      );

      const tag = result.rows[0];

      if (!tag) {
        throw new TagServiceError(
          404,
          "Tag not found.",
          "TAG_NOT_FOUND",
        );
      }

      return {
        success: true,
        tag,
        message: "Tag updated successfully.",
      };
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "23505"
      ) {
        throw new TagServiceError(
          409,
          "A tag with this name already exists.",
          "TAG_NAME_EXISTS",
        );
      }

      throw error;
    }
  }

  async deleteTag(
    tagId: number,
    userId: number,
  ): Promise<DeleteTagResult> {
    /*
     * This is intentionally a soft delete. It preserves
     * existing event_tags relationships for historical data.
     */
    const result = await db.query<{
      tag_id: number;
    }>(
      `
        UPDATE tags
        SET
          active = FALSE,
          deleted_at = NOW(),
          updated_at = NOW(),
          updated_by = $2
        WHERE tag_id = $1
          AND deleted_at IS NULL
        RETURNING tag_id
      `,
      [tagId, userId],
    );

    const deletedTag = result.rows[0];

    if (!deletedTag) {
      throw new TagServiceError(
        404,
        "Tag not found.",
        "TAG_NOT_FOUND",
      );
    }

    return {
      success: true,
      tag_id: deletedTag.tag_id,
      message: "Tag deleted successfully.",
    };
  }
}

export const tagService = new TagService();