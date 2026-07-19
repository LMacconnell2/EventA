import { useEffect, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import type { CreateUserInput, UserRole, UserStatus } from "../types";

type Props = {
  open: boolean;
  roles: UserRole[];
  statuses: UserStatus[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (input: CreateUserInput) => Promise<void>;
};

const emptyForm: CreateUserInput = {
  username: "",
  email: "",
  fname: "",
  lname: "",
  statusId: 0,
  roleIds: [],
  temporaryPassword: "",
};

export function CreateUserModal({
  open,
  roles,
  statuses,
  submitting,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<CreateUserInput>(emptyForm);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;

    setForm({
      ...emptyForm,
      statusId: statuses[0]?.id ?? 0,
      roleIds: roles[0] ? [roles[0].id] : [],
    });
    setError("");
  }, [open, roles, statuses]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    try {
      await onSubmit(form);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to create the user.",
      );
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 id="create-user-title">Create user</h2>
            <p>Add a staff or organization member.</p>
          </div>

          <button
            type="button"
            className="icon-only-button"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form className="user-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              First name
              <input
                required
                value={form.fname}
                onChange={(event) =>
                  setForm({ ...form, fname: event.target.value })
                }
              />
            </label>

            <label>
              Last name
              <input
                required
                value={form.lname}
                onChange={(event) =>
                  setForm({ ...form, lname: event.target.value })
                }
              />
            </label>

            <label>
              Username
              <input
                required
                minLength={3}
                value={form.username}
                onChange={(event) =>
                  setForm({ ...form, username: event.target.value })
                }
              />
            </label>

            <label>
              Email
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm({ ...form, email: event.target.value })
                }
              />
            </label>

            <label>
              Temporary password
              <input
                required
                type="password"
                minLength={8}
                value={form.temporaryPassword}
                onChange={(event) =>
                  setForm({
                    ...form,
                    temporaryPassword: event.target.value,
                  })
                }
              />
            </label>

            <label>
              Status
              <select
                required
                value={form.statusId || ""}
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

            <label className="form-field-full">
              Role
              <select
                required
                value={form.roleIds[0] ?? ""}
                onChange={(event) =>
                  setForm({ ...form, roleIds: [Number(event.target.value)] })
                }
              >
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {error && <p className="form-error">{error}</p>}

          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button className="primary" disabled={submitting}>
              {submitting ? "Creating..." : "Create user"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
