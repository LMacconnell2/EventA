import { db } from "../database/db.js";
import { ServiceError } from "../errors/sponsorError.js";

export type EventSponsorRecord = {
  sponsor_id: number;
  sponsor_name: string;
  sponsor_description: string | null;
  sponsor_logo: string | null;
  sponsor_website: string | null;
  sponsor_tier_id: number;
  sponsor_tier_name: string;
  sponsor_tier_color: string;
};

export type AttachEventSponsorInput = {
  sponsor_id: number;
  sponsor_tier_id: number;
};

export type UpdateEventSponsorInput = {
  sponsor_tier_id: number;
};

async function assertEventExists(
  eventId: number,
): Promise<void> {
  const result = await db.query(
    `
      SELECT event_id
      FROM events
      WHERE event_id = $1
        AND deleted_at IS NULL
    `,
    [eventId],
  );

  if (!result.rows[0]) {
    throw new ServiceError(
      404,
      "Event not found.",
    );
  }
}

async function assertSponsorExists(
  sponsorId: number,
): Promise<void> {
  const result = await db.query(
    `
      SELECT sponsor_id
      FROM sponsors
      WHERE sponsor_id = $1
        AND deleted_at IS NULL
    `,
    [sponsorId],
  );

  if (!result.rows[0]) {
    throw new ServiceError(
      404,
      "Sponsor not found.",
    );
  }
}

async function assertActiveTierExists(
  tierId: number,
): Promise<void> {
  const result = await db.query(
    `
      SELECT sponsor_tier_id
      FROM sponsor_tiers
      WHERE sponsor_tier_id = $1
        AND active = TRUE
    `,
    [tierId],
  );

  if (!result.rows[0]) {
    throw new ServiceError(
      400,
      "The selected sponsor tier does not exist or is inactive.",
    );
  }
}

export async function listEventSponsors(
  eventId: number,
): Promise<EventSponsorRecord[]> {
  await assertEventExists(eventId);

  const result =
    await db.query<EventSponsorRecord>(
      `
        SELECT
          s.sponsor_id,
          s.sponsor_name,
          s.sponsor_description,
          s.sponsor_logo,
          s.sponsor_website,
          st.sponsor_tier_id,
          st.sponsor_tier_name,
          st.color AS sponsor_tier_color
        FROM sponsor_events se
        INNER JOIN sponsors s
          ON s.sponsor_id = se.sponsor_id
        INNER JOIN sponsor_tiers st
          ON st.sponsor_tier_id =
            se.sponsor_tier_id
        WHERE se.event_id = $1
          AND s.deleted_at IS NULL
        ORDER BY
          st.sponsor_tier_name ASC,
          s.sponsor_name ASC
      `,
      [eventId],
    );

  return result.rows;
}

export async function attachSponsorToEvent(
  eventId: number,
  input: AttachEventSponsorInput,
): Promise<EventSponsorRecord> {
  await Promise.all([
    assertEventExists(eventId),
    assertSponsorExists(input.sponsor_id),
    assertActiveTierExists(
      input.sponsor_tier_id,
    ),
  ]);

  try {
    await db.query(
      `
        INSERT INTO sponsor_events (
          sponsor_id,
          event_id,
          sponsor_tier_id
        )
        VALUES ($1, $2, $3)
      `,
      [
        input.sponsor_id,
        eventId,
        input.sponsor_tier_id,
      ],
    );
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new ServiceError(
        409,
        "This sponsor is already attached to the event.",
        "SPONSOR_ALREADY_ATTACHED",
      );
    }

    throw error;
  }

  const result =
    await db.query<EventSponsorRecord>(
      `
        SELECT
          s.sponsor_id,
          s.sponsor_name,
          s.sponsor_description,
          s.sponsor_logo,
          s.sponsor_website,
          st.sponsor_tier_id,
          st.sponsor_tier_name,
          st.color AS sponsor_tier_color
        FROM sponsor_events se
        INNER JOIN sponsors s
          ON s.sponsor_id = se.sponsor_id
        INNER JOIN sponsor_tiers st
          ON st.sponsor_tier_id =
            se.sponsor_tier_id
        WHERE se.event_id = $1
          AND se.sponsor_id = $2
      `,
      [eventId, input.sponsor_id],
    );

  return result.rows[0];
}

export async function updateEventSponsorTier(
  eventId: number,
  sponsorId: number,
  input: UpdateEventSponsorInput,
): Promise<EventSponsorRecord> {
  await assertActiveTierExists(
    input.sponsor_tier_id,
  );

  const updateResult = await db.query(
    `
      UPDATE sponsor_events
      SET sponsor_tier_id = $3
      WHERE event_id = $1
        AND sponsor_id = $2
      RETURNING sponsor_id
    `,
    [
      eventId,
      sponsorId,
      input.sponsor_tier_id,
    ],
  );

  if (!updateResult.rows[0]) {
    throw new ServiceError(
      404,
      "The sponsor is not attached to this event.",
    );
  }

  const result =
    await db.query<EventSponsorRecord>(
      `
        SELECT
          s.sponsor_id,
          s.sponsor_name,
          s.sponsor_description,
          s.sponsor_logo,
          s.sponsor_website,
          st.sponsor_tier_id,
          st.sponsor_tier_name,
          st.color AS sponsor_tier_color
        FROM sponsor_events se
        INNER JOIN sponsors s
          ON s.sponsor_id = se.sponsor_id
        INNER JOIN sponsor_tiers st
          ON st.sponsor_tier_id =
            se.sponsor_tier_id
        WHERE se.event_id = $1
          AND se.sponsor_id = $2
      `,
      [eventId, sponsorId],
    );

  return result.rows[0];
}

export async function removeSponsorFromEvent(
  eventId: number,
  sponsorId: number,
): Promise<void> {
  const result = await db.query(
    `
      DELETE FROM sponsor_events
      WHERE event_id = $1
        AND sponsor_id = $2
      RETURNING sponsor_id
    `,
    [eventId, sponsorId],
  );

  if (!result.rows[0]) {
    throw new ServiceError(
      404,
      "The sponsor is not attached to this event.",
    );
  }
}