import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Save,
  Trash2,
} from "lucide-react";
import {
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import {
  type FormEvent,
  useState,
} from "react";
import "./VenueDetails.css";
import {
  useCreateVenue,
  useDeleteVenue,
  useReplaceVenueCategories,
  useUpdateVenue,
  useVenue,
} from "./hooks/useVenues";
import {
  useVenueCategories,
  useVenueStatuses,
} from "./hooks/useVenueLookup";
import type {
  CreateVenueBody,
  UpdateVenueBody,
  Venue,
  VenueFormValues,
} from "./types/venueTypes";

const EMPTY_FORM: VenueFormValues = {
  status_id: null,
  venue_name: "",
  venue_description: "",
  venue_address: "",
  venue_city: "",
  venue_state: "",
  venue_country: "",
  venue_zip: "",
  venue_address_link: "",
  latitude: "",
  longitude: "",
  venue_capacity: "",
  venue_image: "",
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  website: "",
  category_ids: [],
};

function venueToFormValues(
  venue: Venue,
): VenueFormValues {
  return {
    status_id: venue.status.status_id,
    venue_name: venue.venue_name,
    venue_description:
      venue.venue_description ?? "",
    venue_address: venue.venue_address ?? "",
    venue_city: venue.venue_city ?? "",
    venue_state: venue.venue_state ?? "",
    venue_country: venue.venue_country ?? "",
    venue_zip: venue.venue_zip ?? "",
    venue_address_link:
      venue.venue_address_link ?? "",
    latitude: venue.latitude ?? "",
    longitude: venue.longitude ?? "",
    venue_capacity:
      venue.venue_capacity === null
        ? ""
        : String(venue.venue_capacity),
    venue_image: venue.venue_image ?? "",
    contact_name: venue.contact_name ?? "",
    contact_email: venue.contact_email ?? "",
    contact_phone: venue.contact_phone ?? "",
    website: venue.website ?? "",
    category_ids: venue.categories.map(
      (category) =>
        category.venue_category_id,
    ),
  };
}

function emptyStringToNull(
  value: string,
): string | null {
  const normalized = value.trim();

  return normalized || null;
}

function optionalNumber(
  value: string,
  fieldName: string,
): number | null {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    throw new Error(
      `${fieldName} must be a valid number.`,
    );
  }

  return parsed;
}

function formValuesToBody(
  values: VenueFormValues,
): CreateVenueBody {
  if (values.status_id === null) {
    throw new Error(
      "A venue status is required.",
    );
  }

  const latitude = optionalNumber(
    values.latitude,
    "Latitude",
  );

  const longitude = optionalNumber(
    values.longitude,
    "Longitude",
  );

  const capacity = optionalNumber(
    values.venue_capacity,
    "Capacity",
  );

  if (
    latitude !== null &&
    (latitude < -90 || latitude > 90)
  ) {
    throw new Error(
      "Latitude must be between -90 and 90.",
    );
  }

  if (
    longitude !== null &&
    (longitude < -180 || longitude > 180)
  ) {
    throw new Error(
      "Longitude must be between -180 and 180.",
    );
  }

  if (capacity !== null && capacity < 0) {
    throw new Error(
      "Capacity cannot be negative.",
    );
  }

  return {
    status_id: values.status_id,
    venue_name: values.venue_name.trim(),
    venue_description: emptyStringToNull(
      values.venue_description,
    ),
    venue_address: emptyStringToNull(
      values.venue_address,
    ),
    venue_city: emptyStringToNull(
      values.venue_city,
    ),
    venue_state: emptyStringToNull(
      values.venue_state,
    ),
    venue_country: emptyStringToNull(
      values.venue_country,
    ),
    venue_zip: emptyStringToNull(
      values.venue_zip,
    ),
    venue_address_link: emptyStringToNull(
      values.venue_address_link,
    ),
    latitude,
    longitude,
    venue_capacity: capacity,
    venue_image: emptyStringToNull(
      values.venue_image,
    ),
    contact_name: emptyStringToNull(
      values.contact_name,
    ),
    contact_email: emptyStringToNull(
      values.contact_email,
    ),
    contact_phone: emptyStringToNull(
      values.contact_phone,
    ),
    website: emptyStringToNull(
      values.website,
    ),
    category_ids: values.category_ids,
  };
}

type VenueEditorProps = {
  isCreating: boolean;
  venueId: number | null;
  initialVenue: Venue | null;
};

function VenueEditor({
  isCreating,
  venueId,
  initialVenue,
}: VenueEditorProps) {
  const navigate = useNavigate();

  const createMutation = useCreateVenue();
  const updateMutation = useUpdateVenue(
    venueId ?? 0,
  );
  const deleteMutation = useDeleteVenue();
  const replaceCategoriesMutation =
    useReplaceVenueCategories(
      venueId ?? 0,
    );

  /*
   * Include inactive lookup values while editing so
   * previously assigned statuses and categories remain
   * visible.
   */
  const venueStatusesQuery =
    useVenueStatuses(!isCreating);

  const venueCategoriesQuery =
    useVenueCategories(!isCreating);

  const [form, setForm] =
    useState<VenueFormValues>(() =>
      initialVenue
        ? venueToFormValues(initialVenue)
        : { ...EMPTY_FORM },
    );

  const [formError, setFormError] =
    useState<string | null>(null);

  const [saveMessage, setSaveMessage] =
    useState<string | null>(null);

  const isSaving =
    createMutation.isPending ||
    updateMutation.isPending ||
    replaceCategoriesMutation.isPending;

  const updateField = <
    K extends keyof VenueFormValues,
  >(
    field: K,
    value: VenueFormValues[K],
  ) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

    setSaveMessage(null);
  };

  const toggleCategory = (
    categoryId: number,
    checked: boolean,
  ) => {
    setForm((current) => ({
      ...current,
      category_ids: checked
        ? Array.from(
            new Set([
              ...current.category_ids,
              categoryId,
            ]),
          )
        : current.category_ids.filter(
            (id) => id !== categoryId,
          ),
    }));

    setSaveMessage(null);
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    setFormError(null);
    setSaveMessage(null);

    try {
      if (!form.venue_name.trim()) {
        throw new Error(
          "Venue name is required.",
        );
      }

      const body = formValuesToBody(form);

      if (isCreating) {
        const result =
          await createMutation.mutateAsync(
            body,
          );

        void navigate({
          to: "/venues/$venueId",
          params: {
            venueId: String(
              result.data.venue_id,
            ),
          },
          replace: true,
        });

        return;
      }

      if (
        venueId === null ||
        !Number.isInteger(venueId) ||
        venueId <= 0
      ) {
        throw new Error(
          "The venue ID is invalid.",
        );
      }

      /*
       * The general PATCH endpoint does not update
       * venue_categories. Remove category_ids from the
       * PATCH body and send them through the dedicated
       * category replacement endpoint.
       */
      const {
        category_ids: categoryIds,
        ...venueFields
      } = body;

      const updateBody: UpdateVenueBody =
        venueFields;

      await updateMutation.mutateAsync(
        updateBody,
      );

      await replaceCategoriesMutation.mutateAsync(
        categoryIds ?? [],
      );

      setSaveMessage(
        "Venue saved successfully.",
      );
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "The venue could not be saved.",
      );
    }
  };

  const handleDelete = async () => {
    if (
      venueId === null ||
      initialVenue === null
    ) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${initialVenue.venue_name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setFormError(null);
    setSaveMessage(null);

    try {
      await deleteMutation.mutateAsync(
        venueId,
      );

      void navigate({
        to: "/venues",
      });
    } catch (error) {
      setFormError(
        error instanceof Error
          ? error.message
          : "The venue could not be deleted.",
      );
    }
  };

  return (
    <div className="venue-details-page">
      <div className="venue-details-header">
        <div>
          <button
            type="button"
            className="venue-details-back"
            onClick={() =>
              void navigate({
                to: "/venues",
              })
            }
          >
            <ArrowLeft size={17} />
            Venues
          </button>

          <h1>
            {isCreating
              ? "Add Venue"
              : form.venue_name ||
                "Venue Details"}
          </h1>

          <p>
            {isCreating
              ? "Create a venue and configure its details."
              : "View and update venue information."}
          </p>
        </div>

        <div className="venue-details-header__actions">
          {!isCreating && (
            <button
              type="button"
              className="danger-button"
              onClick={() =>
                void handleDelete()
              }
              disabled={
                deleteMutation.isPending ||
                isSaving
              }
            >
              <Trash2 size={17} />

              {deleteMutation.isPending
                ? "Deleting..."
                : "Delete"}
            </button>
          )}

          <button
            type="submit"
            form="venue-details-form"
            className="primary-button"
            disabled={
              isSaving ||
              deleteMutation.isPending
            }
          >
            <Save size={17} />

            {isSaving
              ? "Saving..."
              : isCreating
                ? "Create Venue"
                : "Save Changes"}
          </button>
        </div>
      </div>

      {formError && (
        <div
          className="venue-form-error"
          role="alert"
        >
          {formError}
        </div>
      )}

      {saveMessage && (
        <div
          className="venue-form-success"
          role="status"
        >
          {saveMessage}
        </div>
      )}

      <form
        id="venue-details-form"
        className="venue-details-layout"
        onSubmit={handleSubmit}
      >
        <div className="venue-details-main">
          <section className="venue-form-section">
            <div className="venue-form-section__heading">
              <h2>General information</h2>

              <p>
                Basic venue information shown
                throughout the application.
              </p>
            </div>

            <div className="venue-form-grid">
              <label className="venue-field venue-field--wide">
                <span>Venue name</span>

                <input
                  value={form.venue_name}
                  onChange={(event) =>
                    updateField(
                      "venue_name",
                      event.target.value,
                    )
                  }
                  required
                  maxLength={255}
                />
              </label>

              <label className="venue-field">
                <span>Status</span>

                <select
                  value={
                    form.status_id ?? ""
                  }
                  onChange={(event) =>
                    updateField(
                      "status_id",
                      event.target.value
                        ? Number(
                            event.target
                              .value,
                          )
                        : null,
                    )
                  }
                  required
                  disabled={
                    venueStatusesQuery.isPending
                  }
                >
                  <option value="">
                    {venueStatusesQuery.isPending
                      ? "Loading statuses..."
                      : "Select a status"}
                  </option>

                  {venueStatusesQuery.data?.map(
                    (status) => (
                      <option
                        key={
                          status.venue_status_id
                        }
                        value={
                          status.venue_status_id
                        }
                      >
                        {
                          status.venue_status_name
                        }
                        {!status.active
                          ? " (Inactive)"
                          : ""}
                      </option>
                    ),
                  )}
                </select>

                {venueStatusesQuery.isError && (
                  <small className="venue-field-error">
                    Venue statuses could not
                    be loaded.
                  </small>
                )}
              </label>

              <label className="venue-field">
                <span>Capacity</span>

                <input
                  type="number"
                  min={0}
                  step={1}
                  value={
                    form.venue_capacity
                  }
                  onChange={(event) =>
                    updateField(
                      "venue_capacity",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field venue-field--wide">
                <span>Description</span>

                <textarea
                  rows={6}
                  value={
                    form.venue_description
                  }
                  onChange={(event) =>
                    updateField(
                      "venue_description",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section className="venue-form-section">
            <div className="venue-form-section__heading">
              <h2>Location</h2>

              <p>
                Address and geographical details
                for the venue.
              </p>
            </div>

            <div className="venue-form-grid">
              <label className="venue-field venue-field--wide">
                <span>Street address</span>

                <input
                  value={form.venue_address}
                  onChange={(event) =>
                    updateField(
                      "venue_address",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field">
                <span>City</span>

                <input
                  value={form.venue_city}
                  onChange={(event) =>
                    updateField(
                      "venue_city",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field">
                <span>
                  State or province
                </span>

                <input
                  value={form.venue_state}
                  onChange={(event) =>
                    updateField(
                      "venue_state",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field">
                <span>Country</span>

                <input
                  value={form.venue_country}
                  onChange={(event) =>
                    updateField(
                      "venue_country",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field">
                <span>
                  ZIP or postal code
                </span>

                <input
                  value={form.venue_zip}
                  onChange={(event) =>
                    updateField(
                      "venue_zip",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field">
                <span>Latitude</span>

                <input
                  type="number"
                  step="any"
                  min={-90}
                  max={90}
                  value={form.latitude}
                  onChange={(event) =>
                    updateField(
                      "latitude",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field">
                <span>Longitude</span>

                <input
                  type="number"
                  step="any"
                  min={-180}
                  max={180}
                  value={form.longitude}
                  onChange={(event) =>
                    updateField(
                      "longitude",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field venue-field--wide">
                <span>Map link</span>

                <div className="venue-input-with-action">
                  <input
                    type="url"
                    value={
                      form.venue_address_link
                    }
                    onChange={(event) =>
                      updateField(
                        "venue_address_link",
                        event.target.value,
                      )
                    }
                  />

                  {form.venue_address_link && (
                    <a
                      href={
                        form.venue_address_link
                      }
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open venue map"
                    >
                      <ExternalLink
                        size={17}
                      />
                    </a>
                  )}
                </div>
              </label>
            </div>
          </section>

          <section className="venue-form-section">
            <div className="venue-form-section__heading">
              <h2>
                Contact information
              </h2>

              <p>
                Public or internal venue contact
                information.
              </p>
            </div>

            <div className="venue-form-grid">
              <label className="venue-field">
                <span>Contact name</span>

                <input
                  value={form.contact_name}
                  onChange={(event) =>
                    updateField(
                      "contact_name",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field">
                <span>Contact email</span>

                <input
                  type="email"
                  value={
                    form.contact_email
                  }
                  onChange={(event) =>
                    updateField(
                      "contact_email",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field">
                <span>Contact phone</span>

                <input
                  type="tel"
                  value={
                    form.contact_phone
                  }
                  onChange={(event) =>
                    updateField(
                      "contact_phone",
                      event.target.value,
                    )
                  }
                />
              </label>

              <label className="venue-field">
                <span>Website</span>

                <input
                  type="url"
                  value={form.website}
                  onChange={(event) =>
                    updateField(
                      "website",
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>
          </section>

          <section className="venue-form-section">
            <div className="venue-form-section__heading">
              <h2>Categories</h2>

              <p>
                Select the categories that
                describe this venue.
              </p>
            </div>

            {venueCategoriesQuery.isPending && (
              <div className="venue-lookup-loading">
                Loading venue categories...
              </div>
            )}

            {venueCategoriesQuery.isError && (
              <div className="venue-field-error">
                Venue categories could not be
                loaded.
              </div>
            )}

            {venueCategoriesQuery.data &&
              venueCategoriesQuery.data
                .length === 0 && (
                <div className="venue-lookup-empty">
                  No venue categories are
                  currently available.
                </div>
              )}

            {venueCategoriesQuery.data &&
              venueCategoriesQuery.data
                .length > 0 && (
                <div className="venue-category-options">
                  {venueCategoriesQuery.data.map(
                    (category) => {
                      const selected =
                        form.category_ids.includes(
                          category.venue_category_id,
                        );

                      return (
                        <label
                          key={
                            category.venue_category_id
                          }
                          className={[
                            "venue-category-option",
                            selected
                              ? "venue-category-option--selected"
                              : "",
                            !category.active
                              ? "venue-category-option--inactive"
                              : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={(
                              event,
                            ) =>
                              toggleCategory(
                                category.venue_category_id,
                                event.target
                                  .checked,
                              )
                            }
                          />

                          <span
                            className="venue-category-option__color"
                            style={{
                              backgroundColor:
                                category.color ??
                                "#d1d5db",
                            }}
                          />

                          <span className="venue-category-option__name">
                            {
                              category.venue_category_name
                            }
                          </span>

                          {!category.active && (
                            <span className="venue-category-option__inactive">
                              Inactive
                            </span>
                          )}
                        </label>
                      );
                    },
                  )}
                </div>
              )}
          </section>
        </div>

        <aside className="venue-details-sidebar">
          <section className="venue-form-section">
            <div className="venue-form-section__heading">
              <h2>Venue image</h2>
            </div>

            <div className="venue-image-preview">
              {form.venue_image ? (
                <img
                  src={form.venue_image}
                  alt={`${form.venue_name || "Venue"} preview`}
                />
              ) : (
                <div>
                  <MapPin size={36} />
                  <span>
                    No image selected
                  </span>
                </div>
              )}
            </div>

            <label className="venue-field">
              <span>Image URL</span>

              <input
                type="url"
                value={form.venue_image}
                onChange={(event) =>
                  updateField(
                    "venue_image",
                    event.target.value,
                  )
                }
              />
            </label>
          </section>

          {!isCreating &&
            initialVenue && (
              <section className="venue-form-section">
                <div className="venue-form-section__heading">
                  <h2>
                    Record information
                  </h2>
                </div>

                <dl className="venue-record-details">
                  <div>
                    <dt>Venue ID</dt>
                    <dd>
                      {
                        initialVenue.venue_id
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>Created</dt>
                    <dd>
                      {new Date(
                        initialVenue.created_at,
                      ).toLocaleString()}
                    </dd>
                  </div>

                  <div>
                    <dt>Updated</dt>
                    <dd>
                      {new Date(
                        initialVenue.updated_at,
                      ).toLocaleString()}
                    </dd>
                  </div>
                </dl>
              </section>
            )}
        </aside>
      </form>
    </div>
  );
}

export function VenueDetailsPage() {
  const navigate = useNavigate();

  const params = useParams({
    strict: false,
  }) as {
    venueId?: string;
  };

  const isCreating =
    params.venueId === undefined;

  const parsedVenueId =
    params.venueId !== undefined
      ? Number(params.venueId)
      : null;

  const venueId =
    parsedVenueId !== null &&
    Number.isInteger(parsedVenueId) &&
    parsedVenueId > 0
      ? parsedVenueId
      : null;

  const hasInvalidVenueId =
    !isCreating && venueId === null;

  const venueQuery = useVenue(
    isCreating ? null : venueId,
  );

  if (hasInvalidVenueId) {
    return (
      <div className="venue-details-state venue-details-state--error">
        <h1>Invalid venue</h1>

        <p>
          The venue ID in the URL is not
          valid.
        </p>

        <button
          type="button"
          onClick={() =>
            void navigate({
              to: "/venues",
            })
          }
        >
          Return to venues
        </button>
      </div>
    );
  }

  if (
    !isCreating &&
    venueQuery.isPending
  ) {
    return (
      <div className="venue-details-state">
        Loading venue...
      </div>
    );
  }

  if (
    !isCreating &&
    venueQuery.isError
  ) {
    return (
      <div className="venue-details-state venue-details-state--error">
        <h1>Venue unavailable</h1>

        <p>
          {venueQuery.error instanceof Error
            ? venueQuery.error.message
            : "The venue could not be loaded."}
        </p>

        <button
          type="button"
          onClick={() =>
            void navigate({
              to: "/venues",
            })
          }
        >
          Return to venues
        </button>
      </div>
    );
  }

  /*
   * The key ensures the editor gets a fresh state
   * when navigating between different venue IDs.
   */
  return (
    <VenueEditor
      key={
        isCreating
          ? "new-venue"
          : `venue-${venueId}`
      }
      isCreating={isCreating}
      venueId={venueId}
      initialVenue={
        venueQuery.data ?? null
      }
    />
  );
}