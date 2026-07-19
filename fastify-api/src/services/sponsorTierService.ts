import { db } from "../database/db.js";
import { ServiceError } from "../errors/sponsorError.js";

export type SponsorTierRecord = {
  sponsor_tier_id: number;
  sponsor_tier_name: string;
  active: boolean;
  color: string;
  created_at: string;
  updated_at: string;
};

export type SponsorTierListQuery = {
  include_inactive?: boolean;
};

export type CreateSponsorTierInput = {
  sponsor_tier_name: string;
  active?: boolean;
  color: string;
};

export type UpdateSponsorTierInput = {
  sponsor_tier_name?: string;
  active?: boolean;
  color?: string;
};

export async function listSponsorTiers(
  query: SponsorTierListQuery,
): Promise<SponsorTierRecord[]> {
  const includeInactive =
    query.include_inactive ?? false;

  const result =
    await db.query<SponsorTierRecord>(
      `
        SELECT
          sponsor_tier_id,
          sponsor_tier_name,
          active,
          color,
          created_at,
          updated_at
        FROM sponsor_tiers
        WHERE ($1::boolean = TRUE OR active = TRUE)
        ORDER BY sponsor_tier_name ASC
      `,
      [includeInactive],
    );

  return result.rows;
}

export async function createSponsorTier(
  input: CreateSponsorTierInput,
): Promise<SponsorTierRecord> {
  const name = input.sponsor_tier_name.trim();

  if (!name) {
    throw new ServiceError(
      400,
      "Sponsor tier name is required.",
    );
  }

  try {
    const result =
      await db.query<SponsorTierRecord>(
        `
          INSERT INTO sponsor_tiers (
            sponsor_tier_name,
            active,
            color
          )
          VALUES ($1, $2, $3)
          RETURNING
            sponsor_tier_id,
            sponsor_tier_name,
            active,
            color,
            created_at,
            updated_at
        `,
        [
          name,
          input.active ?? true,
          input.color,
        ],
      );

    return result.rows[0];
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new ServiceError(
        409,
        "A sponsor tier with that name already exists.",
      );
    }

    throw error;
  }
}

export async function updateSponsorTier(
  tierId: number,
  input: UpdateSponsorTierInput,
): Promise<SponsorTierRecord> {
  const assignments: string[] = [];
  const values: unknown[] = [];

  function addAssignment(
    column: string,
    value: unknown,
  ) {
    values.push(value);
    assignments.push(
      `${column} = $${values.length}`,
    );
  }

  if (input.sponsor_tier_name !== undefined) {
    const name =
      input.sponsor_tier_name.trim();

    if (!name) {
      throw new ServiceError(
        400,
        "Sponsor tier name cannot be empty.",
      );
    }

    addAssignment("sponsor_tier_name", name);
  }

  if (input.active !== undefined) {
    addAssignment("active", input.active);
  }

  if (input.color !== undefined) {
    addAssignment("color", input.color);
  }

  if (assignments.length === 0) {
    throw new ServiceError(
      400,
      "At least one tier field must be provided.",
    );
  }

  values.push(tierId);
  const tierIdIndex = values.length;

  try {
    const result =
      await db.query<SponsorTierRecord>(
        `
          UPDATE sponsor_tiers
          SET
            ${assignments.join(", ")},
            updated_at = NOW()
          WHERE sponsor_tier_id = $${tierIdIndex}
          RETURNING
            sponsor_tier_id,
            sponsor_tier_name,
            active,
            color,
            created_at,
            updated_at
        `,
        values,
      );

    if (!result.rows[0]) {
      throw new ServiceError(
        404,
        "Sponsor tier not found.",
      );
    }

    return result.rows[0];
  } catch (error: unknown) {
    if (error instanceof ServiceError) {
      throw error;
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new ServiceError(
        409,
        "A sponsor tier with that name already exists.",
      );
    }

    throw error;
  }
}

/**
 * Tier deletion is implemented as deactivation.
 *
 * Existing sponsor-event records continue to retain
 * their tier relationship for historical integrity.
 */
export async function deactivateSponsorTier(
  tierId: number,
): Promise<SponsorTierRecord> {
  const result =
    await db.query<SponsorTierRecord>(
      `
        UPDATE sponsor_tiers
        SET
          active = FALSE,
          updated_at = NOW()
        WHERE sponsor_tier_id = $1
        RETURNING
          sponsor_tier_id,
          sponsor_tier_name,
          active,
          color,
          created_at,
          updated_at
      `,
      [tierId],
    );

  if (!result.rows[0]) {
    throw new ServiceError(
      404,
      "Sponsor tier not found.",
    );
  }

  return result.rows[0];
}