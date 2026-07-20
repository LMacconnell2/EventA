import "./select.css";

type Props = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select(props: Props) {
  return <select {...props} className={`select ${props.className ?? ""}`} />;
}