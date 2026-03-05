import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { getSession } from "../../services/auth.service.js";
import { listRegistrations } from "../../services/registrations.service.js";

import { SHIFT_LABEL, DIRECTION_LABEL, SITE_LABEL } from "../../utils/constants.js";
import RegistrationCards from "../../components/shuttle/RegistrationCards.jsx";
import { formatDate } from "../../utils/datetime.js";

/**
 * Admin cards: show recent registrations created by this admin.
 */
function AdminRecentRegistrationCards({ rows }) {
  return (
    <div className="regGrid">
      {rows.map((r) => (
        <div key={r._id || r.id} className="regCard">
          <div className="regTop">
            <div className="regDate">{formatDate(r.date)}</div>

          </div>

          <div className="regRow">
            <span className="regLabel">עובד</span>
            <span className="regVal">
              {r.userSnapshot?.firstName} {r.userSnapshot?.lastName}
            </span>
          </div>

          <div className="regRow">
            <span className="regLabel">טלפון</span>
            <span className="regVal">{r.userSnapshot?.phone || "-"}</span>
          </div>

          <div className="regRow">
            <span className="regLabel">סוג</span>
            <span className="regVal">
              {DIRECTION_LABEL[r.direction] || r.direction}
            </span>
          </div>

          <div className="regRow">
            <span className="regLabel">מיקום</span>
            <span className="regVal">{SITE_LABEL[r.site] || r.site}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { toast } = useOutletContext();
  const session = getSession();
  const user = session?.user;

  // הגנה – אם אין session/user לא נרנדר (מונע קריסות כמו "reading 'role'")
  if (!user) return null;

  const isAdmin = user.role === "admin";

  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ לא להכניס toast ל-deps של useEffect (אובייקט משתנה → לולאה)
  const toastRef = useRef(toast);
  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // ✅ כדי שלא נקפיץ אותה שגיאה שוב ושוב
  const errorShownRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const rows = await listRegistrations();

        const sorted = (rows || []).slice().sort((a, b) => {
          // prefer createdAt when exists, fallback to date
          const at = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bt = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          if (bt !== at) return bt - at;
          return a.date < b.date ? 1 : -1;
        });

        // אם הצליח – מאפסים את הדגל (כדי שבפעם הבאה שנכשל, כן תוצג הודעה)
        errorShownRef.current = false;

        if (!cancelled) setAll(sorted);
      } catch (e) {
        if (!cancelled) setAll([]);

        // ✅ טוסט פעם אחת עד להצלחה
        if (!errorShownRef.current) {
          errorShownRef.current = true;
          toastRef.current?.push?.({
            title: "שגיאה",
            message: e?.message || "שגיאה בטעינת רישומים",
            type: "danger",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []); // ✅ חשוב: deps ריק

  // Employee: last 6 (newest first)
  const my = useMemo(() => {
    if (isAdmin) return [];
    return all.slice(0, 6);
  }, [all, isAdmin]);

  // Admin: last 6 created by this admin (server saves createdBy as ObjectId)
  const adminRecent = useMemo(() => {
    if (!isAdmin) return [];

    const adminId = user?.id;

    // If createdBy missing (old data), fallback to latest overall
    const withMeta = all.filter((r) => r.createdBy);
    if (!withMeta.length) return all.slice(0, 6);

    const mine = all.filter((r) => String(r.createdBy) === String(adminId));
    return (mine.length ? mine : all).slice(0, 6);
  }, [all, isAdmin, user?.id]);

  return (
    <>
      <Card
        title="דשבורד"
        subtitle={isAdmin ? "ניהול מהיר של רישומי העובדים" : "ניהול מהיר של ההסעות שלך"}
        right={
          !isAdmin ? (
            <Link to="/register">
              <Button variant="primary">הרשמה להסעה</Button>
            </Link>
          ) : null
        }
      >
        <div className="notice">
          כללי שינוי: <b>איסוף ערב</b> ו-<b>פיזור בוקר</b> עד 10:00 · <b>לילה</b> +{" "}
          <b>איסוף בוקר למחרת</b> עד 16:00 · אחרי מועד ההסעה נעול.
        </div>

        <div className="hr" />

        <div className="h2">{isAdmin ? "הרשמות אחרונות שהוספת" : "ההרשמות האחרונות"}</div>

        {loading ? (
          <div className="p">טוען...</div>
        ) : isAdmin ? (
          adminRecent.length === 0 ? (
            <div className="p">עדיין לא הוספת רישומים.</div>
          ) : (
            <AdminRecentRegistrationCards rows={adminRecent} />
          )
        ) : my.length === 0 ? (
          <div className="p">אין עדיין הרשמות. לחץ על "הרשמה להסעה".</div>
        ) : (
          <RegistrationCards rows={my} />
        )}
      </Card>

      <div style={{ height: 12 }} />

      {isAdmin ? (
        <div className="notice">
          <div className="h2" style={{ margin: 0 }}>
            מנהל
          </div>
          <div className="p" style={{ margin: "6px 0 0" }}>
            אתה יכול להוסיף רישום לעובד גם דרך <b>דף "הרשמה להסעה"</b> (בחירת עובד),
            וגם דרך <b>"ניהול רישומים"</b> באמצעות הכפתור <b>"הוסף רישום"</b>.
          </div>
        </div>
      ) : (
        <div className="notice">
          <div className="h2" style={{ margin: 0 }}>
            טיפ
          </div>
          <div className="p" style={{ margin: "6px 0 0" }}>
            רישום להסעה נעשה דרך דף <b>“הרשמה להסעה”</b>. אפשר גם לערוך/לבטל עד זמני הנעילה.
          </div>

          <div className="row" style={{ marginTop: 10 }}>
            <Link className="btn btnPrimary" to="/register">
              הרשמה להסעה
            </Link>
            <Link className="btn" to="/my">
              ההרשמות שלי
            </Link>
          </div>
        </div>
      )}
    </>
  );
}