export function Select({ label, error, children, ...props }) {
  return (
    <div className="field">
      {label && <div className="label">{label}</div>}
      <select {...props}>{children}</select>
      {error && <div className="error">{error}</div>}
    </div>
  );
}