import { db } from "../database/db.js";
import { ServiceError } from "../errors/sponsorError.js";

export type SponsorRecord = {
  sponsor_id: number;
  sponsor_name: string;
  sponsor_description: string | null;
  sponsor_logo: string | null;
  sponsor_website: string | null;
  created_at: string;
  updated_at: string;
  created_by: number | null;
  updated_by: number | null;
};

export type SponsorListQuery = {
  q?: string;
  page?: number;
  per_page?: number;
};

export type CreateSponsorInput = {
  sponsor_name: string;
  sponsor_description?: string | null;
  sponsor_logo?: string | null;
  sponsor_website?: string | null;
};

export type UpdateSponsorInput = {
  sponsor_name?: string;
  sponsor_description?: string | null;
  sponsor_logo?: string | null;
  sponsor_website?: string | null;
};

function cleanOptionalString(
  value: string | null | undefined,
): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export async function listSponsors(
  query: SponsorListQuery,
) {
  const page = query.page ?? 1;
  const perPage = query.per_page ?? 25;
  const offset = (page - 1) * perPage;
  const search = query.q?.trim();

  const values: unknown[] = [];
  const conditions = ["deleted_at IS NULL"];

  if (search) {
    values.push(`%${search}%`);

    conditions.push(`
      (
        sponsor_name ILIKE $${values.length}
        OR sponsor_description ILIKE $${values.length}
        OR sponsor_website ILIKE $${values.length}
      )
    `);
  }

  const whereClause = `WHERE ${conditions.join(" AND ")}`;

  const countResult = await db.query<{
    total: string;
  }>(
    `
      SELECT COUNT(*) AS total
      FROM sponsors
      ${whereClause}
    `,
    values,
  );

  const total = Number(countResult.rows[0]?.total ?? 0);

  const listValues = [...values, perPage, offset];
  const limitIndex = values.length + 1;
  const offsetIndex = values.length + 2;

  const result = await db.query<SponsorRecord>(
    `
      SELECT
        sponsor_id,
        sponsor_name,
        sponsor_description,
        sponsor_logo,
        sponsor_website,
        created_at,
        updated_at,
        created_by,
        updated_by
      FROM sponsors
      ${whereClause}
      ORDER BY sponsor_name ASC
      LIMIT $${limitIndex}
      OFFSET $${offsetIndex}
    `,
    listValues,
  );

  return {
    data: result.rows,
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages:
        total === 0 ? 0 : Math.ceil(total / perPage),
    },
  };
}

export async function createSponsor(
  input: CreateSponsorInput,
  userId: number,
): Promise<SponsorRecord> {
  const sponsorName = input.sponsor_name.trim();

  if (!sponsorName) {
    throw new ServiceError(
      400,
      "Sponsor name is required.",
    );
  }

  try {
    const result = await db.query<SponsorRecord>(
      `
        INSERT INTO sponsors (
          sponsor_name,
          sponsor_description,
          sponsor_logo,
          sponsor_website,
          created_by,
          updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $5)
        RETURNING
          sponsor_id,
          sponsor_name,
          sponsor_description,
          sponsor_logo,
          sponsor_website,
          created_at,
          updated_at,
          created_by,
          updated_by
      `,
      [
        sponsorName,
        cleanOptionalString(
          input.sponsor_description,
        ) ?? null,
        cleanOptionalString(input.sponsor_logo) ??
          null,
        cleanOptionalString(
          input.sponsor_website,
        ) ?? null,
        userId,
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
        "A sponsor with that name already exists.",
        "SPONSOR_NAME_CONFLICT",
      );
    }

    throw error;
  }
}

export async function updateSponsor(
  sponsorId: number,
  input: UpdateSponsorInput,
  userId: number,
): Promise<SponsorRecord> {
  const existing = await db.query<{
    sponsor_id: number;
  }>(
    `
      SELECT sponsor_id
      FROM sponsors
      WHERE sponsor_id = $1
        AND deleted_at IS NULL
    `,
    [sponsorId],
  );

  if (!existing.rows[0]) {
    throw new ServiceError(
      404,
      "Sponsor not found.",
    );
  }

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

  if (input.sponsor_name !== undefined) {
    const name = input.sponsor_name.trim();

    if (!name) {
      throw new ServiceError(
        400,
        "Sponsor name cannot be empty.",
      );
    }

    addAssignment("sponsor_name", name);
  }

  if (input.sponsor_description !== undefined) {
    addAssignment(
      "sponsor_description",
      cleanOptionalString(
        input.sponsor_description,
      ) ?? null,
    );
  }

  if (input.sponsor_logo !== undefined) {
    addAssignment(
      "sponsor_logo",
      cleanOptionalString(input.sponsor_logo) ??
        null,
    );
  }

  if (input.sponsor_website !== undefined) {
    addAssignment(
      "sponsor_website",
      cleanOptionalString(
        input.sponsor_website,
      ) ?? null,
    );
  }

  if (assignments.length === 0) {
    throw new ServiceError(
      400,
      "At least one sponsor field must be provided.",
    );
  }

  addAssignment("updated_by", userId);

  values.push(sponsorId);
  const sponsorIdIndex = values.length;

  try {
    const result = await db.query<SponsorRecord>(
      `
        UPDATE sponsors
        SET
          ${assignments.join(", ")},
          updated_at = NOW()
        WHERE sponsor_id = $${sponsorIdIndex}
          AND deleted_at IS NULL
        RETURNING
          sponsor_id,
          sponsor_name,
          sponsor_description,
          sponsor_logo,
          sponsor_website,
          created_at,
          updated_at,
          created_by,
          updated_by
      `,
      values,
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
        "A sponsor with that name already exists.",
        "SPONSOR_NAME_CONFLICT",
      );
    }

    throw error;
  }
}

export async function deleteSponsor(
  sponsorId: number,
  userId: number,
): Promise<void> {
  const result = await db.query(
    `
      UPDATE sponsors
      SET
        deleted_at = NOW(),
        updated_at = NOW(),
        updated_by = $2
      WHERE sponsor_id = $1
        AND deleted_at IS NULL
      RETURNING sponsor_id
    `,
    [sponsorId, userId],
  );

  if (!result.rows[0]) {
    throw new ServiceError(
      404,
      "Sponsor not found.",
    );
  }
}