import { randomBytes, createHash } from "node:crypto";

export class CommerceError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "CommerceError";
  }
}

export function parsePositiveInteger(
  value: unknown,
  name: string,
): number {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new CommerceError(
      400,
      `${name} must be a positive integer.`,
      "INVALID_PARAMETER",
    );
  }

  return parsed;
}

export function parseCsvIntegers(
  value: string | undefined,
): number[] {
  if (!value?.trim()) {
    return [];
  }

  const values = value
    .split(",")
    .map((item) => Number(item.trim()));

  if (
    values.some(
      (item) => !Number.isInteger(item) || item <= 0,
    )
  ) {
    throw new CommerceError(
      400,
      "An ID filter contains an invalid value.",
      "INVALID_FILTER",
    );
  }

  return [...new Set(values)];
}

export function parseCsvStrings(
  value: string | undefined,
): string[] {
  if (!value?.trim()) {
    return [];
  }

  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

export function parseBoolean(
  value: boolean | string | undefined,
): boolean | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value === "true" || value === "1") {
    return true;
  }

  if (value === "false" || value === "0") {
    return false;
  }

  throw new CommerceError(
    400,
    "Boolean filter must be true or false.",
    "INVALID_FILTER",
  );
}

export function getPagination(
  pageValue: unknown,
  perPageValue: unknown,
) {
  const page = Math.max(1, Number(pageValue) || 1);
  const perPage = Math.min(
    100,
    Math.max(1, Number(perPageValue) || 25),
  );

  return {
    page,
    perPage,
    offset: (page - 1) * perPage,
  };
}

export function assertAllowedSort(
  requested: string | undefined,
  allowed: Record<string, string>,
  fallback: string,
): string {
  if (!requested) {
    return allowed[fallback];
  }

  const column = allowed[requested];

  if (!column) {
    throw new CommerceError(
      400,
      `Unsupported sort field: ${requested}.`,
      "INVALID_SORT",
    );
  }

  return column;
}

export function getSortOrder(
  value: string | undefined,
): "ASC" | "DESC" {
  return value?.toLowerCase() === "asc" ? "ASC" : "DESC";
}

export function money(value: unknown): string {
  const parsed = Number(value ?? 0);

  if (!Number.isFinite(parsed)) {
    throw new CommerceError(
      500,
      "An invalid monetary value was returned.",
    );
  }

  return parsed.toFixed(2);
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function generateOpaqueToken(
  byteLength = 32,
): string {
  return randomBytes(byteLength).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateOrderReference(): string {
  return `EP-${randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

export function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}
