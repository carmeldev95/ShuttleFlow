import { useState } from "react";

export default function SignupSuccessModal({ user, password, onClose }) {
  const [copied, setCopied] = useState(false);

  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim();

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password || "");
      setCopied(true);
    } catch {
      // Fallback for browsers/contexts without clipboard API
      const ta = document.createElement("textarea");
      ta.value = password || "";
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } catch {
        setCopied(false);
      } finally {
        document.body.removeChild(ta);
      }
    }
  }

  return (
    <div className="modalOverlay">
      <div className="modalCard">
        <div className="modalTitle">המשתמש נוצר בהצלחה 🎉</div>
        <div className="modalMsg">
          שמור את פרטי ההתחברות שלך — תזדקק להם כדי להתחבר למערכת.
        </div>

        <div className="credBox">
          {fullName && (
            <div className="credRow">
              <span className="credLabel">שם</span>
              <span className="credValue">{fullName}</span>
            </div>
          )}
          <div className="credRow">
            <span className="credLabel">טלפון (שם משתמש)</span>
            <span className="credValue">{user?.phone || ""}</span>
          </div>
          <div className="credRow">
            <span className="credLabel">סיסמה</span>
            <span className="credValue">{password}</span>
          </div>
        </div>

        <button type="button" className="btn btnPrimary" style={{ width: "100%" }} onClick={copyPassword}>
          {copied ? "✓ הסיסמה הועתקה" : "העתק סיסמה"}
        </button>

        {copied && (
          <div className="notice" style={{ marginTop: 8 }}>
            הפרטים הועתקו — יש להדביק (Ctrl+V) במקום הרצוי לשמירה.
          </div>
        )}

        <div className="modalActions" style={{ marginTop: 12 }}>
          <button type="button" className="btn btnPrimary" onClick={onClose}>
            המשך למערכת
          </button>
        </div>
      </div>
    </div>
  );
}
