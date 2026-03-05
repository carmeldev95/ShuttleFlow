export default function Card({ title, subtitle, right, children }) {
  return (
    <div className="card">
      {(title || right) && (
        <div className="row" style={{ marginBottom: 10 }}>
          <div>
            {title && <div className="h2">{title}</div>}
            {subtitle && <div className="p" style={{ margin: 0 }}>{subtitle}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}