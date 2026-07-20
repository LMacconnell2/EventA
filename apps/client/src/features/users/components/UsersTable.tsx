import { Edit, Eye, Trash2 } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import type { UserListItem } from "../types";

type Props = {
  users: UserListItem[];
  selectedIds: Set<number>;
  onSelect: (userId: number, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onView: (userId: number) => void;
  onEdit: (userId: number) => void;
  onDelete: (userId: number) => void;
};

function formatDate(value: string | null): string {
  if (!value) return "Never";

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function UsersTable({
  users,
  selectedIds,
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
}: Props) {
  const allSelected =
    users.length > 0 && users.every((user) => selectedIds.has(user.id));

  return (
    <div className="table-scroll">
      <table className="table">
        <thead>
          <tr>
            <th className="checkbox-column">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => onSelectAll(event.target.checked)}
                aria-label="Select all visible users"
              />
            </th>
            <th>User</th>
            <th>Email</th>
            <th>Roles</th>
            <th>Status</th>
            <th>Date joined</th>
            <th>Last login</th>
            <th className="actions-column">Actions</th>
          </tr>
        </thead>

        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan={8} className="empty-cell">
                No users matched the selected filters.
              </td>
            </tr>
          ) : (
            users.map((user) => {
              const name = `${user.fname} ${user.lname}`.trim();

              return (
                <tr key={user.id}>
                  <td className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(user.id)}
                      onChange={(event) =>
                        onSelect(user.id, event.target.checked)
                      }
                      aria-label={`Select ${name}`}
                    />
                  </td>

                  <td className="user-cell">
                    <Avatar
                      src={user.profilePhoto ?? undefined}
                      name={name}
                    />
                    <div>
                      <button
                        type="button"
                        className="user-name-button"
                        onClick={() => onView(user.id)}
                      >
                        {name}
                      </button>
                      <span>@{user.username}</span>
                    </div>
                  </td>

                  <td>{user.email}</td>

                  <td>
                    <div className="badge-list">
                      {user.roles.map((role) => (
                        <Badge key={role.id} color="blue">
                          {role.name}
                        </Badge>
                      ))}
                    </div>
                  </td>

                  <td>
                    <Badge color={user.status.active ? "green" : "gray"}>
                      {user.status.name}
                    </Badge>
                  </td>

                  <td>{formatDate(user.createdAt)}</td>
                  <td>{formatDate(user.lastLogin)}</td>

                  <td>
                    <div className="actions-row">
                      <IconButton title="View" onClick={() => onView(user.id)}>
                        <Eye size={16} />
                      </IconButton>

                      <IconButton title="Edit" onClick={() => onEdit(user.id)}>
                        <Edit size={16} />
                      </IconButton>

                      <IconButton
                        title="Delete"
                        variant="danger"
                        onClick={() => onDelete(user.id)}
                      >
                        <Trash2 size={16} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
