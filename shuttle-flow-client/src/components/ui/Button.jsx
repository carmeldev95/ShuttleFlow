export default function Button({ variant = "default", children, ...props }) {
  const cls =
    variant === "primary"
      ? "btn btnPrimary"
      : variant === "danger"
      ? "btn btnDanger"
      : variant === "ghost"
      ? "btn btnGhost"
      : "btn";
  return (
    <button className={cls} {...props}>
      {children}
    </button>
  );
}