import { db } from "../../database/db.js";

import type {
  CategoryListQuery,
  CategoryListResult,
  CategoryRecord,
  CategoryType,
  CreateCategoryBody,
  UpdateCategoryBody,
} from "../../types/categoryTypes.js";

interface CategoryConfiguration {
  categoryTable: string;
  idColumn: string;
  nameColumn: string;

  assignmentTable: string;
  assignmentIdColumn: string;
  assignmentCategoryColumn: string;
}

const CATEGORY_CONFIG: Record<CategoryType, CategoryConfiguration> = {
  events: {
    categoryTable: "event_category",
    idColumn: "event_category_id",
    nameColumn: "event_category_name",

    assignmentTable: "event_categories",
    assignmentIdColumn: "event_id",
    assignmentCategoryColumn: "category_id",
  },

  tickets: {
    categoryTable: "ticket_category",
    idColumn: "ticket_category_id",
    nameColumn: "ticket_category_name",

    assignmentTable: "ticket_categories",
    assignmentIdColumn: "ticket_id",
    assignmentCategoryColumn: "ticket_category_id",
  },

  venues: {
    categoryTable: "venue_category",
    idColumn: "venue_category_id",
    nameColumn: "venue_category_name",

    assignmentTable: "venue_categories",
    assignmentIdColumn: "venue_id",
    assignmentCategoryColumn: "venue_category_id",
  },
};

export class CategoryNotFoundError extends Error {
  constructor(message = "Category not found.") {
    super(message);
    this.name = "CategoryNotFoundError";
  }
}

export class CategoryConflictError extends Error {
  constructor(message = "A category with that name already exists.") {
    super(message);
    this.name = "CategoryConflictError";
  }
}

export class InvalidCategoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidCategoryError";
  }
}

function getConfig(type: CategoryType): CategoryConfiguration {
  return CATEGORY_CONFIG[type];
}

function normalizeName(name: string): string {
  const normalized = name.trim();

  if (!normalized) {
    throw new InvalidCategoryError("Category name cannot be empty.");
  }

  return normalized;
}

function mapCategoryRow(row: Record<string, unknown>): CategoryRecord {
  return {
    id: Number(row.id),
    name: String(row.name),
    color: row.color === null ? null : String(row.color),
    icon: row.icon === null ? null : String(row.icon),
    active: Boolean(row.active),
    assignedCount: Number(row.assigned_count ?? 0),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function handleDatabaseError(error: unknown): never {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  ) {
    throw new CategoryConflictError();
  }

  throw error;
}

export class CategoryService {
  async list(
    type: CategoryType,
    query: CategoryListQuery,
  ): Promise<CategoryListResult> {
    const config = getConfig(type);

    const active = query.active ?? true;
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;

    const listSql = `
      SELECT
        category.${config.idColumn} AS id,
        category.${config.nameColumn} AS name,
        category.color,
        category.icon,
        category.active,
        category.created_at,
        category.updated_at,
        COUNT(assignment.${config.assignmentIdColumn})::INTEGER
          AS assigned_count
      FROM ${config.categoryTable} AS category
      LEFT JOIN ${config.assignmentTable} AS assignment
        ON assignment.${config.assignmentCategoryColumn}
          = category.${config.idColumn}
      WHERE category.active = $1
      GROUP BY
        category.${config.idColumn},
        category.${config.nameColumn},
        category.color,
        category.icon,
        category.active,
        category.created_at,
        category.updated_at
      ORDER BY
        LOWER(category.${config.nameColumn}) ASC,
        category.${config.idColumn} ASC
      LIMIT $2
      OFFSET $3;
    `;

    const countSql = `
      SELECT COUNT(*)::INTEGER AS total
      FROM ${config.categoryTable}
      WHERE active = $1;
    `;

    const [categoriesResult, countResult] = await Promise.all([
      db.query(listSql, [active, limit, offset]),
      db.query(countSql, [active]),
    ]);

    const data = categoriesResult.rows.map(mapCategoryRow);
    const total = Number(countResult.rows[0]?.total ?? 0);

    return {
      data,
      pagination: {
        limit,
        offset,
        returned: data.length,
        total,
      },
    };
  }

  async create(
    type: CategoryType,
    body: CreateCategoryBody,
    userId: number,
  ): Promise<CategoryRecord> {
    const config = getConfig(type);
    const name = normalizeName(body.name);

    const sql = `
      INSERT INTO ${config.categoryTable} (
        ${config.nameColumn},
        color,
        icon,
        active,
        created_by,
        updated_by
      )
      VALUES ($1, $2, $3, TRUE, $4, $4)
      RETURNING
        ${config.idColumn} AS id,
        ${config.nameColumn} AS name,
        color,
        icon,
        active,
        created_at,
        updated_at,
        0::INTEGER AS assigned_count;
    `;

    try {
      const result = await db.query(sql, [
        name,
        body.color ?? null,
        body.icon ?? null,
        userId,
      ]);

      return mapCategoryRow(result.rows[0]);
    } catch (error) {
      return handleDatabaseError(error);
    }
  }

  async update(
    type: CategoryType,
    categoryId: number,
    body: UpdateCategoryBody,
    userId: number,
  ): Promise<CategoryRecord> {
    const config = getConfig(type);

    const assignments: string[] = [];
    const values: unknown[] = [];

    if (body.name !== undefined) {
      values.push(normalizeName(body.name));
      assignments.push(`${config.nameColumn} = $${values.length}`);
    }

    if (body.color !== undefined) {
      values.push(body.color);
      assignments.push(`color = $${values.length}`);
    }

    if (body.icon !== undefined) {
      values.push(body.icon);
      assignments.push(`icon = $${values.length}`);
    }

    if (body.active !== undefined) {
      values.push(body.active);
      assignments.push(`active = $${values.length}`);

      if (body.active) {
        assignments.push("deleted_at = NULL");
      } else {
        assignments.push("deleted_at = NOW()");
      }
    }

    if (assignments.length === 0) {
      throw new InvalidCategoryError(
        "At least one category field must be supplied.",
      );
    }

    values.push(userId);
    assignments.push(`updated_by = $${values.length}`);
    assignments.push("updated_at = NOW()");

    values.push(categoryId);
    const categoryIdParameter = `$${values.length}`;

    const sql = `
      UPDATE ${config.categoryTable}
      SET ${assignments.join(", ")}
      WHERE ${config.idColumn} = ${categoryIdParameter}
      RETURNING
        ${config.idColumn} AS id,
        ${config.nameColumn} AS name,
        color,
        icon,
        active,
        created_at,
        updated_at;
    `;

    try {
      const result = await db.query(sql, values);

      if (result.rowCount === 0) {
        throw new CategoryNotFoundError();
      }

      const assignedCount = await this.getAssignedCount(type, categoryId);

      return mapCategoryRow({
        ...result.rows[0],
        assigned_count: assignedCount,
      });
    } catch (error) {
      return handleDatabaseError(error);
    }
  }

  async deactivate(
    type: CategoryType,
    categoryId: number,
    userId: number,
  ): Promise<CategoryRecord> {
    const config = getConfig(type);

    const sql = `
      UPDATE ${config.categoryTable}
      SET
        active = FALSE,
        deleted_at = NOW(),
        updated_at = NOW(),
        updated_by = $2
      WHERE ${config.idColumn} = $1
        AND active = TRUE
      RETURNING
        ${config.idColumn} AS id,
        ${config.nameColumn} AS name,
        color,
        icon,
        active,
        created_at,
        updated_at;
    `;

    const result = await db.query(sql, [categoryId, userId]);

    if (result.rowCount === 0) {
      throw new CategoryNotFoundError(
        "Active category not found. It may already be inactive.",
      );
    }

    const assignedCount = await this.getAssignedCount(type, categoryId);

    return mapCategoryRow({
      ...result.rows[0],
      assigned_count: assignedCount,
    });
  }

  private async getAssignedCount(
    type: CategoryType,
    categoryId: number,
  ): Promise<number> {
    const config = getConfig(type);

    const sql = `
      SELECT COUNT(*)::INTEGER AS assigned_count
      FROM ${config.assignmentTable}
      WHERE ${config.assignmentCategoryColumn} = $1;
    `;

    const result = await db.query(sql, [categoryId]);

    return Number(result.rows[0]?.assigned_count ?? 0);
  }
}

export const categoryService = new CategoryService();