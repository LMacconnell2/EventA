import { useState } from "react";
import type { BulkRoleMode, UserRole, UserStatus } from "../types";

type Props = {
  selectedCount: number;
  roles: UserRole[];
  statuses: UserStatus[];
  disabled?: boolean;
  onStatus: (statusId: number) => Promise<void>;
  onRoles: (roleIds: number[], mode: BulkRoleMode) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function BulkActions({
  selectedCount,
  roles,
  statuses,
  disabled,
  onStatus,
  onRoles,
  onDelete,
}: Props) {
  const [statusId, setStatusId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [roleMode, setRoleMode] = useState<BulkRoleMode>("add");

  return (
    <div className="bulk-actions">
      <span>{selectedCount} selected</span>

      <select
        value={statusId}
        onChange={(event) => setStatusId(event.target.value)}
        disabled={disabled || selectedCount === 0}
      >
        <option value="">Set status...</option>
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={disabled || selectedCount === 0 || !statusId}
        onClick={() => onStatus(Number(statusId))}
      >
        Apply status
      </button>

      <select
        value={roleMode}
        onChange={(event) => setRoleMode(event.target.value as BulkRoleMode)}
        disabled={disabled || selectedCount === 0}
      >
        <option value="add">Add role</option>
        <option value="remove">Remove role</option>
        <option value="replace">Replace roles</option>
      </select>

      <select
        value={roleId}
        onChange={(event) => setRoleId(event.target.value)}
        disabled={disabled || selectedCount === 0}
      >
        <option value="">Choose role...</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>

      <button
        type="button"
        disabled={disabled || selectedCount === 0 || !roleId}
        onClick={() => onRoles([Number(roleId)], roleMode)}
      >
        Apply role
      </button>

      <button
        type="button"
        className="danger-button"
        disabled={disabled || selectedCount === 0}
        onClick={onDelete}
      >
        Delete selected
      </button>
    </div>
  );
}
