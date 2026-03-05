export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toastHost" role="status" aria-live="polite">
      {toasts.map((t) => {
        const type = t.type || "info";
        const icon =
          type === "danger" ? "⚠️" :
          type === "success" ? "✅" :
          type === "warning" ? "🟡" : "ℹ️";

        return (
          <div key={t.id} className={`toast toast--${type}`}>
            <div className="toastIcon" aria-hidden="true">{icon}</div>

            <div className="toastBody">
              <div className="toastTitle">{t.title}</div>
              {t.message && <div className="toastMsg">{t.message}</div>}
            </div>

            <div className="toastBar" />
          </div>
        );
      })}
    </div>
  );
}