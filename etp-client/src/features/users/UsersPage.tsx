import { useEffect, useMemo, useState } from "react";
import { Download, Plus, Search, Upload } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

import "./Users.css";

import { Card } from "@/components/ui/Card";
import { usersApi } from "./api/usersApi";
import { BulkActions } from "./components/BulkActions";
import { CreateUserModal } from "./components/CreateUserModal";
import {
  UserFilters,
  type UserFilterValue,
} from "./components/UserFilters";
import { UsersTable } from "./components/UsersTable";
import type {
  BulkRoleMode,
  CreateUserInput,
  UserListItem,
  UserRole,
  UserStatus,
} from "./types";

const emptyFilters: UserFilterValue = {
  roleId: "",
  statusId: "",
  joinedStart: "",
  joinedEnd: "",
};

export function UsersPage() {
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState(emptyFilters);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [createOpen, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mutating, setMutating] = useState(false);
  const [error, setError] = useState("");

  const query = useMemo(
    () => ({
      q: debouncedSearch || undefined,
      role_ids: filters.roleId || undefined,
      status_ids: filters.statusId || undefined,
      date_joined_start: filters.joinedStart || undefined,
      date_joined_end: filters.joinedEnd || undefined,
      limit: 100,
      offset: 0,
      sort: "created_at" as const,
      order: "desc" as const,
    }),
    [debouncedSearch, filters],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    void Promise.all([usersApi.roles(), usersApi.statuses()])
      .then(([roleData, statusData]) => {
        setRoles(roleData);
        setStatuses(statusData);
      })
      .catch((lookupError) => {
        setError(
          lookupError instanceof Error
            ? lookupError.message
            : "Unable to load user filters.",
        );
      });
  }, []);

  useEffect(() => {
    void loadUsers();
  }, [query]);

  async function loadUsers() {
    setLoading(true);
    setError("");

    try {
      const response = await usersApi.list(query);
      setUsers(response.data);
      setSelectedIds(new Set());
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load users.",
      );
    } finally {
      setLoading(false);
    }
  }

  function openUser(userId: number, edit = false) {
    void navigate({
      to: "/users/$userId",
      params: { userId: String(userId) },
      search: edit ? { edit: true } : { edit: false },
    });
  }

  async function createUser(input: CreateUserInput) {
    setMutating(true);
    try {
      const response = await usersApi.create(input);
      setCreateOpen(false);
      await loadUsers();
      openUser(response.user.id);
    } finally {
      setMutating(false);
    }
  }

  async function deleteUser(userId: number) {
    if (!window.confirm("Delete this user? This action soft-deletes the account.")) {
      return;
    }

    setMutating(true);
    try {
      await usersApi.remove(userId);
      await loadUsers();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete the user.",
      );
    } finally {
      setMutating(false);
    }
  }

  async function runBulkStatus(statusId: number) {
    setMutating(true);
    try {
      await usersApi.bulkStatus([...selectedIds], statusId);
      await loadUsers();
    } finally {
      setMutating(false);
    }
  }

  async function runBulkRoles(roleIds: number[], mode: BulkRoleMode) {
    setMutating(true);
    try {
      await usersApi.bulkRoles([...selectedIds], roleIds, mode);
      await loadUsers();
    } finally {
      setMutating(false);
    }
  }

  async function runBulkDelete() {
    if (!window.confirm(`Delete ${selectedIds.size} selected users?`)) {
      return;
    }

    setMutating(true);
    try {
      await usersApi.bulkDelete([...selectedIds]);
      await loadUsers();
    } finally {
      setMutating(false);
    }
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Manage staff and organization members</p>
        </div>

        <button className="primary page-primary" onClick={() => setCreateOpen(true)}>
          <Plus size={16} />
          Add user
        </button>
      </div>

      <Card>
        <div className="users-toolbar">
          <div className="toolbar-top-row">
            <div className="search">
              <Search size={18} />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search name, username, or email..."
              />
            </div>

            <div className="actions">
              <button type="button">
                <Upload size={16} />
                Import
              </button>
              <button type="button">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>

          <div className="filters-bulk-row">
            <UserFilters
              value={filters}
              roles={roles}
              statuses={statuses}
              onChange={setFilters}
              onClear={() => setFilters(emptyFilters)}
            />

            <BulkActions
              selectedCount={selectedIds.size}
              roles={roles}
              statuses={statuses}
              disabled={mutating}
              onStatus={runBulkStatus}
              onRoles={runBulkRoles}
              onDelete={runBulkDelete}
            />
          </div>
        </div>
      </Card>

      {error && <div className="page-error">{error}</div>}

      <Card>
        {loading ? (
          <div className="loading-state">Loading users...</div>
        ) : (
          <UsersTable
            users={users}
            selectedIds={selectedIds}
            onSelect={(userId, selected) => {
              setSelectedIds((current) => {
                const next = new Set(current);
                if (selected) next.add(userId);
                else next.delete(userId);
                return next;
              });
            }}
            onSelectAll={(selected) => {
              setSelectedIds(
                selected ? new Set(users.map((user) => user.id)) : new Set(),
              );
            }}
            onView={(userId) => openUser(userId)}
            onEdit={(userId) => openUser(userId, true)}
            onDelete={deleteUser}
          />
        )}
      </Card>

      <CreateUserModal
        open={createOpen}
        roles={roles}
        statuses={statuses}
        submitting={mutating}
        onClose={() => setCreateOpen(false)}
        onSubmit={createUser}
      />
    </div>
  );
}
