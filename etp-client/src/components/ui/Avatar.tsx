// import "./avatar.css";

type Props = {
  src?: string;
  name: string;
};

export function Avatar({ src, name }: Props) {
  if (!src) {
    return (
      <div className="avatar-fallback">
        {name.slice(0, 1).toUpperCase()}
      </div>
    );
  }

  return <img className="avatar" src={src} alt={name} />;
}