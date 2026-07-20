import { useMemo, useState } from "react";
import {
  Download,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  CategoriesApiError,
  createCategory,
  deactivateCategory,
  getCategories,
  updateCategory,
} from "../api/categoriesApi";

import type {
  CategoryRecord,
  CategoryType,
  SaveCategoryInput,
} from "../types/categoryTypes";

type CategoryListSectionProps = {
  type: CategoryType;
  title: string;
  description: string;
  assignedLabel: string;
};

type CategoryFormState = {
  name: string;
  color: string;
  icon: string;
  active: boolean;
};

const emptyForm: CategoryFormState = {
  name: "",
  color: "#2563eb",
  icon: "tag",
  active: true,
};

export function CategoryListSection({
  type,
  title,
  description,
  assignedLabel,
}: CategoryListSectionProps) {
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [editingCategory, setEditingCategory] =
    useState<CategoryRecord | null>(null);
  const [categoryToDelete, setCategoryToDelete] =
    useState<CategoryRecord | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] =
    useState<CategoryFormState>(emptyForm);
  const [formError, setFormError] =
    useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: [
      "settings",
      "categories",
      type,
      {
        active: !showInactive,
        q: searchTerm,
      },
    ],
    queryFn: () =>
      getCategories(type, {
        active: !showInactive,
        limit: 25,
        offset: 0,
        q: searchTerm,
      }),
  });

  const categories = categoriesQuery.data?.data ?? [];

  const filteredCategories = useMemo(() => {
    const normalizedSearch = searchTerm
      .trim()
      .toLowerCase();

    if (!normalizedSearch) {
      return categories;
    }

    return categories.filter((category) =>
      category.name
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [categories, searchTerm]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input: SaveCategoryInput = {
        name: form.name.trim(),
        color: form.color,
        icon: form.icon.trim() || null,
        active: form.active,
      };

      if (editingCategory) {
        return updateCategory(
          type,
          editingCategory.id,
          input,
        );
      }

      return createCategory(type, input);
    },

    onSuccess: async () => {
      closeEditor();

      await queryClient.invalidateQueries({
        queryKey: [
          "settings",
          "categories",
          type,
        ],
      });
    },

    onError: (error) => {
      if (error instanceof CategoriesApiError) {
        setFormError(error.message);
        return;
      }

      setFormError(
        "The category could not be saved.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: number) =>
      deactivateCategory(type, categoryId),

    onSuccess: async () => {
      setCategoryToDelete(null);

      await queryClient.invalidateQueries({
        queryKey: [
          "settings",
          "categories",
          type,
        ],
      });
    },

    onError: (error) => {
      if (error instanceof CategoriesApiError) {
        setFormError(error.message);
        setCategoryToDelete(null);
        return;
      }

      setFormError(
        "The category could not be deactivated.",
      );
      setCategoryToDelete(null);
    },
  });

  function openCreateEditor() {
    setEditingCategory(null);
    setIsCreating(true);
    setForm(emptyForm);
    setFormError(null);
  }

  function openEditEditor(
    category: CategoryRecord,
  ) {
    setEditingCategory(category);
    setIsCreating(false);
    setForm({
      name: category.name,
      color: category.color,
      icon: category.icon ?? "",
      active: category.active,
    });
    setFormError(null);
  }

  function closeEditor() {
    setEditingCategory(null);
    setIsCreating(false);
    setForm(emptyForm);
    setFormError(null);
  }

  function handleSave() {
    setFormError(null);

    if (!form.name.trim()) {
      setFormError("Enter a category name.");
      return;
    }

    if (!/^#[0-9a-fA-F]{6}$/.test(form.color)) {
      setFormError(
        "Enter a valid six-digit hexadecimal color.",
      );
      return;
    }

    saveMutation.mutate();
  }

  const editorOpen =
    isCreating || editingCategory !== null;

  return (
    <section className="category-section">
      <div className="category-section__header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>

        <label className="category-inactive-toggle">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(event) =>
              setShowInactive(event.target.checked)
            }
          />

          <span>Show inactive</span>
        </label>
      </div>

      <div className="category-toolbar">
        <div className="category-search">
          <Search size={18} />

          <input
            type="search"
            value={searchTerm}
            placeholder={`Search ${title.toLowerCase()}...`}
            aria-label={`Search ${title.toLowerCase()}`}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
          />
        </div>

        <div className="category-toolbar__actions">
          <button
            type="button"
            className="secondary-button"
          >
            <Upload size={17} />
            Import
          </button>

          <button
            type="button"
            className="secondary-button"
          >
            <Download size={17} />
            Export
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={openCreateEditor}
          >
            <Plus size={18} />
            Add Category
          </button>
        </div>
      </div>

      {categoriesQuery.isPending && (
        <div className="category-state">
          <LoaderCircle
            className="spin"
            size={20}
          />
          <span>Loading categories...</span>
        </div>
      )}

      {categoriesQuery.isError && (
        <div className="category-state category-state--error">
          <span>
            Categories could not be loaded.
          </span>

          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              void categoriesQuery.refetch();
            }}
          >
            Try again
          </button>
        </div>
      )}

      {!categoriesQuery.isPending &&
        !categoriesQuery.isError && (
          <div className="category-table-wrapper">
            <table className="category-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Icon</th>
                  <th>{assignedLabel}</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredCategories.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="category-table__empty"
                    >
                      No categories were found.
                    </td>
                  </tr>
                ) : (
                  filteredCategories.map(
                    (category) => (
                      <tr key={category.id}>
                        <td>
                          <div className="category-name">
                            <span
                              className="category-color-dot"
                              style={{
                                backgroundColor:
                                  category.color,
                              }}
                              aria-hidden="true"
                            />

                            <strong>
                              {category.name}
                            </strong>
                          </div>
                        </td>

                        <td>
                          <span className="category-icon-name">
                            {category.icon ?? "—"}
                          </span>
                        </td>

                        <td>
                          <span className="category-assigned-count">
                            {category.assignedCount}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`category-status ${
                              category.active
                                ? "published"
                                : "inactive"
                            }`}
                          >
                            {category.active
                              ? "Published"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <div className="category-row-actions">
                            <button
                              type="button"
                              className="icon-button"
                              aria-label={`Edit ${category.name}`}
                              title="Edit category"
                              onClick={() =>
                                openEditEditor(
                                  category,
                                )
                              }
                            >
                              <Pencil size={16} />
                            </button>

                            {category.active && (
                              <button
                                type="button"
                                className="icon-button category-delete-button"
                                aria-label={`Deactivate ${category.name}`}
                                title="Deactivate category"
                                onClick={() =>
                                  setCategoryToDelete(
                                    category,
                                  )
                                }
                              >
                                <Trash2
                                  size={16}
                                />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ),
                  )
                )}
              </tbody>
            </table>
          </div>
        )}

      {categoriesQuery.data && (
        <div className="category-pagination-summary">
          Showing{" "}
          {categoriesQuery.data.pagination.returned}{" "}
          of {categoriesQuery.data.pagination.total}
        </div>
      )}

      {editorOpen && (
        <div
          className="settings-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              closeEditor();
            }
          }}
        >
          <div
            className="settings-modal category-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${type}-category-editor-title`}
          >
            <div className="settings-modal__header">
              <div>
                <h3
                  id={`${type}-category-editor-title`}
                >
                  {editingCategory
                    ? "Edit Category"
                    : "Add Category"}
                </h3>

                <p>
                  Configure the category name,
                  color, icon, and visibility.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={closeEditor}
              >
                <X size={19} />
              </button>
            </div>

            <div className="category-form">
              <label className="category-form__field">
                <span>Name</span>

                <input
                  type="text"
                  value={form.name}
                  autoFocus
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="category-form__field">
                <span>Color</span>

                <div className="category-color-field">
                  <input
                    type="color"
                    value={form.color}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        color: event.target.value,
                      }))
                    }
                  />

                  <input
                    type="text"
                    value={form.color}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        color: event.target.value,
                      }))
                    }
                  />
                </div>
              </label>

              <label className="category-form__field">
                <span>Icon</span>

                <input
                  type="text"
                  value={form.icon}
                  placeholder="calendar"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      icon: event.target.value,
                    }))
                  }
                />
              </label>

              <label className="category-active-control">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      active: event.target.checked,
                    }))
                  }
                />

                <span>Category is active</span>
              </label>

              {formError && (
                <div className="role-form-error">
                  {formError}
                </div>
              )}
            </div>

            <div className="settings-modal__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeEditor}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                disabled={saveMutation.isPending}
                onClick={handleSave}
              >
                {saveMutation.isPending && (
                  <LoaderCircle
                    className="spin"
                    size={17}
                  />
                )}

                {editingCategory
                  ? "Save Changes"
                  : "Create Category"}
              </button>
            </div>
          </div>
        </div>
      )}

      {categoryToDelete && (
        <div
          className="settings-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target === event.currentTarget
            ) {
              setCategoryToDelete(null);
            }
          }}
        >
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${type}-deactivate-category-title`}
          >
            <div className="settings-modal__header">
              <div>
                <h3
                  id={`${type}-deactivate-category-title`}
                >
                  Deactivate{" "}
                  {categoryToDelete.name}?
                </h3>

                <p>
                  Existing assignments will remain,
                  but the category will no longer be
                  available for new assignments.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() =>
                  setCategoryToDelete(null)
                }
              >
                <X size={19} />
              </button>
            </div>

            <div className="settings-modal__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  setCategoryToDelete(null)
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="danger-button"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  deleteMutation.mutate(
                    categoryToDelete.id,
                  )
                }
              >
                {deleteMutation.isPending ? (
                  <LoaderCircle
                    className="spin"
                    size={17}
                  />
                ) : (
                  <Trash2 size={17} />
                )}

                Deactivate Category
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}