// import "./iconButton.css";

type Props = {
  onClick?: () => void;
  children: React.ReactNode;
  title?: string;
  variant?: "default" | "danger";
};

export function IconButton({
  onClick,
  children,
  title,
  variant = "default",
}: Props) {
  return (
    <button className={`icon-btn ${variant}`} onClick={onClick} title={title}>
      {children}
    </button>
  );
}