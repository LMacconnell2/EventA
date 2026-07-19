import type { UserRole, UserStatus } from "../types";

export type UserFilterValue = {
  roleId: string;
  statusId: string;
  joinedStart: string;
  joinedEnd: string;
};

type Props = {
  value: UserFilterValue;
  roles: UserRole[];
  statuses: UserStatus[];
  onChange: (value: UserFilterValue) => void;
  onClear: () => void;
};

export function UserFilters({
  value,
  roles,
  statuses,
  onChange,
  onClear,
}: Props) {
  return (
    <div className="user-filters">
      <select
        value={value.roleId}
        onChange={(event) =>
          onChange({ ...value, roleId: event.target.value })
        }
      >
        <option value="">All roles</option>
        {roles.map((role) => (
          <option key={role.id} value={role.id}>
            {role.name}
          </option>
        ))}
      </select>

      <select
        value={value.statusId}
        onChange={(event) =>
          onChange({ ...value, statusId: event.target.value })
        }
      >
        <option value="">All statuses</option>
        {statuses.map((status) => (
          <option key={status.id} value={status.id}>
            {status.name}
          </option>
        ))}
      </select>

      <label>
        Joined after
        <input
          type="date"
          value={value.joinedStart}
          onChange={(event) =>
            onChange({ ...value, joinedStart: event.target.value })
          }
        />
      </label>

      <label>
        Joined before
        <input
          type="date"
          value={value.joinedEnd}
          onChange={(event) =>
            onChange({ ...value, joinedEnd: event.target.value })
          }
        />
      </label>

      <button type="button" className="text-button" onClick={onClear}>
        Clear filters
      </button>
    </div>
  );
}
