import {
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  createEventTicket,
  deleteEventTicket,
  getEventTicket,
  getEventTickets,
  getTicketCategories,
  getTicketStatuses,
  updateEventTicket,
  type CreateTicketInput,
  type EventTicket,
  type TicketCategory,
  type TicketStatus,
} from "../api/ticketApi";

type EventTicketsViewProps = {
  eventId: number;
};

type TicketFormState = {
  statusId: string;
  name: string;
  description: string;
  price: string;

  discountPercentage: string;
  discountFixed: string;

  quantityAvailable: string;

  saleStart: string;
  saleEnd: string;

  minPerOrder: string;
  maxPerOrder: string;

  categoryIds: number[];
};

const EMPTY_FORM: TicketFormState = {
  statusId: "",
  name: "",
  description: "",
  price: "0.00",

  discountPercentage: "",
  discountFixed: "",

  quantityAvailable: "0",

  saleStart: "",
  saleEnd: "",

  minPerOrder: "1",
  maxPerOrder: "",

  categoryIds: [],
};

function toDateTimeLocal(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offset = date.getTimezoneOffset();
  const localDate = new Date(
    date.getTime() - offset * 60_000,
  );

  return localDate
    .toISOString()
    .slice(0, 16);
}

function toIsoDate(
  value: string,
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function parseOptionalNumber(
  value: string,
): number | null {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}

function getTicketCapacity(
  ticket: EventTicket,
): number {
  return ticket.quantity_available;
}

function getRemainingQuantity(
  ticket: EventTicket,
): number {
  return Math.max(
    0,
    ticket.remaining_quantity ??
      ticket.quantity_available -
        ticket.quantity_sold -
        ticket.quantity_reserved,
  );
}

export function EventTicketsView({
  eventId,
}: EventTicketsViewProps) {
  const queryClient = useQueryClient();

  const [isEditorOpen, setIsEditorOpen] =
    useState(false);

  const [editingTicketId, setEditingTicketId] =
    useState<number | null>(null);

  const [deletingTicketId, setDeletingTicketId] =
    useState<number | null>(null);

  const [form, setForm] =
    useState<TicketFormState>(EMPTY_FORM);

  const [formError, setFormError] =
    useState<string | null>(null);

  const ticketsQuery = useQuery({
    queryKey: ["event-tickets", eventId],
    queryFn: () => getEventTickets(eventId),
    enabled: Number.isInteger(eventId) && eventId > 0,
  });

  const statusesQuery = useQuery({
    queryKey: ["ticket-statuses"],
    queryFn: getTicketStatuses,
  });

  const categoriesQuery = useQuery({
    queryKey: ["ticket-categories"],
    queryFn: getTicketCategories,
  });

  const editingTicketQuery = useQuery({
    queryKey: [
      "event-ticket",
      eventId,
      editingTicketId,
    ],
    queryFn: () =>
      getEventTicket(eventId, editingTicketId!),
    enabled:
      isEditorOpen &&
      editingTicketId !== null,
  });

  useEffect(() => {
    const ticket = editingTicketQuery.data;

    if (!ticket || editingTicketId === null) {
      return;
    }

    setForm({
      statusId: String(
        ticket.status?.ticket_status_id ??
          ticket.status_id,
      ),
      name: ticket.ticket_name,
      description:
        ticket.ticket_description ?? "",
      price: String(ticket.ticket_price),

      discountPercentage:
        ticket.discount_percentage === null
          ? ""
          : String(ticket.discount_percentage),

      discountFixed:
        ticket.discount_fixed === null
          ? ""
          : String(ticket.discount_fixed),

      quantityAvailable: String(
        ticket.quantity_available,
      ),

      saleStart: toDateTimeLocal(
        ticket.sale_start,
      ),
      saleEnd: toDateTimeLocal(
        ticket.sale_end,
      ),

      minPerOrder: String(
        ticket.min_per_order,
      ),

      maxPerOrder:
        ticket.max_per_order === null
          ? ""
          : String(ticket.max_per_order),

      categoryIds:
        ticket.categories?.map(
          (category) =>
            category.ticket_category_id,
        ) ?? [],
    });
  }, [
    editingTicketId,
    editingTicketQuery.data,
  ]);

  const invalidateTicketQueries =
    async (): Promise<void> => {
      await queryClient.invalidateQueries({
        queryKey: ["event-tickets", eventId],
      });

      if (editingTicketId !== null) {
        await queryClient.invalidateQueries({
          queryKey: [
            "event-ticket",
            eventId,
            editingTicketId,
          ],
        });
      }
    };

  const saveMutation = useMutation({
    mutationFn: async (
      input: CreateTicketInput,
    ) => {
      if (editingTicketId === null) {
        return createEventTicket(
          eventId,
          input,
        );
      }

      return updateEventTicket(
        eventId,
        editingTicketId,
        input,
      );
    },

    onSuccess: async () => {
      await invalidateTicketQueries();
      closeEditor();
    },

    onError: (error) => {
      setFormError(
        error instanceof Error
          ? error.message
          : "Unable to save the ticket.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (ticketId: number) =>
      deleteEventTicket(
        eventId,
        ticketId,
      ),

    onSuccess: async () => {
      setDeletingTicketId(null);

      await queryClient.invalidateQueries({
        queryKey: [
          "event-tickets",
          eventId,
        ],
      });
    },
  });

  const tickets =
    ticketsQuery.data?.data ?? [];

  const statuses =
    statusesQuery.data ?? [];

  const categories =
    categoriesQuery.data ?? [];

  const totalSold = tickets.reduce(
    (total, ticket) =>
      total + ticket.quantity_sold,
    0,
  );

  const totalRevenue = tickets.reduce(
    (total, ticket) =>
      total +
      ticket.quantity_sold *
        Number(ticket.ticket_price),
    0,
  );

  function openCreateEditor(): void {
    const defaultStatus =
      findDefaultStatus(statuses);

    setEditingTicketId(null);
    setForm({
      ...EMPTY_FORM,
      statusId: defaultStatus
        ? String(
            defaultStatus.ticket_status_id,
          )
        : "",
    });
    setFormError(null);
    setIsEditorOpen(true);
  }

  function openEditEditor(
    ticketId: number,
  ): void {
    setEditingTicketId(ticketId);
    setForm(EMPTY_FORM);
    setFormError(null);
    setIsEditorOpen(true);
  }

  function closeEditor(): void {
    if (saveMutation.isPending) {
      return;
    }

    setIsEditorOpen(false);
    setEditingTicketId(null);
    setForm(EMPTY_FORM);
    setFormError(null);
  }

  function updateField<
    Key extends keyof TicketFormState,
  >(
    key: Key,
    value: TicketFormState[Key],
  ): void {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function toggleCategory(
    categoryId: number,
  ): void {
    setForm((current) => {
      const isSelected =
        current.categoryIds.includes(
          categoryId,
        );

      return {
        ...current,
        categoryIds: isSelected
          ? current.categoryIds.filter(
              (id) => id !== categoryId,
            )
          : [
              ...current.categoryIds,
              categoryId,
            ],
      };
    });
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ): void {
    event.preventDefault();
    setFormError(null);

    const ticketName = form.name.trim();
    const price = Number(form.price);
    const quantityAvailable = Number(
      form.quantityAvailable,
    );
    const minPerOrder = Number(
      form.minPerOrder,
    );

    if (!ticketName) {
      setFormError(
        "Ticket name is required.",
      );
      return;
    }

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      setFormError(
        "Ticket price must be zero or greater.",
      );
      return;
    }

    if (
      !Number.isInteger(
        quantityAvailable,
      ) ||
      quantityAvailable < 0
    ) {
      setFormError(
        "Quantity available must be a non-negative whole number.",
      );
      return;
    }

    if (
      !Number.isInteger(minPerOrder) ||
      minPerOrder < 1
    ) {
      setFormError(
        "Minimum per order must be at least 1.",
      );
      return;
    }

    const maxPerOrder =
      parseOptionalNumber(
        form.maxPerOrder,
      );

    if (
      maxPerOrder !== null &&
      (!Number.isInteger(maxPerOrder) ||
        maxPerOrder < minPerOrder)
    ) {
      setFormError(
        "Maximum per order must be a whole number greater than or equal to the minimum.",
      );
      return;
    }

    const discountPercentage =
      parseOptionalNumber(
        form.discountPercentage,
      );

    if (
      discountPercentage !== null &&
      (discountPercentage < 0 ||
        discountPercentage > 100)
    ) {
      setFormError(
        "Discount percentage must be between 0 and 100.",
      );
      return;
    }

    const discountFixed =
      parseOptionalNumber(
        form.discountFixed,
      );

    if (
      discountFixed !== null &&
      discountFixed < 0
    ) {
      setFormError(
        "Fixed discount cannot be negative.",
      );
      return;
    }

    const payload: CreateTicketInput = {
      ticket_name: ticketName,
      ticket_description:
        form.description.trim() || null,
      ticket_price: price,
      quantity_available:
        quantityAvailable,
      discount_percentage:
        discountPercentage,
      discount_fixed: discountFixed,
      sale_start: toIsoDate(
        form.saleStart,
      ),
      sale_end: toIsoDate(form.saleEnd),
      min_per_order: minPerOrder,
      max_per_order: maxPerOrder,
      category_ids: form.categoryIds,
    };

    const statusId = Number(
      form.statusId,
    );

    if (Number.isInteger(statusId)) {
      payload.status_id = statusId;
    }

    saveMutation.mutate(payload);
  }

  if (ticketsQuery.isLoading) {
    return (
      <section className="event-static-view">
        <p>Loading tickets...</p>
      </section>
    );
  }

  if (ticketsQuery.isError) {
    return (
      <section className="event-static-view">
        <div className="event-error-state">
          <p>
            {ticketsQuery.error instanceof Error
              ? ticketsQuery.error.message
              : "Unable to load tickets."}
          </p>

          <button
            type="button"
            className="event-primary-action"
            onClick={() =>
              ticketsQuery.refetch()
            }
          >
            Try Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="event-static-view">
        <div className="event-static-view__toolbar">
          <div className="event-ticket-summary">
            <div>
              <span>Total Sold</span>
              <strong>
                {totalSold.toLocaleString()}
              </strong>
            </div>

            <div>
              <span>Total Revenue</span>
              <strong>
                {totalRevenue.toLocaleString(
                  undefined,
                  {
                    style: "currency",
                    currency: "USD",
                  },
                )}
              </strong>
            </div>
          </div>

          <button
            className="event-primary-action"
            type="button"
            onClick={openCreateEditor}
          >
            <Plus size={19} />
            Add Ticket Type
          </button>
        </div>

        {tickets.length === 0 ? (
          <div className="event-empty-state">
            <h3>No ticket types yet</h3>
            <p>
              Add the first ticket type for
              this event.
            </p>

            <button
              className="event-primary-action"
              type="button"
              onClick={openCreateEditor}
            >
              <Plus size={19} />
              Add Ticket Type
            </button>
          </div>
        ) : (
          <div className="event-ticket-list">
            {tickets.map((ticket) => {
              const capacity =
                getTicketCapacity(ticket);

              const remaining =
                getRemainingQuantity(ticket);

              const soldPercentage =
                capacity > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (ticket.quantity_sold /
                          capacity) *
                          100,
                      ),
                    )
                  : 0;

              return (
                <article
                  key={ticket.ticket_id}
                  className="event-ticket-card"
                >
                  <div className="event-ticket-card__actions">
                    <button
                      className="event-icon-button"
                      type="button"
                      aria-label={`Edit ${ticket.ticket_name}`}
                      onClick={() =>
                        openEditEditor(
                          ticket.ticket_id,
                        )
                      }
                    >
                      <Pencil size={18} />
                    </button>

                    <button
                      className="event-icon-button event-icon-button--danger"
                      type="button"
                      aria-label={`Delete ${ticket.ticket_name}`}
                      onClick={() =>
                        setDeletingTicketId(
                          ticket.ticket_id,
                        )
                      }
                    >
                      <Trash2 size={19} />
                    </button>
                  </div>

                  <div className="event-ticket-card__heading">
                    <div>
                      <h3>
                        {ticket.ticket_name}
                      </h3>

                      <TicketStatusBadge
                        name={
                          ticket.ticket_status_name
                        }
                        statuses={statuses}
                        statusId={
                          ticket.status_id
                        }
                      />
                    </div>

                    <span className="event-ticket-price">
                      {Number(
                        ticket.ticket_price,
                      ).toLocaleString(
                        undefined,
                        {
                          style: "currency",
                          currency: "USD",
                        },
                      )}
                    </span>
                  </div>

                  <p>
                    {ticket.ticket_description ||
                      "No description provided."}
                  </p>

                  <div className="event-ticket-card__numbers">
                    <span>
                      {ticket.quantity_sold.toLocaleString()}{" "}
                      sold
                    </span>

                    <span aria-hidden="true">
                      ·
                    </span>

                    <span>
                      {remaining.toLocaleString()}{" "}
                      remaining
                    </span>

                    <span aria-hidden="true">
                      ·
                    </span>

                    <span>
                      {capacity.toLocaleString()}{" "}
                      capacity
                    </span>

                    {ticket.quantity_reserved >
                      0 && (
                      <>
                        <span aria-hidden="true">
                          ·
                        </span>

                        <span>
                          {ticket.quantity_reserved.toLocaleString()}{" "}
                          reserved
                        </span>
                      </>
                    )}
                  </div>

                  <div
                    className="event-ticket-progress"
                    role="progressbar"
                    aria-label={`${ticket.ticket_name} sales progress`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={
                      soldPercentage
                    }
                  >
                    <span
                      style={{
                        width: `${soldPercentage}%`,
                      }}
                    />
                  </div>

                  <small>
                    {soldPercentage}% sold
                  </small>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isEditorOpen && (
        <div
          className="event-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeEditor();
            }
          }}
        >
          <section
            className="event-modal event-ticket-editor"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-editor-title"
          >
            <div className="event-modal__header">
              <div>
                <h2 id="ticket-editor-title">
                  {editingTicketId === null
                    ? "Add Ticket Type"
                    : "Edit Ticket Type"}
                </h2>

                <p>
                  Configure ticket pricing,
                  quantities, dates, and
                  categories.
                </p>
              </div>

              <button
                type="button"
                className="event-icon-button"
                onClick={closeEditor}
                aria-label="Close ticket editor"
              >
                <X size={20} />
              </button>
            </div>

            {editingTicketQuery.isLoading ? (
              <div className="event-modal__body">
                <p>
                  Loading ticket details...
                </p>
              </div>
            ) : editingTicketQuery.isError ? (
              <div className="event-modal__body">
                <p className="event-form-error">
                  {editingTicketQuery.error instanceof
                  Error
                    ? editingTicketQuery.error
                        .message
                    : "Unable to load ticket details."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="event-modal__body">
                  {formError && (
                    <p
                      className="event-form-error"
                      role="alert"
                    >
                      {formError}
                    </p>
                  )}

                  <div className="event-form-grid">
                    <label className="event-form-field event-form-field--wide">
                      <span>Ticket name</span>

                      <input
                        type="text"
                        value={form.name}
                        maxLength={100}
                        required
                        onChange={(event) =>
                          updateField(
                            "name",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="event-form-field">
                      <span>Status</span>

                      <select
                        value={form.statusId}
                        onChange={(event) =>
                          updateField(
                            "statusId",
                            event.target.value,
                          )
                        }
                      >
                        <option value="">
                          Use default status
                        </option>

                        {statuses.map(
                          (status) => (
                            <option
                              key={
                                status.ticket_status_id
                              }
                              value={
                                status.ticket_status_id
                              }
                            >
                              {
                                status.ticket_status_name
                              }
                            </option>
                          ),
                        )}
                      </select>
                    </label>

                    <label className="event-form-field">
                      <span>Price</span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        required
                        onChange={(event) =>
                          updateField(
                            "price",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="event-form-field event-form-field--wide">
                      <span>Description</span>

                      <textarea
                        rows={3}
                        value={
                          form.description
                        }
                        onChange={(event) =>
                          updateField(
                            "description",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="event-form-field">
                      <span>
                        Quantity available
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={
                          form.quantityAvailable
                        }
                        required
                        onChange={(event) =>
                          updateField(
                            "quantityAvailable",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="event-form-field">
                      <span>
                        Minimum per order
                      </span>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          form.minPerOrder
                        }
                        required
                        onChange={(event) =>
                          updateField(
                            "minPerOrder",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="event-form-field">
                      <span>
                        Maximum per order
                      </span>

                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={
                          form.maxPerOrder
                        }
                        placeholder="No maximum"
                        onChange={(event) =>
                          updateField(
                            "maxPerOrder",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="event-form-field">
                      <span>
                        Percentage discount
                      </span>

                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={
                          form.discountPercentage
                        }
                        placeholder="None"
                        onChange={(event) =>
                          updateField(
                            "discountPercentage",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="event-form-field">
                      <span>
                        Fixed discount
                      </span>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          form.discountFixed
                        }
                        placeholder="None"
                        onChange={(event) =>
                          updateField(
                            "discountFixed",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="event-form-field">
                      <span>Sale starts</span>

                      <input
                        type="datetime-local"
                        value={form.saleStart}
                        onChange={(event) =>
                          updateField(
                            "saleStart",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <label className="event-form-field">
                      <span>Sale ends</span>

                      <input
                        type="datetime-local"
                        value={form.saleEnd}
                        onChange={(event) =>
                          updateField(
                            "saleEnd",
                            event.target.value,
                          )
                        }
                      />
                    </label>

                    <fieldset className="event-form-field event-form-field--wide event-category-fieldset">
                      <legend>
                        Ticket categories
                      </legend>

                      {categoriesQuery.isLoading ? (
                        <p>
                          Loading categories...
                        </p>
                      ) : categories.length ===
                        0 ? (
                        <p>
                          No active ticket
                          categories are available.
                        </p>
                      ) : (
                        <div className="event-category-options">
                          {categories.map(
                            (category) => (
                              <TicketCategoryOption
                                key={
                                  category.ticket_category_id
                                }
                                category={
                                  category
                                }
                                checked={form.categoryIds.includes(
                                  category.ticket_category_id,
                                )}
                                onChange={() =>
                                  toggleCategory(
                                    category.ticket_category_id,
                                  )
                                }
                              />
                            ),
                          )}
                        </div>
                      )}
                    </fieldset>
                  </div>
                </div>

                <div className="event-modal__footer">
                  <button
                    type="button"
                    className="event-secondary-action"
                    onClick={closeEditor}
                    disabled={
                      saveMutation.isPending
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="event-primary-action"
                    disabled={
                      saveMutation.isPending
                    }
                  >
                    {saveMutation.isPending
                      ? "Saving..."
                      : editingTicketId ===
                          null
                        ? "Create Ticket"
                        : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {deletingTicketId !== null && (
        <div
          className="event-modal-backdrop"
          role="presentation"
        >
          <section
            className="event-modal event-confirmation-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-ticket-title"
          >
            <div className="event-modal__header">
              <div>
                <h2 id="delete-ticket-title">
                  Delete ticket type?
                </h2>

                <p>
                  This ticket will no longer
                  appear as an active event
                  ticket.
                </p>
              </div>
            </div>

            {deleteMutation.isError && (
              <div className="event-modal__body">
                <p
                  className="event-form-error"
                  role="alert"
                >
                  {deleteMutation.error instanceof
                  Error
                    ? deleteMutation.error
                        .message
                    : "Unable to delete the ticket."}
                </p>
              </div>
            )}

            <div className="event-modal__footer">
              <button
                type="button"
                className="event-secondary-action"
                disabled={
                  deleteMutation.isPending
                }
                onClick={() =>
                  setDeletingTicketId(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="event-danger-action"
                disabled={
                  deleteMutation.isPending
                }
                onClick={() =>
                  deleteMutation.mutate(
                    deletingTicketId,
                  )
                }
              >
                <Trash2 size={18} />

                {deleteMutation.isPending
                  ? "Deleting..."
                  : "Delete Ticket"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

function findDefaultStatus(
  statuses: TicketStatus[],
): TicketStatus | undefined {
  return (
    statuses.find(
      (status) =>
        status.ticket_status_name.toLowerCase() ===
        "draft",
    ) ?? statuses[0]
  );
}

type TicketStatusBadgeProps = {
  statusId: number;
  name: string;
  statuses: TicketStatus[];
};

function TicketStatusBadge({
  statusId,
  name,
  statuses,
}: TicketStatusBadgeProps) {
  const status = statuses.find(
    (item) =>
      item.ticket_status_id === statusId,
  );

  return (
    <span
      className="event-ticket-status"
      style={
        status?.color
          ? {
              borderColor: status.color,
              color: status.color,
            }
          : undefined
      }
    >
      {name}
    </span>
  );
}

type TicketCategoryOptionProps = {
  category: TicketCategory;
  checked: boolean;
  onChange: () => void;
};

function TicketCategoryOption({
  category,
  checked,
  onChange,
}: TicketCategoryOptionProps) {
  return (
    <label className="event-category-option">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
      />

      {category.color && (
        <span
          className="event-category-option__color"
          style={{
            backgroundColor:
              category.color,
          }}
          aria-hidden="true"
        />
      )}

      <span>
        {category.ticket_category_name}
      </span>
    </label>
  );
}