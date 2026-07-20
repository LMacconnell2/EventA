import {
  AlertCircle,
  Check,
  ImageOff,
  Link as LinkIcon,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  attachSponsorToEvent,
  getEventSponsors,
  getSponsors,
  getSponsorTiers,
  removeSponsorFromEvent,
  updateEventSponsorTier,
  type EventSponsor,
  type Sponsor,
  type SponsorTier,
} from "../api/eventSponsorsApi";

type EventSponsorsViewProps = {
  eventId: number;
  canEdit?: boolean;
};

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

function tierClassName(tierName: string) {
  return tierName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function EventSponsorsView({
  eventId,
  canEdit = true,
}: EventSponsorsViewProps) {
  const queryClient = useQueryClient();

  const [isAddModalOpen, setIsAddModalOpen] =
    useState(false);

  const [editingSponsor, setEditingSponsor] =
    useState<EventSponsor | null>(null);

  const [removingSponsor, setRemovingSponsor] =
    useState<EventSponsor | null>(null);

  const sponsorsQuery = useQuery({
    queryKey: ["events", eventId, "sponsors"],
    queryFn: () => getEventSponsors(eventId),
    enabled: eventId > 0,
  });

  const removeMutation = useMutation({
    mutationFn: (sponsorId: number) =>
      removeSponsorFromEvent(eventId, sponsorId),

    onSuccess: async () => {
      setRemovingSponsor(null);

      await queryClient.invalidateQueries({
        queryKey: ["events", eventId, "sponsors"],
      });
    },
  });

  const groupedSponsors = useMemo(() => {
    const groups = new Map<string, EventSponsor[]>();

    for (const sponsor of sponsorsQuery.data ?? []) {
      const existing =
        groups.get(sponsor.sponsor_tier_name) ?? [];

      existing.push(sponsor);

      groups.set(
        sponsor.sponsor_tier_name,
        existing,
      );
    }

    return Array.from(groups.entries()).map(
      ([tierName, sponsors]) => ({
        tierName,
        color:
          sponsors[0]?.sponsor_tier_color ?? null,
        sponsors,
      }),
    );
  }, [sponsorsQuery.data]);

  if (sponsorsQuery.isPending) {
    return (
      <section className="event-static-view">
        <div
          className="event-sponsor-state"
          role="status"
        >
          <LoaderCircle
            className="event-spinner"
            size={24}
          />

          <p>Loading sponsors...</p>
        </div>
      </section>
    );
  }

  if (sponsorsQuery.isError) {
    return (
      <section className="event-static-view">
        <div
          className="event-sponsor-state event-sponsor-state--error"
          role="alert"
        >
          <AlertCircle size={26} />

          <h3>Unable to load sponsors</h3>

          <p>
            {getErrorMessage(sponsorsQuery.error)}
          </p>

          <button
            className="event-secondary-action"
            type="button"
            onClick={() => sponsorsQuery.refetch()}
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
          <p className="event-static-view__intro">
            Manage event sponsors and their sponsorship
            tiers.
          </p>

          {canEdit && (
            <button
              className="event-primary-action"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={19} />
              Add Sponsor
            </button>
          )}
        </div>

        {groupedSponsors.length === 0 ? (
          <div className="event-sponsor-empty">
            <Star size={32} />

            <h3>No sponsors attached</h3>

            <p>
              Add an existing sponsor to this event and
              assign its sponsorship tier.
            </p>

            {canEdit && (
              <button
                className="event-primary-action"
                type="button"
                onClick={() =>
                  setIsAddModalOpen(true)
                }
              >
                <Plus size={18} />
                Add First Sponsor
              </button>
            )}
          </div>
        ) : (
          <div className="event-sponsor-list">
            {groupedSponsors.map((group) => {
              const tierClass = tierClassName(
                group.tierName,
              );

              return (
                <section
                  key={group.tierName}
                  className="event-sponsor-group"
                >
                  <div className="event-sponsor-group__tier">
                    <Star
                      size={20}
                      style={
                        group.color
                          ? {
                              color: group.color,
                            }
                          : undefined
                      }
                    />

                    <span
                      className={[
                        "event-sponsor-tier",
                        `event-sponsor-tier--${tierClass}`,
                      ].join(" ")}
                      style={
                        group.color
                          ? {
                              borderColor:
                                group.color,
                            }
                          : undefined
                      }
                    >
                      {group.tierName}
                    </span>

                    <span className="event-sponsor-group__count">
                      {group.sponsors.length}
                    </span>
                  </div>

                  <div className="event-sponsor-group__cards">
                    {group.sponsors.map(
                      (sponsor) => (
                        <SponsorCard
                          key={sponsor.sponsor_id}
                          sponsor={sponsor}
                          canEdit={canEdit}
                          onEdit={() =>
                            setEditingSponsor(
                              sponsor,
                            )
                          }
                          onRemove={() =>
                            setRemovingSponsor(
                              sponsor,
                            )
                          }
                        />
                      ),
                    )}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </section>

      {isAddModalOpen && (
        <AddSponsorModal
          eventId={eventId}
          attachedSponsors={
            sponsorsQuery.data ?? []
          }
          onClose={() =>
            setIsAddModalOpen(false)
          }
        />
      )}

      {editingSponsor && (
        <EditSponsorTierModal
          eventId={eventId}
          sponsor={editingSponsor}
          onClose={() =>
            setEditingSponsor(null)
          }
        />
      )}

      {removingSponsor && (
        <RemoveSponsorModal
          sponsor={removingSponsor}
          isRemoving={removeMutation.isPending}
          error={
            removeMutation.isError
              ? getErrorMessage(
                  removeMutation.error,
                )
              : null
          }
          onCancel={() => {
            if (!removeMutation.isPending) {
              setRemovingSponsor(null);
              removeMutation.reset();
            }
          }}
          onConfirm={() =>
            removeMutation.mutate(
              removingSponsor.sponsor_id,
            )
          }
        />
      )}
    </>
  );
}

type SponsorCardProps = {
  sponsor: EventSponsor;
  canEdit: boolean;
  onEdit: () => void;
  onRemove: () => void;
};

function SponsorCard({
  sponsor,
  canEdit,
  onEdit,
  onRemove,
}: SponsorCardProps) {
  const tierClass = tierClassName(
    sponsor.sponsor_tier_name,
  );

  return (
    <article
      className={[
        "event-sponsor-card",
        `event-sponsor-card--${tierClass}`,
      ].join(" ")}
      style={
        sponsor.sponsor_tier_color
          ? {
              borderLeftColor:
                sponsor.sponsor_tier_color,
            }
          : undefined
      }
    >
      <div className="event-sponsor-card__logo">
        {sponsor.sponsor_logo ? (
          <img
            src={sponsor.sponsor_logo}
            alt={`${sponsor.sponsor_name} logo`}
          />
        ) : (
          <ImageOff size={22} />
        )}
      </div>

      <div className="event-sponsor-card__content">
        <h3>{sponsor.sponsor_name}</h3>

        {sponsor.sponsor_description && (
          <p>{sponsor.sponsor_description}</p>
        )}

        {sponsor.sponsor_website && (
          <a
            href={sponsor.sponsor_website}
            target="_blank"
            rel="noreferrer"
          >
            <LinkIcon size={15} />
            {sponsor.sponsor_website}
          </a>
        )}
      </div>

      {canEdit && (
        <div className="event-sponsor-card__actions">
          <button
            className="event-icon-button"
            type="button"
            aria-label={`Change tier for ${sponsor.sponsor_name}`}
            title="Change sponsor tier"
            onClick={onEdit}
          >
            <Pencil size={18} />
          </button>

          <button
            className="event-icon-button event-icon-button--danger"
            type="button"
            aria-label={`Remove ${sponsor.sponsor_name}`}
            title="Remove sponsor"
            onClick={onRemove}
          >
            <Trash2 size={19} />
          </button>
        </div>
      )}
    </article>
  );
}

type AddSponsorModalProps = {
  eventId: number;
  attachedSponsors: EventSponsor[];
  onClose: () => void;
};

function AddSponsorModal({
  eventId,
  attachedSponsors,
  onClose,
}: AddSponsorModalProps) {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] =
    useState("");
  const [selectedSponsorId, setSelectedSponsorId] =
    useState<number | null>(null);
  const [selectedTierId, setSelectedTierId] =
    useState<number | null>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [search]);

  const availableSponsorsQuery = useQuery({
    queryKey: [
      "sponsors",
      "list",
      debouncedSearch,
    ],
    queryFn: () => getSponsors(debouncedSearch),
  });

  const tiersQuery = useQuery({
    queryKey: ["sponsor-tiers"],
    queryFn: getSponsorTiers,
  });

  useEffect(() => {
    if (
      selectedTierId === null &&
      tiersQuery.data?.length
    ) {
      setSelectedTierId(
        tiersQuery.data[0].sponsor_tier_id,
      );
    }
  }, [selectedTierId, tiersQuery.data]);

  const attachedSponsorIds = useMemo(
    () =>
      new Set(
        attachedSponsors.map(
          (sponsor) => sponsor.sponsor_id,
        ),
      ),
    [attachedSponsors],
  );

  const availableSponsors = useMemo(
    () =>
      (availableSponsorsQuery.data ?? []).filter(
        (sponsor) =>
          !attachedSponsorIds.has(
            sponsor.sponsor_id,
          ),
      ),
    [
      attachedSponsorIds,
      availableSponsorsQuery.data,
    ],
  );

  const attachMutation = useMutation({
    mutationFn: () => {
      if (
        selectedSponsorId === null ||
        selectedTierId === null
      ) {
        throw new Error(
          "Select both a sponsor and a tier.",
        );
      }

      return attachSponsorToEvent(eventId, {
        sponsor_id: selectedSponsorId,
        sponsor_tier_id: selectedTierId,
      });
    },

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["events", eventId, "sponsors"],
      });

      onClose();
    },
  });

  return (
    <ModalShell
      title="Add Sponsor"
      description="Attach an existing sponsor to this event."
      onClose={onClose}
      disableClose={attachMutation.isPending}
    >
      <div className="event-modal__body">
        <label
          className="event-form-field"
          htmlFor="sponsor-search"
        >
          <span>Search sponsors</span>

          <div className="event-search-control">
            <Search size={17} />

            <input
              id="sponsor-search"
              type="search"
              value={search}
              placeholder="Search by sponsor name"
              onChange={(event) => {
                setSearch(event.target.value);
                setSelectedSponsorId(null);
              }}
            />
          </div>
        </label>

        <SponsorPicker
          sponsors={availableSponsors}
          selectedSponsorId={selectedSponsorId}
          isLoading={
            availableSponsorsQuery.isPending
          }
          error={
            availableSponsorsQuery.isError
              ? getErrorMessage(
                  availableSponsorsQuery.error,
                )
              : null
          }
          onSelect={setSelectedSponsorId}
        />

        <TierSelect
          tiers={tiersQuery.data ?? []}
          selectedTierId={selectedTierId}
          isLoading={tiersQuery.isPending}
          error={
            tiersQuery.isError
              ? getErrorMessage(tiersQuery.error)
              : null
          }
          onChange={setSelectedTierId}
        />

        {attachMutation.isError && (
          <p
            className="event-form-error"
            role="alert"
          >
            {getErrorMessage(
              attachMutation.error,
            )}
          </p>
        )}
      </div>

      <div className="event-modal__footer">
        <button
          className="event-secondary-action"
          type="button"
          disabled={attachMutation.isPending}
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          className="event-primary-action"
          type="button"
          disabled={
            selectedSponsorId === null ||
            selectedTierId === null ||
            attachMutation.isPending
          }
          onClick={() => attachMutation.mutate()}
        >
          {attachMutation.isPending ? (
            <>
              <LoaderCircle
                className="event-spinner"
                size={18}
              />
              Adding...
            </>
          ) : (
            <>
              <Plus size={18} />
              Add Sponsor
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

type EditSponsorTierModalProps = {
  eventId: number;
  sponsor: EventSponsor;
  onClose: () => void;
};

function EditSponsorTierModal({
  eventId,
  sponsor,
  onClose,
}: EditSponsorTierModalProps) {
  const queryClient = useQueryClient();

  const [selectedTierId, setSelectedTierId] =
    useState(sponsor.sponsor_tier_id);

  const tiersQuery = useQuery({
    queryKey: ["sponsor-tiers"],
    queryFn: getSponsorTiers,
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateEventSponsorTier(
        eventId,
        sponsor.sponsor_id,
        selectedTierId,
      ),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["events", eventId, "sponsors"],
      });

      onClose();
    },
  });

  return (
    <ModalShell
      title="Change Sponsor Tier"
      description={`Update the tier assigned to ${sponsor.sponsor_name}.`}
      onClose={onClose}
      disableClose={updateMutation.isPending}
    >
      <div className="event-modal__body">
        <TierSelect
          tiers={tiersQuery.data ?? []}
          selectedTierId={selectedTierId}
          isLoading={tiersQuery.isPending}
          error={
            tiersQuery.isError
              ? getErrorMessage(tiersQuery.error)
              : null
          }
          onChange={setSelectedTierId}
        />

        {updateMutation.isError && (
          <p
            className="event-form-error"
            role="alert"
          >
            {getErrorMessage(
              updateMutation.error,
            )}
          </p>
        )}
      </div>

      <div className="event-modal__footer">
        <button
          className="event-secondary-action"
          type="button"
          disabled={updateMutation.isPending}
          onClick={onClose}
        >
          Cancel
        </button>

        <button
          className="event-primary-action"
          type="button"
          disabled={
            updateMutation.isPending ||
            selectedTierId ===
              sponsor.sponsor_tier_id
          }
          onClick={() => updateMutation.mutate()}
        >
          {updateMutation.isPending ? (
            <>
              <LoaderCircle
                className="event-spinner"
                size={18}
              />
              Saving...
            </>
          ) : (
            <>
              <Check size={18} />
              Save Tier
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

type SponsorPickerProps = {
  sponsors: Sponsor[];
  selectedSponsorId: number | null;
  isLoading: boolean;
  error: string | null;
  onSelect: (sponsorId: number) => void;
};

function SponsorPicker({
  sponsors,
  selectedSponsorId,
  isLoading,
  error,
  onSelect,
}: SponsorPickerProps) {
  return (
    <fieldset className="event-sponsor-picker">
      <legend>Available sponsors</legend>

      {isLoading && (
        <div
          className="event-sponsor-picker__state"
          role="status"
        >
          <LoaderCircle
            className="event-spinner"
            size={20}
          />

          Loading sponsors...
        </div>
      )}

      {error && (
        <p
          className="event-form-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {!isLoading &&
        !error &&
        sponsors.length === 0 && (
          <p className="event-sponsor-picker__state">
            No available sponsors were found.
          </p>
        )}

      {sponsors.map((sponsor) => (
        <label
          key={sponsor.sponsor_id}
          className={[
            "event-sponsor-option",
            selectedSponsorId ===
            sponsor.sponsor_id
              ? "event-sponsor-option--selected"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <input
            type="radio"
            name="event-sponsor"
            value={sponsor.sponsor_id}
            checked={
              selectedSponsorId ===
              sponsor.sponsor_id
            }
            onChange={() =>
              onSelect(sponsor.sponsor_id)
            }
          />

          <span className="event-sponsor-option__logo">
            {sponsor.sponsor_logo ? (
              <img
                src={sponsor.sponsor_logo}
                alt=""
              />
            ) : (
              <ImageOff size={18} />
            )}
          </span>

          <span className="event-sponsor-option__content">
            <strong>
              {sponsor.sponsor_name}
            </strong>

            {sponsor.sponsor_website && (
              <span>
                {sponsor.sponsor_website}
              </span>
            )}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

type TierSelectProps = {
  tiers: SponsorTier[];
  selectedTierId: number | null;
  isLoading: boolean;
  error: string | null;
  onChange: (tierId: number) => void;
};

function TierSelect({
  tiers,
  selectedTierId,
  isLoading,
  error,
  onChange,
}: TierSelectProps) {
  return (
    <label
      className="event-form-field"
      htmlFor="sponsor-tier"
    >
      <span>Sponsorship tier</span>

      {isLoading ? (
        <div
          className="event-inline-loading"
          role="status"
        >
          <LoaderCircle
            className="event-spinner"
            size={18}
          />
          Loading tiers...
        </div>
      ) : (
        <select
          id="sponsor-tier"
          value={selectedTierId ?? ""}
          disabled={tiers.length === 0}
          onChange={(event) =>
            onChange(Number(event.target.value))
          }
        >
          {tiers.length === 0 && (
            <option value="">
              No active tiers available
            </option>
          )}

          {tiers.map((tier) => (
            <option
              key={tier.sponsor_tier_id}
              value={tier.sponsor_tier_id}
            >
              {tier.sponsor_tier_name}
            </option>
          ))}
        </select>
      )}

      {error && (
        <span className="event-form-error">
          {error}
        </span>
      )}
    </label>
  );
}

type RemoveSponsorModalProps = {
  sponsor: EventSponsor;
  isRemoving: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

function RemoveSponsorModal({
  sponsor,
  isRemoving,
  error,
  onCancel,
  onConfirm,
}: RemoveSponsorModalProps) {
  return (
    <ModalShell
      title="Remove Sponsor"
      description={`Remove ${sponsor.sponsor_name} from this event? The sponsor itself will not be deleted.`}
      onClose={onCancel}
      disableClose={isRemoving}
    >
      {error && (
        <div className="event-modal__body">
          <p
            className="event-form-error"
            role="alert"
          >
            {error}
          </p>
        </div>
      )}

      <div className="event-modal__footer">
        <button
          className="event-secondary-action"
          type="button"
          disabled={isRemoving}
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          className="event-danger-action"
          type="button"
          disabled={isRemoving}
          onClick={onConfirm}
        >
          {isRemoving ? (
            <>
              <LoaderCircle
                className="event-spinner"
                size={18}
              />
              Removing...
            </>
          ) : (
            <>
              <Trash2 size={18} />
              Remove Sponsor
            </>
          )}
        </button>
      </div>
    </ModalShell>
  );
}

type ModalShellProps = {
  title: string;
  description: string;
  disableClose?: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

function ModalShell({
  title,
  description,
  disableClose = false,
  onClose,
  children,
}: ModalShellProps) {
  return (
    <div
      className="event-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !disableClose
        ) {
          onClose();
        }
      }}
    >
      <div
        className="event-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-modal-title"
        aria-describedby="event-modal-description"
      >
        <div className="event-modal__header">
          <div>
            <h2 id="event-modal-title">
              {title}
            </h2>

            <p id="event-modal-description">
              {description}
            </p>
          </div>

          <button
            className="event-icon-button"
            type="button"
            aria-label="Close dialog"
            disabled={disableClose}
            onClick={onClose}
          >
            <X size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}