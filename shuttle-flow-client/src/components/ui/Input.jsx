export function Input({ label, error, ...props }) {
  return (
    <div className="field">
      {label && <div className="label">{label}</div>}
      <input {...props} />
      {error && <div className="error">{error}</div>}
    </div>
  );
}