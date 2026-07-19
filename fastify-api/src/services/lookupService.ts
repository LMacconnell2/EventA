import { db } from "../database/db.js";
import {
  lookupDefinitions,
  tagsDefinition,
  type LookupDefinition,
} from "../lib/lookupConfig.js";
import type {
  ActiveFilter,
  LookupKey,
  OrganizerLookupItem,
  OrganizerLookupQuery,
  TagsLookupQuery,
  VenueLookupItem,
  VenueLookupQuery,
} from "../types/lookupTypes.js";
import { LookupServiceError } from "../errors/lookupErrors.js";

type LookupRow = Record<string, unknown>;

const SAFE_IDENTIFIER = /^[a-z_][a-z0-9_]*$/i;

function quoteIdentifier(identifier: string): string {
  if (!SAFE_IDENTIFIER.test(identifier)) {
    throw new LookupServiceError(
      500,
      `Unsafe lookup identifier: ${identifier}`,
      "INVALID_LOOKUP_CONFIGURATION",
    );
  }

  return `"${identifier}"`;
}

function activeWhere(
  activeColumn?: string,
  active: ActiveFilter = true,
): string[] {
  if (!activeColumn || active === "all") {
    return [];
  }

  return [`${quoteIdentifier(activeColumn)} = TRUE`];
}

function deletedWhere(deletedAtColumn?: string): string[] {
  return deletedAtColumn
    ? [`${quoteIdentifier(deletedAtColumn)} IS NULL`]
    : [];
}

export class LookupService {
  async getLookup(
    key: Exclude<LookupKey, "tags">,
    active: ActiveFilter = true,
  ): Promise<LookupRow[]> {
    const definition = lookupDefinitions[key];

    if (!definition) {
      throw new LookupServiceError(
        404,
        "Lookup group not found.",
      );
    }

    const selectColumns = [
      definition.idColumn,
      definition.nameColumn,
      ...(definition.extraColumns ?? []),
      ...(definition.activeColumn
        ? [definition.activeColumn]
        : []),
    ].map(quoteIdentifier);

    const where = [
      ...activeWhere(definition.activeColumn, active),
      ...deletedWhere(definition.deletedAtColumn),
    ];

    const sql = `
      SELECT ${selectColumns.join(", ")}
      FROM ${quoteIdentifier(definition.table)}
      ${where.length > 0 ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY ${quoteIdentifier(
        definition.orderBy ?? definition.nameColumn,
      )} ASC
    `;

    const result = await db.query(sql);

    return result.rows;
  }

  async getTags(query: TagsLookupQuery) {
    const values: unknown[] = [];

    const where = [
      ...activeWhere(
        tagsDefinition.activeColumn,
        query.active ?? true,
      ),
      ...deletedWhere(tagsDefinition.deletedAtColumn),
    ];

    if (query.q?.trim()) {
      values.push(`%${query.q.trim()}%`);

      where.push(
        `${quoteIdentifier(
          tagsDefinition.nameColumn,
        )} ILIKE $${values.length}`,
      );
    }

    const page = Math.max(query.page ?? 1, 1);
    const perPage = Math.min(
      Math.max(query.per_page ?? 25, 1),
      100,
    );
    const offset = (page - 1) * perPage;

    const sortColumn =
      query.sort === "created_at"
        ? "created_at"
        : tagsDefinition.nameColumn;

    const order =
      query.order === "desc" ? "DESC" : "ASC";

    const whereSql =
      where.length > 0
        ? `WHERE ${where.join(" AND ")}`
        : "";

    const countResult = await db.query(
      `
        SELECT COUNT(*)::int AS total
        FROM ${quoteIdentifier(tagsDefinition.table)}
        ${whereSql}
      `,
      values,
    );

    values.push(perPage);
    const limitIndex = values.length;

    values.push(offset);
    const offsetIndex = values.length;

    const rowsResult = await db.query(
      `
        SELECT
          ${quoteIdentifier(tagsDefinition.idColumn)},
          ${quoteIdentifier(tagsDefinition.nameColumn)},
          ${quoteIdentifier(tagsDefinition.activeColumn)}
        FROM ${quoteIdentifier(tagsDefinition.table)}
        ${whereSql}
        ORDER BY ${quoteIdentifier(sortColumn)} ${order}
        LIMIT $${limitIndex}
        OFFSET $${offsetIndex}
      `,
      values,
    );

    const total = countResult.rows[0]?.total ?? 0;

    return {
      data: rowsResult.rows,
      pagination: {
        page,
        per_page: perPage,
        returned: rowsResult.rowCount ?? 0,
        total,
        total_pages: Math.ceil(total / perPage),
      },
    };
  }

  async getVenues(
    query: VenueLookupQuery,
  ): Promise<VenueLookupItem[]> {
    const q = query.q?.trim() ?? "";

    const values: unknown[] = [];
    const where: string[] = [
      "v.deleted_at IS NULL",
    ];

    if (q) {
      values.push(`%${q}%`);

      const searchParameter = `$${values.length}`;

      where.push(`
        (
          v.venue_name ILIKE ${searchParameter}
          OR v.venue_city ILIKE ${searchParameter}
          OR COALESCE(v.venue_state, '') ILIKE ${searchParameter}
          OR v.venue_country ILIKE ${searchParameter}
        )
      `);
    }

    const result = await db.query<VenueLookupItem>(
      `
        SELECT
          v.venue_id,
          v.venue_name
        FROM venues AS v
        WHERE ${where.join(" AND ")}
        ORDER BY
          v.venue_name ASC,
          v.venue_id ASC
      `,
      values,
    );

    return result.rows;
  }

  async getOrganizers(
    query: OrganizerLookupQuery,
  ): Promise<OrganizerLookupItem[]> {
    const q = query.q?.trim() ?? "";

    const values: unknown[] = [4];
    const where: string[] = [
      "u.deleted_at IS NULL",
      "ur.role_id = $1",
    ];

    if (q) {
      values.push(`%${q}%`);

      const searchParameter = `$${values.length}`;

      where.push(`
        (
          u.fname ILIKE ${searchParameter}
          OR u.lname ILIKE ${searchParameter}
          OR u.username ILIKE ${searchParameter}
          OR u.email ILIKE ${searchParameter}
          OR CONCAT_WS(
            ' ',
            NULLIF(TRIM(u.fname), ''),
            NULLIF(TRIM(u.lname), '')
          ) ILIKE ${searchParameter}
        )
      `);
    }

    const result = await db.query<OrganizerLookupItem>(
      `
        SELECT DISTINCT
          u.user_id AS organizer_id,
          CONCAT_WS(
            ' ',
            NULLIF(TRIM(u.fname), ''),
            NULLIF(TRIM(u.lname), '')
          ) AS organizer_name,
          u.username,
          u.email
        FROM users AS u
        INNER JOIN user_roles AS ur
          ON ur.user_id = u.user_id
        WHERE ${where.join(" AND ")}
        ORDER BY
          organizer_name ASC,
          u.user_id ASC
      `,
      values,
    );

    return result.rows;
  }

  async getCombined(
    keys: LookupKey[],
    active: ActiveFilter = true,
  ): Promise<Record<string, unknown>> {
    const uniqueKeys = [...new Set(keys)];

    const entries = await Promise.all(
      uniqueKeys.map(async (key) => {
        if (key === "tags") {
          const result = await this.getTags({
            active,
            page: 1,
            per_page: 25,
            sort: "tag_name",
            order: "asc",
          });

          return [key, result.data] as const;
        }

        return [
          key,
          await this.getLookup(key, active),
        ] as const;
      }),
    );

    return Object.fromEntries(entries);
  }

  getDefinition(
    key: Exclude<LookupKey, "tags">,
  ): LookupDefinition {
    return lookupDefinitions[key];
  }
}

export const lookupService = new LookupService();
