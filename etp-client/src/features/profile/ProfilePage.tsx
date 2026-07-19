import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Calendar,
  Camera,
  KeyRound,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { getAssetUrl } from "../../lib/assetUrl";

import "./Profile.css";

import { profileApi } from "./api/profileApi";
import { ProfileField } from "./components/ProfileField";
import type {
  MyProfile,
  UpdateMyProfileInput,
} from "./types/profileTypes";

export function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] =
    useState<MyProfile | null>(null);

  const [draft, setDraft] =
    useState<UpdateMyProfileInput>({});

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);

  const [passwordOpen, setPasswordOpen] =
    useState(false);

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [revokeOtherSessions, setRevokeOtherSessions] =
    useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    void loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const response = await profileApi.getProfile();

      setProfile(response.user);
      setDraft(toDraft(response.user));
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load your profile.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await profileApi.updateProfile(draft);

      setProfile(response.user);
      setDraft(toDraft(response.user));
      setIsEditing(false);
      setMessage(response.message);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save your profile.",
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelEditing() {
    if (profile) {
      setDraft(toDraft(profile));
    }

    setIsEditing(false);
  }

  async function handlePhotoSelected(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setPhotoSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await profileApi.uploadProfilePhoto(file);

      setProfile((current) =>
        current
          ? {
              ...current,
              profilePhoto: response.profilePhoto,
            }
          : current,
      );

      setMessage(response.message);
    } catch (photoError) {
      setError(
        photoError instanceof Error
          ? photoError.message
          : "Unable to upload the profile photo.",
      );
    } finally {
      event.target.value = "";
      setPhotoSaving(false);
    }
  }

  async function removePhoto() {
    setPhotoSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await profileApi.removeProfilePhoto();

      setProfile((current) =>
        current
          ? {
              ...current,
              profilePhoto: null,
            }
          : current,
      );

      setMessage(response.message);
    } catch (photoError) {
      setError(
        photoError instanceof Error
          ? photoError.message
          : "Unable to remove the profile photo.",
      );
    } finally {
      setPhotoSaving(false);
    }
  }

  async function changePassword() {
    setError("");
    setMessage("");

    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }

    setSaving(true);

    try {
      const response =
        await profileApi.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions,
        });

      setMessage(response.message);
      setPasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (passwordError) {
      setError(
        passwordError instanceof Error
          ? passwordError.message
          : "Unable to change your password.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount() {
    const confirmed = window.confirm(
      "Delete your account? You will be signed out and this action may not be reversible.",
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response =
        await profileApi.deleteAccount();

      void navigate({
        to: response.redirectTo || "/login",
      });
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete your account.",
      );

      setSaving(false);
    }
  }

  if (loading) {
    return <div className="page">Loading profile...</div>;
  }

  if (!profile) {
    return (
      <div className="page">
        {error || "Profile not found."}
      </div>
    );
  }

  const fullName =
    `${profile.fname} ${profile.lname}`.trim();

  const roles = profile.roles
    .map((role) => role.name)
    .join(", ");

  const location = [
    profile.city,
    profile.state,
    profile.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="page">
      <div className="header">
        <div>
          <h1>Profile</h1>
          <p>
            Manage your personal information and account
            security
          </p>
        </div>

        {!isEditing ? (
          <button
            className="button primary"
            onClick={() => setIsEditing(true)}
          >
            Edit profile
          </button>
        ) : (
          <div className="header-actions">
            <button
              className="button secondary"
              onClick={cancelEditing}
            >
              Cancel
            </button>

            <button
              className="button primary"
              onClick={saveProfile}
              disabled={saving}
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="page-message error">
          {error}
        </div>
      )}

      {message && (
        <div className="page-message success">
          {message}
        </div>
      )}

      <div className="layout">
        <div className="card center">
          <div className="avatar-container">
            {profile.profilePhoto ? (
              <img
                className="avatar"
                src={getAssetUrl(profile.profilePhoto)}
                alt={`${fullName}'s profile`}
              />
            ) : (
              <div className="avatar avatar-fallback">
                {getInitials(
                  profile.fname,
                  profile.lname,
                )}
              </div>
            )}

            <button
              className="camera-button"
              type="button"
              disabled={photoSaving}
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <Camera size={17} />
            </button>

            <input
              ref={fileInputRef}
              className="hidden-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoSelected}
            />
          </div>

          <h2>{fullName}</h2>
          <p className="muted">
            {profile.position || roles || "User"}
          </p>

          <div className="photo-actions">
            <button
              className="button secondary"
              disabled={photoSaving}
              onClick={() =>
                fileInputRef.current?.click()
              }
            >
              <Camera size={16} />
              Change photo
            </button>

            {profile.profilePhoto && (
              <button
                className="button danger-outline"
                disabled={photoSaving}
                onClick={removePhoto}
              >
                Remove
              </button>
            )}
          </div>

          <div className="section">
            <div className="icon-row">
              <Mail size={16} />
              {profile.email}
            </div>

            <div className="icon-row">
              <Phone size={16} />
              {profile.phone || "No phone number"}
            </div>

            <div className="icon-row">
              <MapPin size={16} />
              {location || "No location"}
            </div>

            <div className="icon-row">
              <Calendar size={16} />
              Joined {formatDate(profile.createdAt)}
            </div>
          </div>

          <div className="account-actions">
            <button
              className="button secondary"
              onClick={() => setPasswordOpen(true)}
            >
              <KeyRound size={16} />
              Change password
            </button>

            <button
              className="button danger"
              disabled={saving}
              onClick={deleteAccount}
            >
              <Trash2 size={16} />
              Delete account
            </button>
          </div>
        </div>

        <div className="card">
          <h3>Personal Information</h3>

          <div className="profile-form-grid">
            <ProfileField
              label="First name"
              value={draft.fname ?? ""}
              isEditing={isEditing}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  fname: value,
                })
              }
            />

            <ProfileField
              label="Last name"
              value={draft.lname ?? ""}
              isEditing={isEditing}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  lname: value,
                })
              }
            />

            <ProfileField
              label="Username"
              value={draft.username ?? ""}
              isEditing={isEditing}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  username: value,
                })
              }
            />

            <ProfileField
              label="Email"
              value={draft.email ?? ""}
              isEditing={isEditing}
              type="email"
              onChange={(value) =>
                setDraft({
                  ...draft,
                  email: value,
                })
              }
            />

            <ProfileField
              label="Contact email"
              value={draft.contactEmail ?? ""}
              isEditing={isEditing}
              type="email"
              onChange={(value) =>
                setDraft({
                  ...draft,
                  contactEmail: value || null,
                })
              }
            />

            <ProfileField
              label="Phone"
              value={draft.phone ?? ""}
              isEditing={isEditing}
              type="tel"
              onChange={(value) =>
                setDraft({
                  ...draft,
                  phone: value || null,
                })
              }
            />

            <ProfileField
              label="Position"
              value={draft.position ?? ""}
              isEditing={isEditing}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  position: value || null,
                })
              }
            />

            <ProfileField
              label="Address"
              value={draft.address ?? ""}
              isEditing={isEditing}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  address: value || null,
                })
              }
            />

            <ProfileField
              label="City"
              value={draft.city ?? ""}
              isEditing={isEditing}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  city: value || null,
                })
              }
            />

            <ProfileField
              label="State"
              value={draft.state ?? ""}
              isEditing={isEditing}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  state: value || null,
                })
              }
            />

            <ProfileField
              label="Country"
              value={draft.country ?? ""}
              isEditing={isEditing}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  country: value || null,
                })
              }
            />

            <ProfileField
              label="ZIP"
              value={draft.zip ?? ""}
              isEditing={isEditing}
              onChange={(value) =>
                setDraft({
                  ...draft,
                  zip: value || null,
                })
              }
            />

            <div className="field full-width">
              <label className="label">Roles</label>
              <div className="text">
                {roles || "No roles assigned"}
              </div>
            </div>

            <div className="field full-width">
              <label className="label">Status</label>
              <div className="text">
                {profile.status.name}
              </div>
            </div>

            <div className="full-width">
              <ProfileField
                label="Bio"
                value={draft.bio ?? ""}
                isEditing={isEditing}
                type="textarea"
                onChange={(value) =>
                  setDraft({
                    ...draft,
                    bio: value || null,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>

      {passwordOpen && (
        <div
          className="modal-backdrop"
          onMouseDown={() => setPasswordOpen(false)}
        >
          <div
            className="modal-card"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <h2>Change password</h2>

            <label>
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={(event) =>
                  setCurrentPassword(event.target.value)
                }
              />
            </label>

            <label>
              New password
              <input
                type="password"
                minLength={8}
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
              />
            </label>

            <label>
              Confirm new password
              <input
                type="password"
                minLength={8}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={revokeOtherSessions}
                onChange={(event) =>
                  setRevokeOtherSessions(
                    event.target.checked,
                  )
                }
              />
              Sign out my other sessions
            </label>

            <div className="modal-actions">
              <button
                className="button secondary"
                onClick={() => setPasswordOpen(false)}
              >
                Cancel
              </button>

              <button
                className="button primary"
                disabled={saving}
                onClick={changePassword}
              >
                Change password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function toDraft(
  profile: MyProfile,
): UpdateMyProfileInput {
  return {
    username: profile.username,
    email: profile.email,
    contactEmail: profile.contactEmail,
    position: profile.position,
    bio: profile.bio,
    phone: profile.phone,
    address: profile.address,
    city: profile.city,
    state: profile.state,
    country: profile.country,
    zip: profile.zip,
    fname: profile.fname,
    lname: profile.lname,
  };
}

function getInitials(
  fname: string,
  lname: string,
): string {
  return `${fname.charAt(0)}${lname.charAt(0)}`
    .toUpperCase();
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(value));
}