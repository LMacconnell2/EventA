type Props = {
  checked?: boolean;
  onChange?: (val: boolean) => void;
  label: string;
};

export function Checkbox({ checked, onChange, label }: Props) {
  return (
    <label className="checkbox">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span>{label}</span>
    </label>
  );
}