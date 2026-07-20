import { useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, Edit, Save, Trash2, X } from "lucide-react";
import { useNavigate, useParams, useSearch } from "@tanstack/react-router";

import "./Users.css";

import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { usersApi } from "./api/usersApi";
import type {
  UpdateUserInput,
  UserDetails,
  UserRole,
  UserStatus,
} from "./types";

export function UserDetailsPage() {
  const navigate = useNavigate();
  const { userId } = useParams({ from: "/users/$userId" });
  const search = useSearch({ from: "/users/$userId" });

  const [user, setUser] = useState<UserDetails | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [form, setForm] = useState<UpdateUserInput>({});
  const [editing, setEditing] = useState(Boolean(search.edit));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadPage();
  }, [userId]);

  async function loadPage() {
    setLoading(true);
    setError("");

    try {
      const [userResponse, roleData, statusData] = await Promise.all([
        usersApi.getById(Number(userId)),
        usersApi.roles(),
        usersApi.statuses(),
      ]);

      setUser(userResponse.user);
      setRoles(roleData);
      setStatuses(statusData);
      setForm(toForm(userResponse.user));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load the user.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveUser(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const response = await usersApi.update(Number(userId), form);
      setUser(response.user);
      setForm(toForm(response.user));
      setEditing(false);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to update the user.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser() {
    if (!window.confirm("Delete this user?")) return;

    await usersApi.remove(Number(userId));
    void navigate({ to: "/users" });
  }

  if (loading) {
    return <div className="users-page">Loading user...</div>;
  }

  if (!user) {
    return <div className="users-page">{error || "User not found."}</div>;
  }

  const fullName = `${user.fname} ${user.lname}`.trim();

  return (
    <div className="users-page">
      <div className="details-page-header">
        <button
          type="button"
          className="back-button"
          onClick={() => navigate({ to: "/users" })}
        >
          <ArrowLeft size={18} />
          Users
        </button>

        <div className="details-actions">
          {editing ? (
            <button type="button" onClick={() => setEditing(false)}>
              <X size={16} />
              Cancel
            </button>
          ) : (
            <button type="button" onClick={() => setEditing(true)}>
              <Edit size={16} />
              Edit user
            </button>
          )}

          <button type="button" className="danger-button" onClick={deleteUser}>
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>

      {error && <div className="page-error">{error}</div>}

      <Card>
        <div className="user-hero">
          <Avatar src={user.profilePhoto ?? undefined} name={fullName} />
          <div>
            <h1>{fullName}</h1>
            <p>@{user.username}</p>
            <div className="badge-list">
              <Badge color={user.status.active ? "green" : "gray"}>
                {user.status.name}
              </Badge>
              {user.roles.map((role) => (
                <Badge key={role.id} color="blue">
                  {role.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {editing ? (
        <Card>
          <form className="user-form" onSubmit={saveUser}>
            <div className="form-grid">
              <TextField
                label="First name"
                value={form.fname ?? ""}
                onChange={(value) => setForm({ ...form, fname: value })}
              />
              <TextField
                label="Last name"
                value={form.lname ?? ""}
                onChange={(value) => setForm({ ...form, lname: value })}
              />
              <TextField
                label="Username"
                value={form.username ?? ""}
                onChange={(value) => setForm({ ...form, username: value })}
              />
              <TextField
                label="Email"
                type="email"
                value={form.email ?? ""}
                onChange={(value) => setForm({ ...form, email: value })}
              />
              <TextField
                label="Contact email"
                type="email"
                value={form.contactEmail ?? ""}
                onChange={(value) =>
                  setForm({ ...form, contactEmail: value || null })
                }
              />
              <TextField
                label="Position"
                value={form.position ?? ""}
                onChange={(value) =>
                  setForm({ ...form, position: value || null })
                }
              />
              <TextField
                label="Phone"
                value={form.phone ?? ""}
                onChange={(value) => setForm({ ...form, phone: value || null })}
              />
              <TextField
                label="Address"
                value={form.address ?? ""}
                onChange={(value) =>
                  setForm({ ...form, address: value || null })
                }
              />
              <TextField
                label="City"
                value={form.city ?? ""}
                onChange={(value) => setForm({ ...form, city: value || null })}
              />
              <TextField
                label="State"
                value={form.state ?? ""}
                onChange={(value) => setForm({ ...form, state: value || null })}
              />
              <TextField
                label="Country"
                value={form.country ?? ""}
                onChange={(value) =>
                  setForm({ ...form, country: value || null })
                }
              />
              <TextField
                label="ZIP"
                value={form.zip ?? ""}
                onChange={(value) => setForm({ ...form, zip: value || null })}
              />

              <label>
                Status
                <select
                  value={form.statusId ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, statusId: Number(event.target.value) })
                  }
                >
                  {statuses.map((status) => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Role
                <select
                  value={form.roleIds?.[0] ?? ""}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      roleIds: [Number(event.target.value)],
                    })
                  }
                >
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-field-full">
                Bio
                <textarea
                  rows={5}
                  value={form.bio ?? ""}
                  onChange={(event) =>
                    setForm({ ...form, bio: event.target.value || null })
                  }
                />
              </label>
            </div>

            <div className="modal-actions">
              <button type="submit" className="primary" disabled={saving}>
                <Save size={16} />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        </Card>
      ) : (
        <div className="details-grid">
          <Card>
            <h2>Contact</h2>
            <Definition label="Email" value={user.email} />
            <Definition label="Contact email" value={user.contactEmail} />
            <Definition label="Phone" value={user.phone} />
            <Definition label="Position" value={user.position} />
          </Card>

          <Card>
            <h2>Address</h2>
            <Definition label="Address" value={user.address} />
            <Definition label="City" value={user.city} />
            <Definition label="State" value={user.state} />
            <Definition label="Country" value={user.country} />
            <Definition label="ZIP" value={user.zip} />
          </Card>

          <Card>
            <h2>Account</h2>
            <Definition label="Created" value={formatDate(user.createdAt)} />
            <Definition label="Updated" value={formatDate(user.updatedAt)} />
            <Definition label="Last login" value={formatDate(user.lastLogin)} />
          </Card>

          <Card>
            <h2>Bio</h2>
            <p>{user.bio || "No biography has been added."}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

function toForm(user: UserDetails): UpdateUserInput {
  return {
    username: user.username,
    email: user.email,
    contactEmail: user.contactEmail,
    statusId: user.status.id,
    position: user.position,
    bio: user.bio,
    phone: user.phone,
    address: user.address,
    city: user.city,
    state: user.state,
    country: user.country,
    zip: user.zip,
    fname: user.fname,
    lname: user.lname,
    roleIds: user.roles.map((role) => role.id),
  };
}

function TextField({
  label,
  value,
  type = "text",
  onChange,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function Definition({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="definition-row">
      <dt>{label}</dt>
      <dd>{value || "—"}</dd>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) return "Never";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
