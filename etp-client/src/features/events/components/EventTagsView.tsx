import {
  Check,
  Edit3,
  LoaderCircle,
  Plus,
  RotateCcw,
  Search,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  useMemo,
  useState,
} from "react";

import {
  createTag,
  deleteTag,
  updateTag,
  type TagLookupItem,
} from "../api/tagsApi";
import { useTagLookup } from "../hooks/useTagLookup";

type EventTagsViewProps = {
  selectedIds: number[];
  disabled: boolean;
  onToggle: (tagId: number) => void;
};

function normalizeTagName(value: string) {
  return value.trim().replace(/^#+/, "").trim();
}

export function EventTagsView({
  selectedIds,
  disabled,
  onToggle,
}: EventTagsViewProps) {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [includeInactive, setIncludeInactive] =
    useState(false);

  const [editingTagId, setEditingTagId] =
    useState<number | null>(null);

  const [editingName, setEditingName] = useState("");

  const tagsQuery = useTagLookup(
    searchTerm,
    includeInactive,
  );

  const tags = tagsQuery.data?.data ?? [];

  const normalizedSearch =
    normalizeTagName(searchTerm).toLowerCase();

  const exactMatch = useMemo(() => {
    if (!normalizedSearch) {
      return undefined;
    }

    return tags.find(
      (tag) =>
        tag.tag_name.trim().toLowerCase() ===
        normalizedSearch,
    );
  }, [normalizedSearch, tags]);

  const invalidateTagQueries = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["lookups", "tags"],
    });
  };

  const createMutation = useMutation({
    mutationFn: createTag,

    onSuccess: async (response) => {
      await invalidateTagQueries();

      if (!selectedIds.includes(response.tag.tag_id)) {
        onToggle(response.tag.tag_id);
      }

      setSearchTerm("");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      tagId,
      updates,
    }: {
      tagId: number;
      updates: {
        tag_name?: string;
        active?: boolean;
      };
    }) => updateTag(tagId, updates),

    onSuccess: async () => {
      await invalidateTagQueries();
      setEditingTagId(null);
      setEditingName("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,

    onSuccess: async (_, deletedTagId) => {
      await invalidateTagQueries();

      if (selectedIds.includes(deletedTagId)) {
        onToggle(deletedTagId);
      }
    },
  });

  const handleCreateTag = () => {
    const tagName = normalizeTagName(searchTerm);

    if (!tagName || exactMatch) {
      return;
    }

    createMutation.mutate(tagName);
  };

  const handleStartEditing = (tag: TagLookupItem) => {
    setEditingTagId(tag.tag_id);
    setEditingName(tag.tag_name);
  };

  const handleSaveEdit = (tagId: number) => {
    const tagName = normalizeTagName(editingName);

    if (!tagName) {
      return;
    }

    updateMutation.mutate({
      tagId,
      updates: {
        tag_name: tagName,
      },
    });
  };

  const handleDeleteTag = (tag: TagLookupItem) => {
    const confirmed = window.confirm(
      `Delete the global tag "#${tag.tag_name}"?`,
    );

    if (!confirmed) {
      return;
    }

    deleteMutation.mutate(tag.tag_id);
  };

  const handleRestoreTag = (tag: TagLookupItem) => {
    updateMutation.mutate({
      tagId: tag.tag_id,
      updates: {
        active: true,
      },
    });
  };

  const mutationError =
    createMutation.error ??
    updateMutation.error ??
    deleteMutation.error;

  return (
    <section className="event-subview">
      <div className="event-subview__header">
        <div>
          <h2>Tags</h2>

          <p>
            Search existing tags, create new tags, and choose
            which tags are assigned to this event.
          </p>
        </div>
      </div>

      <div className="event-tags-toolbar">
        <label className="event-tags-search">
          <Search size={20} aria-hidden="true" />

          <span className="sr-only">
            Search or create tags
          </span>

          <input
            type="search"
            value={searchTerm}
            disabled={disabled}
            placeholder="Search tags or enter a new tag..."
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleCreateTag();
              }
            }}
          />
        </label>

        <button
          className="event-primary-action"
          type="button"
          disabled={
            disabled ||
            createMutation.isPending ||
            !normalizedSearch ||
            Boolean(exactMatch)
          }
          onClick={handleCreateTag}
        >
          {createMutation.isPending ? (
            <LoaderCircle
              className="event-tags-spinner"
              size={18}
            />
          ) : (
            <Plus size={18} />
          )}

          Create Tag
        </button>
      </div>

      <label className="event-tags-inactive-toggle">
        <input
          type="checkbox"
          checked={includeInactive}
          onChange={(event) =>
            setIncludeInactive(event.target.checked)
          }
        />

        <span>Show inactive tags</span>
      </label>

      {mutationError && (
        <div
          className="event-detail-alert event-detail-alert--error"
          role="alert"
        >
          {mutationError instanceof Error
            ? mutationError.message
            : "The tag operation failed."}
        </div>
      )}

      {tagsQuery.isPending ? (
        <div className="event-tags-loading">
          <LoaderCircle
            className="event-tags-spinner"
            size={24}
          />

          Loading tags...
        </div>
      ) : tagsQuery.isError ? (
        <div className="event-empty-card">
          <Tag size={32} />

          <h3>Unable to load tags</h3>

          <p>
            {tagsQuery.error instanceof Error
              ? tagsQuery.error.message
              : "The tag list could not be loaded."}
          </p>

          <button
            className="event-secondary-action"
            type="button"
            onClick={() => {
              void tagsQuery.refetch();
            }}
          >
            Try Again
          </button>
        </div>
      ) : tags.length === 0 ? (
        <div className="event-empty-card">
          <Tag size={32} />

          <h3>No matching tags</h3>

          <p>
            Create a new tag using the search field above.
          </p>
        </div>
      ) : (
        <div className="event-tags-list">
          {tags.map((tag) => {
            const selected = selectedIds.includes(
              tag.tag_id,
            );

            const editing = editingTagId === tag.tag_id;

            return (
              <article
                key={tag.tag_id}
                className={[
                  "event-tag-row",
                  selected
                    ? "event-tag-row--selected"
                    : "",
                  !tag.active
                    ? "event-tag-row--inactive"
                    : "",
                ].join(" ")}
              >
                <button
                  className="event-tag-row__select"
                  type="button"
                  disabled={disabled || !tag.active}
                  aria-pressed={selected}
                  onClick={() => onToggle(tag.tag_id)}
                >
                  <span className="event-tag-row__checkbox">
                    {selected && <Check size={14} />}
                  </span>

                  {editing ? (
                    <input
                      type="text"
                      value={editingName}
                      autoFocus
                      disabled={updateMutation.isPending}
                      onClick={(event) =>
                        event.stopPropagation()
                      }
                      onChange={(event) =>
                        setEditingName(event.target.value)
                      }
                      onKeyDown={(event) => {
                        event.stopPropagation();

                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleSaveEdit(tag.tag_id);
                        }

                        if (event.key === "Escape") {
                          setEditingTagId(null);
                          setEditingName("");
                        }
                      }}
                    />
                  ) : (
                    <span>#{tag.tag_name}</span>
                  )}

                  {!tag.active && (
                    <span className="event-tag-row__inactive-badge">
                      Inactive
                    </span>
                  )}
                </button>

                <div className="event-tag-row__actions">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        title="Save tag name"
                        aria-label="Save tag name"
                        disabled={
                          updateMutation.isPending ||
                          !normalizeTagName(editingName)
                        }
                        onClick={() =>
                          handleSaveEdit(tag.tag_id)
                        }
                      >
                        <Check size={18} />
                      </button>

                      <button
                        type="button"
                        title="Cancel editing"
                        aria-label="Cancel editing"
                        onClick={() => {
                          setEditingTagId(null);
                          setEditingName("");
                        }}
                      >
                        <X size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      {tag.active ? (
                        <>
                          <button
                            type="button"
                            title={`Edit #${tag.tag_name}`}
                            aria-label={`Edit #${tag.tag_name}`}
                            disabled={disabled}
                            onClick={() =>
                              handleStartEditing(tag)
                            }
                          >
                            <Edit3 size={18} />
                          </button>

                          <button
                            className="event-tag-row__delete"
                            type="button"
                            title={`Delete #${tag.tag_name}`}
                            aria-label={`Delete #${tag.tag_name}`}
                            disabled={
                              disabled ||
                              deleteMutation.isPending
                            }
                            onClick={() =>
                              handleDeleteTag(tag)
                            }
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          title={`Restore #${tag.tag_name}`}
                          aria-label={`Restore #${tag.tag_name}`}
                          disabled={
                            disabled ||
                            updateMutation.isPending
                          }
                          onClick={() =>
                            handleRestoreTag(tag)
                          }
                        >
                          <RotateCcw size={18} />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}