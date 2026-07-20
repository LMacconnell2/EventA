type Props = {
  label: string;
  value: string;
  isEditing: boolean;
  type?: "text" | "email" | "tel" | "textarea";
  onChange: (value: string) => void;
};

export function ProfileField({
  label,
  value,
  isEditing,
  type = "text",
  onChange,
}: Props) {
  return (
    <div className="field">
      <label className="label">{label}</label>

      {!isEditing && (
        <div className="text">
          {value || "—"}
        </div>
      )}

      {isEditing && type !== "textarea" && (
        <input
          className="input"
          type={type}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      )}

      {isEditing && type === "textarea" && (
        <textarea
          className="textarea"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
        />
      )}
    </div>
  );
}