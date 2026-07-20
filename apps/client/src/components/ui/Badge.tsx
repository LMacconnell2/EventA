// import "./badge.css";

export function Badge({
  children,
  color = "blue",
}: {
  children: React.ReactNode;
  color?: "blue" | "green" | "gray";
}) {
  return <span className={`badge badge-${color}`}>{children}</span>;
}