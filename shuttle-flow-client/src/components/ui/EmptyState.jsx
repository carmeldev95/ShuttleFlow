export default function EmptyState({ title, subtitle }) {
  return (
    <div className="notice">
      <div style={{ fontWeight: 800, marginBottom: 2 }}>{title}</div>
      {subtitle && <div>{subtitle}</div>}
    </div>
  );
}