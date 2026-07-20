import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  createRole,
  deactivateRole,
  getRoles,
  RolesApiError,
  updateRole,
} from "../api/rolesApi";

import { getPermissions } from "../api/permissionsApi";

import type {
  Permission,
} from "../types/permissionTypes";

import type {
  AssignedRoleUser,
  Role,
  RoleAssignedUsersError,
  SaveRoleInput,
} from "../types/roles";

type RoleFormState = {
  roleName: string;
  active: boolean;
  permissionIds: number[];
};

const emptyForm: RoleFormState = {
  roleName: "",
  active: true,
  permissionIds: [],
};

function isBuiltInRole(role: Role): boolean {
  /*
   * Prefer role.built_in once the API provides it.
   * The Admin name check is only a temporary fallback.
   */
  return role.built_in === true || role.role_name === "Admin";
}

export function RolesPermissionsPanel() {
  const queryClient = useQueryClient();

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(
    null,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const [form, setForm] = useState<RoleFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [assignedUsers, setAssignedUsers] = useState<
    AssignedRoleUser[]
  >([]);

  const rolesQuery = useQuery({
    queryKey: [
      "settings",
      "roles",
      {
        active: !showInactive,
        q: searchTerm,
      },
    ],
    queryFn: () =>
      getRoles({
        active: !showInactive,
        limit: 100,
        offset: 0,
        q: searchTerm,
      }),
  });

  const permissionsQuery = useQuery({
    queryKey: [
      "settings",
      "permissions",
      {
        active: true,
      },
    ],
    queryFn: () =>
      getPermissions({
        active: true,
        limit: 100,
        offset: 0,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const roles = rolesQuery.data?.roles ?? [];
  const permissions = permissionsQuery.data?.permissions ?? [];

  const groupedPermissions = useMemo(() => {
    const groups = permissions.reduce<Record<string, Permission[]>>(
      (result, permission) => {
        const groupName = permission.permission_group || "Other";

        if (!result[groupName]) {
          result[groupName] = [];
        }

        result[groupName].push(permission);

        return result;
      },
      {},
    );

    return Object.fromEntries(
      Object.entries(groups)
        .sort(([groupA], [groupB]) => groupA.localeCompare(groupB))
        .map(([groupName, groupPermissions]) => [
          groupName,
          [...groupPermissions].sort((a, b) =>
            a.permission_label.localeCompare(b.permission_label),
          ),
        ]),
    );
  }, [permissions]);

  const selectedAvailablePermissionCount = useMemo(() => {
    const availablePermissionIds = new Set(
      permissions.map((permission) => permission.permission_id),
    );

    return form.permissionIds.filter((permissionId) =>
      availablePermissionIds.has(permissionId),
    ).length;
  }, [form.permissionIds, permissions]);

  const selectedRole = useMemo(
    () =>
      roles.find((role) => role.role_id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const selectedRoleIsBuiltIn = selectedRole
    ? isBuiltInRole(selectedRole)
    : false;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const input: SaveRoleInput = {
        role_name: form.roleName.trim(),
        active: form.active,
        permission_ids: form.permissionIds,
      };

      if (isCreating) {
        return createRole(input);
      }

      if (!selectedRole) {
        throw new Error("No role is selected.");
      }

      return updateRole(selectedRole.role_id, input);
    },

    onSuccess: async (response) => {
      setIsCreating(false);
      setSelectedRoleId(response.role.role_id);
      setForm({
        roleName: response.role.role_name,
        active: response.role.active,
        permissionIds: response.role.permissions.map(
          (permission) => permission.permission_id,
        ),
      });
      setFormError(null);

      await queryClient.invalidateQueries({
        queryKey: ["settings", "roles"],
      });
    },

    onError: (error) => {
      if (error instanceof RolesApiError) {
        setFormError(error.message);
        return;
      }

      setFormError("The role could not be saved.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (roleId: number) => deactivateRole(roleId),

    onSuccess: async () => {
      setRoleToDelete(null);
      setAssignedUsers([]);
      setSelectedRoleId(null);

      await queryClient.invalidateQueries({
        queryKey: ["settings", "roles"],
      });
    },

    onError: (error) => {
      if (!(error instanceof RolesApiError)) {
        setFormError("The role could not be deactivated.");
        return;
      }

      const data = error.data as Partial<RoleAssignedUsersError>;

      if (
        Array.isArray(data.assigned_users) &&
        data.assigned_users.length > 0
      ) {
        setAssignedUsers(data.assigned_users);
        return;
      }

      setFormError(error.message);
      setRoleToDelete(null);
    },
  });

  function handleSelectRole(role: Role) {
    setIsCreating(false);
    setSelectedRoleId(role.role_id);
    setForm({
      roleName: role.role_name,
      active: role.active,
      permissionIds: role.permissions.map(
        (permission) => permission.permission_id,
      ),
    });
    setFormError(null);
    setAssignedUsers([]);
  }

  function handleCreateRole() {
    setSelectedRoleId(null);
    setIsCreating(true);
    setForm(emptyForm);
    setFormError(null);
    setAssignedUsers([]);
  }

  function handleCancelCreate() {
    setIsCreating(false);

    const firstRole = roles[0];

    if (!firstRole) {
      setSelectedRoleId(null);
      setForm(emptyForm);
      return;
    }

    setSelectedRoleId(firstRole.role_id);
    setForm({
      roleName: firstRole.role_name,
      active: firstRole.active,
      permissionIds: firstRole.permissions.map(
        (permission) => permission.permission_id,
      ),
    });
  }

  function handlePermissionChange(
    permissionId: number,
    checked: boolean,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      permissionIds: checked
        ? [...currentForm.permissionIds, permissionId]
        : currentForm.permissionIds.filter(
            (id) => id !== permissionId,
          ),
    }));
  }

  function handleGroupChange(
    permissionIds: number[],
    checked: boolean,
  ) {
    setForm((currentForm) => {
      const existingIds = new Set(currentForm.permissionIds);

      if (checked) {
        permissionIds.forEach((id) => existingIds.add(id));
      } else {
        permissionIds.forEach((id) => existingIds.delete(id));
      }

      return {
        ...currentForm,
        permissionIds: Array.from(existingIds),
      };
    });
  }

  function handleSave() {
    setFormError(null);

    if (!form.roleName.trim()) {
      setFormError("Enter a role name.");
      return;
    }

    if (permissionsQuery.isPending) {
      setFormError(
        "Wait for the permission catalog to finish loading.",
      );
      return;
    }

    if (permissionsQuery.isError) {
      setFormError(
        "The role cannot be saved because permissions could not be loaded.",
      );
      return;
    }

    const validPermissionIds = new Set(
      permissions.map((permission) => permission.permission_id),
    );

    const invalidSelectedIds = form.permissionIds.filter(
      (permissionId) => !validPermissionIds.has(permissionId),
    );

    if (invalidSelectedIds.length > 0) {
      setFormError(
        "The role contains permissions that are no longer active. Reselect its permissions before saving.",
      );
      return;
    }

    saveMutation.mutate();
  }

  function openDeleteDialog(role: Role) {
    setAssignedUsers([]);
    setRoleToDelete(role);
  }

  const editorVisible = isCreating || selectedRole !== null;
  const editorIsReadOnly =
    !isCreating && selectedRoleIsBuiltIn;

  return (
    <div className="roles-panel">
      <header className="settings-panel__header">
        <h2>Roles &amp; Permissions</h2>

        <p>
          Define roles and control which features each role can access.
        </p>
      </header>

      <div className="roles-editor">
        <aside className="roles-list-panel">
          <div className="roles-list-heading">
            <span>Roles</span>

            <button
              type="button"
              className="icon-button icon-button--primary"
              aria-label="Create role"
              title="Create role"
              onClick={handleCreateRole}
            >
              <Plus size={19} />
            </button>
          </div>

          <div className="roles-search">
            <Search size={16} />

            <input
              type="search"
              value={searchTerm}
              placeholder="Search roles"
              aria-label="Search roles"
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <label className="roles-inactive-toggle">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(event) =>
                setShowInactive(event.target.checked)
              }
            />

            <span>Show inactive roles</span>
          </label>

          {rolesQuery.isLoading && (
            <div className="roles-state">
              <LoaderCircle className="spin" size={20} />
              <span>Loading roles...</span>
            </div>
          )}

          {rolesQuery.isError && (
            <div className="roles-state roles-state--error">
              Roles could not be loaded.
            </div>
          )}

          {!rolesQuery.isLoading && roles.length === 0 && (
            <div className="roles-empty">
              No matching roles were found.
            </div>
          )}

          <div className="roles-list">
            {roles.map((role) => {
              const isSelected =
                !isCreating && role.role_id === selectedRoleId;

              return (
                <button
                  key={role.role_id}
                  type="button"
                  className={`role-list-item ${
                    isSelected ? "active" : ""
                  }`}
                  onClick={() => handleSelectRole(role)}
                >
                  <span
                    className={`role-status-dot ${
                      role.active ? "" : "inactive"
                    }`}
                    aria-hidden="true"
                  />

                  <span className="role-list-item__name">
                    {role.role_name}
                  </span>

                  <span className="role-list-item__count">
                    {role.user_count}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="role-detail-panel">
          {!editorVisible && (
            <div className="role-detail-empty">
              Select a role or create a new one.
            </div>
          )}

          {editorVisible && (
            <>
              <div className="role-detail-header">
                <div className="role-detail-title">
                  {isCreating ? (
                    <input
                      className="role-name-input"
                      value={form.roleName}
                      placeholder="New role name"
                      autoFocus
                      onChange={(event) =>
                        setForm((currentForm) => ({
                          ...currentForm,
                          roleName: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <h3>{selectedRole?.role_name}</h3>
                  )}

                  <span className="permission-count-badge">
                    {selectedAvailablePermissionCount}/{permissions.length} permissions
                  </span>

                  {selectedRoleIsBuiltIn && (
                    <span className="built-in-badge">Built-in</span>
                  )}

                  {!isCreating && selectedRole && (
                    <span
                      className={`role-active-badge ${
                        selectedRole.active ? "" : "inactive"
                      }`}
                    >
                      {selectedRole.active ? "Active" : "Inactive"}
                    </span>
                  )}
                </div>

                {!selectedRoleIsBuiltIn && !isCreating && selectedRole && (
                  <div className="role-detail-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        const input = document.querySelector<HTMLInputElement>(
                          ".role-edit-name-input",
                        );

                        input?.focus();
                      }}
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      className="danger-button"
                      onClick={() => openDeleteDialog(selectedRole)}
                    >
                      <Trash2 size={16} />
                      Deactivate
                    </button>
                  </div>
                )}
              </div>

              {selectedRoleIsBuiltIn && (
                <div className="built-in-notice">
                  Built-in roles cannot be modified. Create a new role
                  to define custom permissions.
                </div>
              )}

              {!isCreating && !selectedRoleIsBuiltIn && (
                <div className="role-name-field">
                  <label htmlFor="role-name">Role name</label>

                  <input
                    id="role-name"
                    className="role-edit-name-input"
                    value={form.roleName}
                    disabled={editorIsReadOnly}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        roleName: event.target.value,
                      }))
                    }
                  />
                </div>
              )}

              {!selectedRoleIsBuiltIn && (
                <label className="role-active-control">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(event) =>
                      setForm((currentForm) => ({
                        ...currentForm,
                        active: event.target.checked,
                      }))
                    }
                  />

                  <span>Role is active</span>
                </label>
              )}

              <div className="permissions-list">
                {permissionsQuery.isPending && (
                  <div className="permissions-state">
                    <LoaderCircle className="spin" size={20} />
                    <span>Loading permissions...</span>
                  </div>
                )}

                {permissionsQuery.isError && (
                  <div className="permissions-state permissions-state--error">
                    <AlertTriangle size={18} />

                    <div>
                      <strong>Permissions could not be loaded.</strong>
                      <span>
                        Refresh the page or try loading the catalog again.
                      </span>
                    </div>

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => {
                        void permissionsQuery.refetch();
                      }}
                    >
                      Try again
                    </button>
                  </div>
                )}

                {permissionsQuery.isSuccess &&
                  permissions.length === 0 && (
                    <div className="permissions-state">
                      No active permissions are available.
                    </div>
                  )}

                {permissionsQuery.isSuccess &&
                  Object.entries(groupedPermissions).map(
                    ([groupName, groupPermissions]) => {
                      const groupIds = groupPermissions.map(
                        (permission) => permission.permission_id,
                      );

                      const selectedCount = groupIds.filter((id) =>
                        form.permissionIds.includes(id),
                      ).length;

                      const allSelected =
                        groupIds.length > 0 &&
                        selectedCount === groupIds.length;

                      const someSelected =
                        selectedCount > 0 && !allSelected;

                      return (
                        <section
                          key={groupName}
                          className="permission-group"
                        >
                          <label className="permission-group__heading">
                            <input
                              type="checkbox"
                              checked={allSelected}
                              disabled={
                                editorIsReadOnly ||
                                saveMutation.isPending
                              }
                              ref={(element) => {
                                if (element) {
                                  element.indeterminate = someSelected;
                                }
                              }}
                              onChange={(event) =>
                                handleGroupChange(
                                  groupIds,
                                  event.target.checked,
                                )
                              }
                            />

                            <span>{groupName}</span>
                          </label>

                          <div className="permission-options">
                            {groupPermissions.map((permission) => {
                              const permissionId =
                                permission.permission_id;

                              return (
                                <label
                                  key={permissionId}
                                  className="permission-option"
                                  title={
                                    permission.description ??
                                    permission.permission_name
                                  }
                                >
                                  <input
                                    type="checkbox"
                                    checked={form.permissionIds.includes(
                                      permissionId,
                                    )}
                                    disabled={
                                      editorIsReadOnly ||
                                      saveMutation.isPending
                                    }
                                    onChange={(event) =>
                                      handlePermissionChange(
                                        permissionId,
                                        event.target.checked,
                                      )
                                    }
                                  />

                                  <span>
                                    {permission.permission_label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </section>
                      );
                    },
                  )}
              </div>

              {formError && (
                <div className="role-form-error">
                  <AlertTriangle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              {!editorIsReadOnly && (
                <div className="role-form-actions">
                  {isCreating && (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={handleCancelCreate}
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  )}

                  <button
                    type="button"
                    className="primary-button"
                    disabled={
                      saveMutation.isPending ||
                      permissionsQuery.isPending ||
                      permissionsQuery.isError
                    }
                    onClick={handleSave}
                  >
                    {saveMutation.isPending ? (
                      <LoaderCircle className="spin" size={17} />
                    ) : (
                      <Check size={17} />
                    )}

                    {isCreating ? "Create role" : "Save changes"}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {roleToDelete && (
        <div
          className="settings-modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setRoleToDelete(null);
              setAssignedUsers([]);
            }
          }}
        >
          <div
            className="settings-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-role-title"
          >
            <div className="settings-modal__header">
              <div>
                <h3 id="deactivate-role-title">
                  Deactivate {roleToDelete.role_name}?
                </h3>

                <p>
                  The role will no longer be available for assignment.
                </p>
              </div>

              <button
                type="button"
                className="icon-button"
                aria-label="Close"
                onClick={() => {
                  setRoleToDelete(null);
                  setAssignedUsers([]);
                }}
              >
                <X size={19} />
              </button>
            </div>

            {assignedUsers.length > 0 && (
              <div className="assigned-users-warning">
                <div className="assigned-users-warning__title">
                  <AlertTriangle size={18} />

                  <span>
                    This role cannot be deactivated because it has{" "}
                    {assignedUsers.length} assigned{" "}
                    {assignedUsers.length === 1 ? "user" : "users"}.
                  </span>
                </div>

                <div className="assigned-users-list">
                  {assignedUsers.map((user) => (
                    <div
                      key={user.user_id}
                      className="assigned-user"
                    >
                      <Users size={17} />

                      <div>
                        <strong>
                          {user.fname} {user.lname}
                        </strong>

                        <span>
                          {user.username} · {user.email}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="settings-modal__actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setRoleToDelete(null);
                  setAssignedUsers([]);
                }}
              >
                Cancel
              </button>

              {assignedUsers.length === 0 && (
                <button
                  type="button"
                  className="danger-button"
                  disabled={deleteMutation.isPending}
                  onClick={() =>
                    deleteMutation.mutate(roleToDelete.role_id)
                  }
                >
                  {deleteMutation.isPending ? (
                    <LoaderCircle className="spin" size={17} />
                  ) : (
                    <Trash2 size={17} />
                  )}

                  Deactivate role
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}