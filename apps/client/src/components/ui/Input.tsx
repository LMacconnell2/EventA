import "./input.css";

type Props = React.InputHTMLAttributes<HTMLInputElement>;

export function Input(props: Props) {
  return <input {...props} className={`input ${props.className ?? ""}`} />;
}